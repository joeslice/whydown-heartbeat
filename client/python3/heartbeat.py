#!/usr/bin/python3

import requests
import time


baseUrl = "..."
reporter = "..."

pingId = 0
lastSuccessfulPing = 0
lastPingSuccessful = True

while True:
    pingId = pingId + 1
    url = baseUrl + "/" + reporter + "/checkin"
    params = {
        'pingId': pingId
    }

    if not lastPingSuccessful:
        params["missed"] = pingId - lastPingSuccessful - 1

    try:
        print("requesting ping", pingId)
        if requests.get(url, params=params):
            lastPingSuccessful = True
            lastSuccessfulPing = pingId
            print("success")
        else:
            lastPingSuccessful = False
            print("failure")
    except:
        lastPingSuccessful = False

    time.sleep(10)

