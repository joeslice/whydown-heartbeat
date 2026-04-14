# Heartbeat server

Reporters call `/<reporter>/checkin` occasionally and expect a 204 response code. If failures occur, arguments `outage=<ms>&missed=<numMissed>` can also be supplied. The checkin is stored in a persistent datastore and upon `outage` or `missed`, an SNS message is raised.

## API

### `GET /<reporter>/checkin`

| Parameter | Location | Required | Description |
|---|---|---|---|
| `reporter` | path | yes | Identifies the reporting device |
| `pingId` | query | yes | Monotonically increasing ping counter |
| `outage` | query | no | Duration of the detected outage in milliseconds |
| `missed` | query | no | Number of pings missed during the outage |

Returns `204` on success. Returns `400` if `reporter` or `pingId` are absent.

When `outage` or `missed` is provided, an outage record is written to DynamoDB and an SNS notification is published.

### `GET /<reporter>/query`

| Parameter | Location | Required |
|---|---|---|
| `reporter` | path | yes |

Returns `200` with JSON body:

```json
{
  "checkin": { "reporter": "...", "lastPing": "...", "checkinTime": 1234567890.0 },
  "outages": [ ... ],
  "outageCount": 0
}
```

Returns `400` if `reporter` is absent.

## Example

```bash
$ curl 'https://....execute-api.us-east-1.amazonaws.com/flaky-reporter/checkin?pingId=1'
# returns 204
$ curl 'https://....execute-api.us-east-1.amazonaws.com/flaky-reporter/checkin?pingId=2'
# returns 204
$ curl 'https://....execute-api.us-east-1.amazonaws.com/flaky-reporter/checkin?pingId=4&missed=1&outage=30001'
# returns 204
$ curl 'https://....execute-api.us-east-1.amazonaws.com/flaky-reporter/query' | jq .
{
  "checkin": {
    "lastPing": "4",
    "reporter": "flaky-reporter",
    "checkinTime": 1610771484.297
  },
  "outages": [
    {
      "missed": "1",
      "reporter": "flaky-reporter",
      "checkinTime": 1610771484.299,
      "outage": "30001"
    }
  ],
  "outageCount": 1
}

```