---
title: Regular Expressions
tags: [regex, regexp, pattern-matching]
---

## Basic Syntax

```regex
abc              # literal "abc"
a\.b             # escaped dot
```

## Character Classes

```regex
[abc]            # one of a, b, c
[^abc]           # not a, b, or c
[a-z0-9]
\d \D            # digit / non-digit (PCRE, Perl, many engines)
\w \W            # word / non-word
\s \S            # whitespace / non-whitespace
```

## Quantifiers

```regex
a*               # zero or more
a+               # one or more
a?               # zero or one
a{3}             # exactly 3
a{3,}            # 3 or more
a{3,5}           # 3 to 5
```

Greedy vs lazy (where supported): `.*?` matches minimally.

## Anchors

```regex
^start           # line/string start
end$             # line/string end
\bword\b         # word boundary (many flavors)
```

## Groups & Backreferences

```regex
(ab)+            # capturing group
\1               # first group (syntax varies by engine)
(?:ab)           # non-capturing group
```

## Lookahead & Lookbehind

(PCRE, Perl, Java, JS with flag; not in basic `grep`.)

```regex
foo(?=bar)       # foo followed by bar (assertion)
foo(?!bar)       # foo not followed by bar
(?<=prefix)foo   # lookbehind
```

## Common Patterns

```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$   # simple email
^\d{1,3}(\.\d{1,3}){3}$                            # rough IPv4
https?://[^\s]+                                     # URL-ish
```

## Tool-specific Notes (grep, sed, JS, Python)

**grep (basic vs extended):** Basic: `\+`, `\|`, `\(\)` often need backslashes; use `grep -E` for extended. GNU `grep -P` enables PCRE.

**sed:** Often POSIX BRE; use `sed -E` for ERE on modern systems. Delimiters: `s|||`.

**JavaScript:** Literal regex `/pattern/flags`; flags `g`, `i`, `m`, `s`, `u`, `y`. No lookbehind in very old engines; modern JS has lookahead/lookbehind.

**Python `re`:** Raw strings `r"\d+"`; `re.MULTILINE`, `re.DOTALL`. Prefer raw strings to avoid escape issues.

```python
import re
re.findall(r"\b\w+\b", text)
```

```javascript
const m = text.match(/\d+/g);
```
