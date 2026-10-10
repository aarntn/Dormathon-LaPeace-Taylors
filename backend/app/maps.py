from math import cos, radians
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from .scoring import distance


def links(lat, lng):
    return {'waze_url': 'https://www.waze.com/ul?' + urlencode({'ll': f'{lat},{lng}', 'navigate': 'yes'}),
            'google_maps_url': 'https://www.google.com/maps/dir/?' + urlencode({'api': 1, 'destination': f'{lat},{lng}'})}


def coordinate(raw):
    try:
        lat, lng = [float(v) for v in raw.split(',')]
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise ValueError()
        return {'lat': lat, 'lng': lng}
    except ValueError as error:
        raise HTTPException(422, 'Coordinates must be lat,lng within valid ranges') from error


def overpass(http, query):
    response = http.post('https://overpass-api.de/api/interpreter', data={'data': query})
    response.raise_for_status()
    return response.json()['elements']


def position(element):
    centre = element.get('center', element)
    return {'lat': centre['lat'], 'lng': centre['lon']}


def workshops(http, lat, lng, service):
    query = f'[out:json][timeout:15];(nwr(around:15000,{lat},{lng})[shop=car_repair];nwr(around:15000,{lat},{lng})[shop=tyres];nwr(around:15000,{lat},{lng})[shop=car_parts];nwr(around:15000,{lat},{lng})[amenity=fuel];);out center tags;'
    try:
        elements = overpass(http, query)
    except (httpx.HTTPError, ValueError, KeyError):
        return {'workshops': [], 'stub': True, 'message': 'Workshop search is temporarily unavailable.'}
    result = []
    for element in elements:
        tags = element.get('tags', {})
        shop = tags.get('shop')
        repair = shop == 'car_repair'
        service_keys = [f'service:vehicle:{service}', f'service:car:{service}', f'service:{service}']
        if any(tags.get(key, '').lower() == 'no' for key in service_keys):
            continue
        matched = any(tags.get(key, '').lower() in ('yes', 'only', 'designated') for key in
            service_keys)
        eligible = repair or (service == 'tyres' and shop == 'tyres') or (service == 'battery' and shop == 'car_parts') or (service == 'fuel' and tags.get('amenity') == 'fuel')
        if not eligible:
            continue
        p = position(element)
        matched = matched or (service == 'tyres' and shop == 'tyres') or (service == 'fuel' and tags.get('amenity') == 'fuel')
        result.append({'osm_id': f"{element['type']}/{element['id']}", 'name': tags.get('name', 'Workshop'),
            **p, 'distance_km': round(distance({'lat': lat, 'lng': lng}, p), 3),
            'opening_hours': tags.get('opening_hours'), 'phone': tags.get('phone', tags.get('contact:phone')),
            'service_match': matched, **links(p['lat'], p['lng'])})
    return {'workshops': sorted(result, key=lambda s: (not s['service_match'], s['distance_km']))[:30], 'stub': False}


def rest_stops(http, lat, lng):
    try:
        elements = overpass(http, f'[out:json][timeout:15];nwr(around:15000,{lat},{lng})[highway~"^(rest_area|services)$"];out center tags;')
        return {'rest_stops': [{'name': e.get('tags', {}).get('name', 'Rest stop'), **position(e), **links(**{'lat': position(e)['lat'], 'lng': position(e)['lng']})}
                              for e in elements if e.get('tags', {}).get('highway') in ('rest_area', 'services')], 'stub': False}
    except (httpx.HTTPError, ValueError, KeyError):
        return {'rest_stops': [], 'stub': True}


def route_distance(point, line):
    """Distance to route segments, rather than sparse route vertices (kilometres)."""
    best = float('inf')
    scale = cos(radians(point['lat']))
    px, py = point['lng']*scale, point['lat']
    for a, b in zip(line, line[1:]):
        ax, ay, bx, by = a[1]*scale, a[0], b[1]*scale, b[0]
        dx, dy = bx-ax, by-ay
        fraction = max(0, min(1, ((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))) if dx or dy else 0
        best = min(best, ((px-ax-fraction*dx)**2+(py-ay-fraction*dy)**2)**.5*111.195)
    return best


def route_options(http, start, end):
    explanation = 'Safer means more rest areas, fuel stations and workshops within 1 km of the route. It is not a prediction of driving risk.'
    try:
        response = http.get(f"https://router.project-osrm.org/route/v1/driving/{start['lng']},{start['lat']};{end['lng']},{end['lat']}",
                            params={'alternatives': 'true', 'overview': 'full', 'geometries': 'geojson'})
        response.raise_for_status()
        raw = response.json()
        if raw.get('code') != 'Ok' or not raw.get('routes'):
            raise ValueError('No route')
        routes = [{'distance_km': round(r['distance']/1000, 3), 'duration_seconds': round(r['duration']),
                   'route_polyline': [[lat, lng] for lng, lat in r['geometry']['coordinates']], 'support_count': 0, 'stops': [], 'stub': False} for r in raw['routes']]
    except (httpx.HTTPError, ValueError, KeyError):
        km = distance(start, end)
        fallback = {'distance_km': round(km, 3), 'duration_seconds': round(km/50*3600),
                    'route_polyline': [[start['lat'], start['lng']], [end['lat'], end['lng']]], 'support_count': 0,
                    'stops': [], 'stub': True, 'message': 'Demo straight-line estimate; road routing unavailable.'}
        return {'fastest': fallback | {'choice': 'fastest'}, 'safer': fallback | {'choice': 'safer'}, 'explanation': explanation, 'stub': True}
    all_points = [p for r in routes for p in r['route_polyline']]
    south, north = min(p[0] for p in all_points)-.02, max(p[0] for p in all_points)+.02
    west, east = min(p[1] for p in all_points)-.02, max(p[1] for p in all_points)+.02
    bbox = f'{south},{west},{north},{east}'
    try:
        # Bound the demo query; don't query half a continent for an arbitrary URL.
        if north-south > 5 or east-west > 5 or len(all_points) > 15000:
            raise ValueError('Route too large for demo support search')
        elements = overpass(http, f'[out:json][timeout:15];(nwr({bbox})[highway~"^(rest_area|services)$"];nwr({bbox})[amenity=fuel];nwr({bbox})[shop=car_repair];);out center tags;')
        unique = {(e['type'], e['id']): e for e in elements}
        for route in routes:
            # Thin long polylines so matching stays fast on a small server (about 400 segments per route).
            line = route['route_polyline']
            route['match_line'] = line[::max(1, len(line)//400)] + [line[-1]]
        for route in routes:
            for element in unique.values():
                tags, p = element.get('tags', {}), position(element)
                if not (tags.get('highway') in ('rest_area', 'services') or tags.get('amenity') == 'fuel' or tags.get('shop') == 'car_repair'):
                    continue
                if route_distance(p, route['match_line']) <= 1:
                    route['stops'].append({'name': tags.get('name', 'Roadside stop'), **p})
            route['support_count'] = len(route['stops'])
    except (httpx.HTTPError, ValueError, KeyError):
        for route in routes:
            route['stub'] = True
            route['message'] = 'Roadside support counts are unavailable.'
    for route in routes:
        route.pop('match_line', None)
    fastest = min(routes, key=lambda r: r['duration_seconds'])
    safer = max(routes, key=lambda r: (r['support_count'], -r['duration_seconds']))
    return {'fastest': fastest | {'choice': 'fastest'}, 'safer': safer | {'choice': 'safer'},
            'explanation': explanation, 'stub': any(r['stub'] for r in routes)}
