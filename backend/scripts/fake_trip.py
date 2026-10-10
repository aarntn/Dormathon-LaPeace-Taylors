"""Local integration run: real HTTP + api.ts, with all external services mocked.

Requires requirements-dev.txt. Never loads deployment credentials or sends real SMS.
"""
import json
import socket
import subprocess
import threading
import time
from pathlib import Path

import uvicorn

from backend.tests.test_api import rig


def main():
    root = Path(__file__).resolve().parents[2]
    # Reuse the same explicitly mocked environment as the API tests.
    fixture = rig.__wrapped__()
    environment = next(fixture)
    app = environment['client'].app

    @app.post('/__fake/advance', include_in_schema=False)
    def advance(seconds: int):
        # Exists only on this temporary loopback fixture, never the production app.
        environment['clock'].advance(seconds)
        return {'at': environment['clock'].value.isoformat()}

    listener = socket.socket()
    listener.bind(('127.0.0.1', 0))
    port = listener.getsockname()[1]
    server = uvicorn.Server(uvicorn.Config(app, log_level='error', lifespan='off'))
    thread = threading.Thread(target=server.run, kwargs={'sockets': [listener]}, daemon=True)
    thread.start()
    try:
        deadline = time.monotonic()+10
        while not server.started and time.monotonic() < deadline:
            time.sleep(.02)
        if not server.started:
            raise RuntimeError('Fake integration server failed to start')
        result = subprocess.run(['node', '--experimental-strip-types', str(root/'apps/web/scripts/fake-api-trip.mjs'),
                                 f'http://127.0.0.1:{port}'], cwd=root, text=True, encoding='utf-8', capture_output=True, check=True)
        report = json.loads(result.stdout)
        report['mocked_sms'] = [{'to': m['To'][0], 'body': m['Body'][0]} for m in environment['messages']]
        report['external_services'] = 'Supabase Auth, Twilio, OSRM and Overpass are mocked; storage is in memory.'
        output = root/'docs/review/catch-up-4c-fake-trip.json'
        output.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
        print(json.dumps(report, indent=2))
        print(f'\nSaved {output}')
    finally:
        server.should_exit = True
        thread.join(timeout=5)
        listener.close()
        fixture.close()


if __name__ == '__main__':
    main()
