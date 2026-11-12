from app.geo import haversine_km, route_distance_km


def test_haversine_zero():
    assert haversine_km(10, 20, 10, 20) == 0


def test_haversine_hanoi_to_hcmc():
    # Hanoi -> Ho Chi Minh City is roughly 1,140 km as the crow flies.
    d = haversine_km(21.0285, 105.8542, 10.8231, 106.6297)
    assert 1100 < d < 1180


def test_route_distance_sums_legs():
    pts = [(0, 0), (0, 1), (0, 2)]
    assert route_distance_km(pts) == round(2 * haversine_km(0, 0, 0, 1), 2)


def test_route_distance_empty_and_single():
    assert route_distance_km([]) == 0
    assert route_distance_km([(1, 1)]) == 0
