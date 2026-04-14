# Outage detector

Constantly ping (every 10s) an AWS-hosted API, tracking and notifying when an outage is detected.

## Parts

### Cloud-side

A CDK based stack spins up an API gateway with two routes per reporter:

- `GET /{reporter}/checkin?pingId=<n>` — records a heartbeat; optional `outage=<ms>&missed=<n>` parameters trigger an outage record and SNS notification
- `GET /{reporter}/query` — returns the latest checkin and outage history for a reporter

Checkin data is stored in DynamoDB. When an outage is detected, a second DynamoDB table is written and a notice is raised to an SNS topic. I simply manually subscribed this to my e-mail to be notified when an outage is resolved, but any amount of automation could be added downstream of SNS.

See also [server code](./server).

### Client-side

* A simple script that can run on an ESP32 is [here](./client/esp32).
* A simple python version of the client script is [here](./client/python3).


## Deploying

```
npm install
cdk deploy
```

## See also

This is inspired by an idea shared in https://github.com/SuperMakeSomething/nodemcu-internet-outage-monitor, but instead of having the device send an e-mail, I wanted to have a cloud-hosted data store with this information.

The ESP32 code is based on the example in https://github.com/espressif/arduino-esp32/blob/master/libraries/HTTPClient/examples/BasicHttpsClient/BasicHttpsClient.ino.

Much of the CDK and Lambda approach is directly influenced by what I learned in a great tutorial from cdkworkshop.com.