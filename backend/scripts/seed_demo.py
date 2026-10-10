"""Fill a demo account with believable data (a car, a contact, twelve trips over six weeks, two car checks).

    python -m backend.scripts.seed_demo --email you@example.com --password '...' [--name Aaron] [--force]
    python -m backend.scripts.seed_demo --dry-run          # in memory, writes nothing anywhere

It signs in as that user (create the account in the app first) and writes through Supabase with the
user's own token, so row-level security applies. Reads SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from
the environment or backend/.env. It never sends a text and never needs a service-role key.
"""
import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

from backend.app.config import Settings
from backend.app.demo_seed import seed
from backend.app.repository import MemoryRepository, SupabaseRepository


def load_env():
    path = Path(__file__).resolve().parents[1] / '.env'
    if path.exists():
        for line in path.read_text(encoding='utf8').splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--email')
    parser.add_argument('--password')
    parser.add_argument('--name', default='Aaron')
    parser.add_argument('--force', action='store_true', help='add even if the account already has trips')
    parser.add_argument('--dry-run', action='store_true', help='use an in-memory store and write nothing')
    args = parser.parse_args(argv)
    now = datetime.now(timezone.utc)
    if args.dry_run:
        counts = seed(MemoryRepository(), 'dry-run-user', now, args.name)
        print('Dry run only. Would create:', {k: v for k, v in counts.items() if k != 'car'})
        return 0
    if not (args.email and args.password):
        parser.error('--email and --password are required (or use --dry-run)')
    load_env()
    settings = Settings()
    if not settings.supabase_ready:
        print('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or fill backend/.env).', file=sys.stderr)
        return 2
    with httpx.Client(timeout=20) as http:
        response = http.post(settings.supabase_url + '/auth/v1/token', params={'grant_type': 'password'},
                             headers={'apikey': settings.supabase_key}, json={'email': args.email, 'password': args.password})
        if response.status_code != 200:
            print('Sign-in failed. Create and confirm the account in the app first.', file=sys.stderr)
            return 1
        session = response.json()
        counts = seed(SupabaseRepository(settings, http, session['access_token']), session['user']['id'], now, args.name, args.force)
    print('Seeded:', {k: v for k, v in counts.items() if k != 'car'})
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
