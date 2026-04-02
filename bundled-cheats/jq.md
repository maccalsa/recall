---
title: jq
tags: [jq, json, parsing]
---

## Basics

```bash
echo '{"a":1,"b":[2,3]}' | jq .
jq '.name' file.json
jq -r '.items[].id' file.json    # raw strings (no quotes)
jq -c '.users[]' big.json        # compact one object per line
jq -s 'map(.count) | add' *.json # slurp array of JSON values
```

## Filtering

```bash
jq '.user.name' data.json
jq '.items[] | select(.active == true)' data.json
jq '.items[] | .id' data.json
jq 'paths | select(.[-1] == "email")' data.json
```

## Arrays

```bash
jq '.arr | length' data.json
jq '.arr[0], .arr[-1]' data.json
jq '.arr[2:5]' data.json
jq 'map(.x)' data.json
jq '[.items[].id]' data.json
jq 'sort_by(.date)' data.json
jq 'unique' data.json
jq 'group_by(.type)' data.json
```

## Objects

```bash
jq '. | keys' data.json
jq '.user | keys' data.json
jq 'del(.password)' data.json
jq '. + {"extra": true}' data.json
jq 'with_entries(.key |= ascii_upcase)' data.json
```

## String Operations

```bash
jq -r '.email | split("@")[0]' data.json
jq -r '.path | split("/") | .[-1]' data.json
jq '.s | startswith("http")' data.json
jq '.s | test("^[0-9]+$")' data.json
jq '.s | gsub(" "; "_")' data.json
```

## Conditionals

```bash
jq 'if .status == "ok" then .data else empty end' data.json
jq '.count // 0' data.json
jq 'try .x catch "err"' data.json
```

## Built-in Functions

```bash
jq 'now | strftime("%Y-%m-%d")' <<< '{}'
jq 'fromdateiso8601' <<< '"2024-01-15T12:00:00Z"'
jq '@base64d' <<< '"SGVsbG8="' 
jq 'paths(type == "string")' data.json
jq 'walk(if type == "object" then with_entries(.key |= ascii_downcase) else . end)' data.json
```

## Practical Examples

```bash
# Pretty-print GitHub API one-liner
curl -s https://api.github.com/repos/jqlang/jq | jq '{name, stars: .stargazers_count, forks}'

# Merge two JSON files (second wins on keys)
jq -s '.[0] * .[1]' a.json b.json

# CSV-ish from JSON array
jq -r '.users[] | [.id, .name] | @csv' data.json

# NDJSON to array
jq -s '.' lines.ndjson

# Extract env-safe value
jq -r '.token' secrets.json | xclip -selection clipboard
```
