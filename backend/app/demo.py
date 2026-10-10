"""Scripted car-check results for presentations.

They are used only when the server runs with DEMO_MODE=1, and every result built from them
is returned with ``stub: True`` so the app labels it a demo indication. Nothing here looks at a
photo or a recording. Wording says "possible" or "may", never a diagnosis.
"""

DASHBOARD_SCENARIOS = {
    'overheating': {
        'label': 'Possible engine overheating', 'urgency': 'stop',
        'advice': 'Pull over and switch off the engine. Let it cool for at least 30 minutes. '
                  'Check the coolant tank and top up to the MAX line if it is low. '
                  'If the light comes back on, do not drive on. Get it checked.'},
    'battery': {
        'label': 'Possible battery or charging fault', 'urgency': 'soon',
        'advice': 'Switch off extras such as the air conditioning and the radio. '
                  'Drive to a workshop soon, without switching the engine off on the way. '
                  'Have the battery and alternator tested.'},
    'oil': {
        'label': 'Possible low oil pressure', 'urgency': 'stop',
        'advice': 'Pull over when it is safe and switch off the engine. '
                  'Check the oil level once the engine has cooled. '
                  'Do not drive on if the light stays on. Get the car looked at.'},
    'unreadable': None,
}
STARTUP_SCENARIOS = {'slow': 2.8, 'normal': 1.2, 'quiet': None}


def dashboard_finding(scenario):
    """The scripted finding for a scenario, or None when the photo should count as unreadable."""
    if scenario not in DASHBOARD_SCENARIOS:
        raise KeyError(scenario)
    return DASHBOARD_SCENARIOS[scenario]
