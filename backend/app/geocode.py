import threading
import time

import httpx
from fastapi import HTTPException


class Geocoder:
    """Explicit Malaysia destination searches, cached and limited to 1 request/s.

    Run one API worker with the public OSM endpoint. Configure a different
    provider before horizontally scaling; the public limit is per application.
    """
    def __init__(self, http, url):
        self.http, self.url = http, url
        self.lock, self.cache, self.last = threading.Lock(), {}, 0

    def search(self, query):
        key = query.strip().casefold()
        with self.lock:
            now = time.monotonic()
            cached = self.cache.get(key)
            if cached and now-cached[0] < 300:
                return cached[1]
            time.sleep(max(0, 1-(now-self.last)))
            self.last = time.monotonic()
            try:
                response = self.http.get(self.url, params={'q': query.strip(), 'format': 'jsonv2', 'limit': 3, 'countrycodes': 'my'},
                    headers={'User-Agent': 'BUCKL/0.4c (https://github.com/aarntn/Dormathon-LaPeace-Taylors)'})
                response.raise_for_status()
                rows = [{'lat': float(row['lat']), 'lng': float(row['lon']), 'name': row['display_name']} for row in response.json()]
            except (httpx.HTTPError, ValueError, KeyError, TypeError) as error:
                raise HTTPException(503, 'Destination search is unavailable. Try again later.') from error
            if len(self.cache) >= 100:
                self.cache.clear()
            self.cache[key] = (time.monotonic(), rows)
            return rows
