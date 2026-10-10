import time

import httpx


def deliver(repo, user_id, contact, alert_id, key, body, settings, http, now):
    current_time = now if callable(now) else lambda: now
    row, _ = repo.unique('sms_deliveries', {'user_id': user_id, 'contact_id': contact['id'], 'alert_id': alert_id,
        'delivery_key': key, 'body': body, 'at': current_time().isoformat(), 'status': 'pending', 'attempts': 0}, ['user_id', 'delivery_key'])
    if row['status'] in ('sent', 'sending', 'unknown'):
        return row
    claimed = repo.update('sms_deliveries', {'id': row['id'], 'status': row['status']},
                          {'status': 'sending', 'body': body, 'claimed_at': current_time().isoformat()})
    if not claimed:
        return repo.select('sms_deliveries', id=row['id'])[0]
    result = {'status': 'failed', 'attempts': row.get('attempts', 0)}
    if settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from:
        for attempt in range(3):
            result['attempts'] += 1
            try:
                response = http.post(f'https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json',
                    auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                    data={'To': contact['phone'], 'From': settings.twilio_from, 'Body': claimed[0]['body']})
                if response.status_code == 201:
                    result |= {'status': 'sent', 'provider_sid': response.json()['sid'], 'sent_at': current_time().isoformat()}
                    break
                if response.status_code == 429:
                    # A definite rejected submission can be retried without duplicating an accepted SMS.
                    if attempt < 2:
                        time.sleep(.05 * (2**attempt))
                    continue
                if response.status_code >= 500:
                    result['status'] = 'unknown'
                break
            except (httpx.ConnectError, httpx.ConnectTimeout):
                continue
            except (httpx.HTTPError, ValueError, KeyError):
                # Response lost after submission: don't blindly send another SMS.
                result['status'] = 'unknown'
                break
    return repo.update('sms_deliveries', {'id': row['id']}, result)[0]
