# Heartbeat server

Reporters call `/<reporter>/checkin` occasionally and expect a 204 reponse code. If failures occur, arguments `outage=<ms>&missed=<numMissed>` can also be supplied. The checkin is stored in a persistent datastore and upon `outage` or `missed`, an SNS message is raised.

## API

The checkin endpoint is: `GET /<reporter>/checkin?pingId=<n>` with optional parameters `outage=<ms>&missed=<numpings>`.

Query for latest checkin and outages at `GET /<reporter>/query`.

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