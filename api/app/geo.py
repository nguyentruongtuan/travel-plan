from math import asin, cos, radians, sin, sqrt
from typing import Iterable

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in kilometres."""
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlmb = radians(lng2 - lng1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_KM * asin(sqrt(a))


def route_distance_km(points: Iterable[tuple[float, float]]) -> float:
    """Sum of straight-line distances between consecutive points."""
    total = 0.0
    prev: tuple[float, float] | None = None
    for p in points:
        if prev is not None:
            total += haversine_km(prev[0], prev[1], p[0], p[1])
        prev = p
    return round(total, 2)
