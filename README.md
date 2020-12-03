# Outage detector

Constantly ping (every 10s) an AWS-hosted API, tracking and notifying when an outage is detected.

### Parts

A CDK based stack spins up an API gateway with one route called "checkin". This route calls a lambda which stores the number of checkins per reporter and last time seen in a dynamodb table. Another dynamodb table is populated when an outage is detected, noting how long and how many missed checkins. Also, a notice is raised to an SNS topic when an outage occurred. I simply manually subscribed this to my e-mail to be notified when an outage is resolved.

Additionally, a script is added that can run on an ESP32 that will do the ping on a timer.

### API
One endpoint exists: `GET /<reporter>/checkin?pingId=<n>` with optional parameters `outage=<ms>&missed=<numpings>`.

### Deploying

    npm install
    cdk deploy

### See also

This is inspired by an idea shared in https://github.com/SuperMakeSomething/nodemcu-internet-outage-monitor, but instead of having the device send an e-mail, I wanted to have a cloud-hosted data store with this information.

The ESP32 code is based on the example in https://github.com/espressif/arduino-esp32/blob/master/libraries/HTTPClient/examples/BasicHttpsClient/BasicHttpsClient.ino.

Much of the CDK and Lambda approach is directly influenced by what I learned in a great tutorial from cdkworkshop.com.