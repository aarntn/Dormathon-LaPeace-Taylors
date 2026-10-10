from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False, str_strip_whitespace=True)


class Position(Input):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class TimedPosition(Position):
    at: datetime

    @field_validator('at')
    @classmethod
    def aware(cls, value):
        if value.tzinfo is None:
            raise ValueError('Timestamp must include its timezone')
        return value


class Point(TimedPosition):
    speed_kmh: float | None = Field(default=None, ge=0, le=400)


class PointBatch(Input):
    points: list[Point] = Field(min_length=1, max_length=500)


class PreDrive(Input):
    slept: float = Field(ge=0, le=24)
    awake: float = Field(ge=0, le=72)
    taps_ms: list[Annotated[float, Field(gt=0, le=10000)]] = Field(min_length=1, max_length=100)
    misses: int = Field(ge=0, le=100)
    hour: int = Field(ge=0, le=23)
    alert_self: Literal['very_alert', 'ok', 'bit_tired', 'very_tired']
    trip_length: Literal['under_30', '30_60', '1_2h', 'over_2h']
    face_perclos: float = Field(ge=0, le=1)
    face_mean_blink_ms: float = Field(ge=0, le=10000)
    face_yawns: int = Field(ge=0, le=100)


class TripInput(Input):
    car_id: UUID
    predrive_id: UUID | None = None
    origin: Position | None = None
    destination: Position | None = None
    passenger_mode: bool = False
    route_choice: Literal['safer', 'fastest'] = 'fastest'


class Event(TimedPosition):
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    kind: Literal['tired', 'microsleep', 'not_responding', 'lost', 'yawn', 'hard_brake']
    details: dict = Field(default_factory=dict)


class Features(Input):
    perclos: float = Field(ge=0, le=1)
    blink_rate: float = Field(ge=0, le=200)
    mean_blink_ms: float = Field(ge=0, le=10000)
    yawns: int = Field(ge=0)
    minutes_driving: float = Field(ge=0)
    hour_of_day: int = Field(ge=0, le=23)
    hard_brakes: int = Field(default=0, ge=0)


class Profile(Input):
    name: str = Field(min_length=1, max_length=80)


class Contact(Profile):
    phone: str = Field(pattern=r'^\+[1-9]\d{7,14}$')
    share_live_location: bool = True
    text_when_ok: bool = True


class ContactUpdate(Input):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    phone: str | None = Field(default=None, pattern=r'^\+[1-9]\d{7,14}$')
    share_live_location: bool | None = None
    text_when_ok: bool | None = None


class Car(Input):
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=80)
    year: int = Field(ge=1950, le=2100)
    plate: str | None = Field(default=None, max_length=20)
    colour: str | None = None
    gearbox: str | None = None
    mileage_km: int | None = Field(default=None, ge=0)
    last_service_month: str | None = None
    last_service_km: int | None = Field(default=None, ge=0)
    battery_changed: Literal['under_1y', '1_2y', 'over_2y'] | None = None
