from copy import deepcopy
from threading import RLock
from uuid import uuid4

import httpx
from fastapi import HTTPException


class SupabaseRepository:
    """Forward the verified user's JWT; database RLS remains in effect."""
    def __init__(self, settings, http: httpx.Client, token: str):
        self.url = settings.supabase_url + '/rest/v1/'
        self.http = http
        self.headers = {'apikey': settings.supabase_key, 'Authorization': f'Bearer {token}'}

    def request(self, method, table, *, params=None, body=None, preference='return=representation'):
        try:
            response = self.http.request(method, self.url + table, params=params, json=body,
                headers=self.headers | {'Prefer': preference})
            if response.status_code == 409:
                raise HTTPException(409, 'Conflicting record')
            if response.status_code >= 400:
                raise HTTPException(503, 'Database request failed')
            return response.json() if response.content else []
        except httpx.HTTPError as error:
            raise HTTPException(503, 'Database unavailable') from error

    def select(self, table, **filters):
        # Paginate: a long trip routinely exceeds Supabase's default 1000-row limit.
        rows, offset = [], 0
        while True:
            page = self.request('GET', table, params={'select': '*', **{k: f'eq.{v}' for k, v in filters.items()},
                                                       'order': 'id', 'limit': 1000, 'offset': offset})
            rows.extend(page)
            if len(page) < 1000:
                return rows
            offset += 1000

    def insert(self, table, row):
        return self.request('POST', table, body=row)[0]

    def unique(self, table, row, keys):
        inserted = self.request('POST', table, body=row, params={'on_conflict': ','.join(keys)},
            preference='resolution=ignore-duplicates,return=representation')
        return (inserted[0], True) if inserted else (self.select(table, **{k: row[k] for k in keys})[0], False)

    def update(self, table, filters, values):
        return self.request('PATCH', table, params={k: f'eq.{v}' for k, v in filters.items()}, body=values)

    def batch_points(self, rows):
        return self.request('POST', 'trip_points', params={'on_conflict': 'trip_id,at'}, body=rows,
            preference='resolution=ignore-duplicates,return=representation')


class MemoryRepository:
    """Test double only. The production app never selects this store implicitly."""
    def __init__(self):
        self.tables = {}
        self.lock = RLock()

    def select(self, table, **filters):
        with self.lock:
            return deepcopy([r for r in self.tables.get(table, []) if all(str(r.get(k)) == str(v) for k, v in filters.items())])

    def insert(self, table, row):
        with self.lock:
            saved = {'id': str(uuid4()), **deepcopy(row)}
            self.tables.setdefault(table, []).append(saved)
            return deepcopy(saved)

    def unique(self, table, row, keys):
        with self.lock:
            existing = self.select(table, **{k: row[k] for k in keys})
            return (existing[0], False) if existing else (self.insert(table, row), True)

    def update(self, table, filters, values):
        with self.lock:
            matched = []
            for row in self.tables.get(table, []):
                if all(str(row.get(k)) == str(v) for k, v in filters.items()):
                    row.update(deepcopy(values)); matched.append(deepcopy(row))
            return matched

    def batch_points(self, rows):
        return [saved for row in rows for saved, added in [self.unique('trip_points', row, ['trip_id', 'at'])] if added]
