#!/usr/bin/python3

import requests
import time


baseUrl = "..."
reporter = "..."

pingId = 0
lastSuccessfulPing = 0
lastSuccessTime = time.time()
lastPingSuccessful = True

while True:
    pingId = pingId + 1
    start = time.time()
    url = baseUrl + "/" + reporter + "/checkin"
    params = {
        'pingId': pingId
    }

    if not lastPingSuccessful:
        params["missed"] = pingId - lastSuccessfulPing - 1
        params["outage"] = int(start - lastSuccessTime)

    try:
        print("requesting ping", pingId)
        if requests.get(url, params=params):
            lastPingSuccessful = True
            lastSuccessfulPing = pingId
            lastSuccessTime = start
            print("success")
        else:
            lastPingSuccessful = False
            print("failure")
    except:
        lastPingSuccessful = False

    time.sleep(10)

