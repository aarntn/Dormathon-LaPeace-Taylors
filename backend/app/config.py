import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    geocode_url: str = field(default_factory=lambda: os.getenv('GEOCODE_URL', 'https://nominatim.openstreetmap.org/search'))
    supabase_url: str = field(default_factory=lambda: os.getenv('SUPABASE_URL', '').rstrip('/'))
    supabase_key: str = field(default_factory=lambda: os.getenv('SUPABASE_PUBLISHABLE_KEY', ''))
    twilio_account_sid: str = field(default_factory=lambda: os.getenv('TWILIO_ACCOUNT_SID', ''))
    twilio_auth_token: str = field(default_factory=lambda: os.getenv('TWILIO_AUTH_TOKEN', ''))
    twilio_from: str = field(default_factory=lambda: os.getenv('TWILIO_FROM_NUMBER', ''))
    cors_origins: list[str] = field(default_factory=lambda: os.getenv('CORS_ORIGINS', 'https://localhost:5173,https://172.20.10.4:5173').split(','))

    @property
    def supabase_ready(self):
        return bool(self.supabase_url and self.supabase_key)
