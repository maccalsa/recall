---
title: curl
tags: [curl, http, api, networking]
---

## Basic Requests

```bash
curl https://api.example.com/v1/items
curl -X GET https://api.example.com/v1/items/42
curl -I https://example.com          # HEAD only (headers)
curl -L https://bit.ly/foo           # follow redirects
curl -o out.html https://example.com
curl -O https://example.com/file.zip # save remote filename
```

## Headers

```bash
curl -H "Accept: application/json" https://api.example.com
curl -H "Content-Type: application/json" -d '{}' https://api.example.com
curl -D headers.txt https://example.com   # dump response headers to file
curl -v https://example.com               # verbose (request + response headers)
```

## Authentication

```bash
curl -u user:password https://api.example.com
curl -H "Authorization: Bearer $TOKEN" https://api.example.com
curl --oauth2-bearer "$TOKEN" https://api.example.com
curl --cert client.pem --key key.pem https://api.example.com
curl --digest -u user:pass https://api.example.com
```

## POST/PUT/PATCH

```bash
curl -X POST https://api.example.com/items -d '{"name":"x"}' -H "Content-Type: application/json"
curl -d @payload.json https://api.example.com/items
curl -X PUT https://api.example.com/items/1 -d @body.json -H "Content-Type: application/json"
curl -X PATCH https://api.example.com/items/1 -d '{"status":"done"}' -H "Content-Type: application/json"
curl -F "file=@photo.jpg" https://api.example.com/upload
curl -F "name=test" -F "file=@doc.pdf" https://api.example.com/upload
```

## Download

```bash
curl -O https://example.com/big.iso
curl -C - -O https://example.com/big.iso    # resume
curl -o myname.zip https://example.com/a.zip
curl --limit-rate 500k -O https://example.com/big.bin
```

## Cookies

```bash
curl -c cookies.txt https://example.com/login
curl -b cookies.txt https://example.com/app
curl -b "session=abc123" https://example.com
```

## Debugging

```bash
curl -v https://example.com              # verbose
curl -w "@curl-format.txt" -o /dev/null -s https://example.com
# curl-format.txt example: time_namelookup:%{time_namelookup}\n time_connect:%{time_connect}\n
curl --trace-ascii trace.txt https://example.com
curl --resolve example.com:443:127.0.0.1 https://example.com
```

## Common Options

| Option | Meaning |
|--------|---------|
| `-s` | Silent (no progress meter) |
| `-S` | Show errors when silent |
| `-f` | Fail on HTTP 4xx/5xx |
| `-k` | Insecure TLS (skip verify) |
| `--compressed` | Request gzip/deflate |
| `-m SEC` | Max time for whole operation |
| `--connect-timeout SEC` | Connection timeout |
| `-x http://proxy:8080` | HTTP proxy |
| `-4` / `-6` | Force IPv4 / IPv6 |
