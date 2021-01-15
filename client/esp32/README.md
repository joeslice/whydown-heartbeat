## Esp32 testing utility

### Description

Every 10s, issues a request to `https://....execute-api.us-east-1.amazonaws.com/<reporter>/checkin?pingId=...`, expecting a 204 response. If a call fails, the device lights up and begins tracking the number of sequential failures. After a failure, successive calls include query string parameters `missed=<num_missed_pings (min=1)>` and `outage=<ms_since_previous_success>`.

This information can then be used server-side for reporting. See [server](../../server) code in this repo.

### Certificate Age

Here after November 21, 2021 ?

```
time curl -v https://<host>.execute-api.us-east-1.amazonaws.com/<name>/checkin\?pingId\=3
*   Trying <ip>:443...
* TCP_NODELAY set
* Connected to <host>.execute-api.us-east-1.amazonaws.com (<ip>) port 443 (#0)
* ALPN, offering h2
* ALPN, offering http/1.1
* successfully set certificate verify locations:
*   CAfile: /etc/ssl/certs/ca-certificates.crt
  CApath: /etc/ssl/certs
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-RSA-AES128-GCM-SHA256
* ALPN, server accepted to use h2
* Server certificate:
*  subject: CN=*.execute-api.us-east-1.amazonaws.com
*  start date: Oct 22 00:00:00 2020 GMT
*  expire date: Nov 21 23:59:59 2021 GMT
*  subjectAltName: host "<host>.execute-api.us-east-1.amazonaws.com" matched cert's "*.execute-api.us-east-1.amazonaws.com"
*  issuer: C=US; O=Amazon; OU=Server CA 1B; CN=Amazon
*  SSL certificate verify ok.
* Using HTTP2, server supports multi-use
* Connection state changed (HTTP/2 confirmed)
* Copying HTTP/2 data in stream buffer to connection buffer after upgrade: len=0
* Using Stream ID: 1 (easy handle 0x55fc1c167df0)
> GET /<name>/checkin?pingId=3 HTTP/2
> Host: <host>.execute-api.us-east-1.amazonaws.com
> user-agent: curl/7.68.0
> accept: */*
> 
* Connection state changed (MAX_CONCURRENT_STREAMS == 128)!
< HTTP/2 204 
< date: Fri, 15 Jan 2021 23:00:58 GMT
< apigw-requestid: ZNm6ogGUoAMEPWg=
< 
* Connection #0 to host <host>.execute-api.us-east-1.amazonaws.com left intact
curl -s -v   0.04s user 0.01s system 0% cpu 7.202 total
```
