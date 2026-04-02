---
title: Python
tags: [python, py, scripting]
---

## Data Types

```python
x: int = 42
y: float = 3.14
z: bool = True
none_val = None
a, b = 1, 2
x, y = y, x  # swap
```

## Strings

```python
s = f"count={n}"
s = "a\nb"
s.strip().lower().upper()
s.split(",")
",".join(["a", "b"])
s.replace("old", "new")
s.startswith("http")
"{} {:.2f}".format(name, score)
```

## Lists & Tuples

```python
xs = [1, 2, 3]
xs.append(4)
xs.extend([5, 6])
xs[1:3]
xs[::-1]
len(xs), sum(xs), sorted(xs)
pair = (1, "a")  # immutable
```

## Dicts & Sets

```python
d = {"k": 1}
d.get("k", 0)
d.setdefault("k", [])
for k, v in d.items():
    ...
keys = d.keys()
s = {1, 2, 3}
s.add(4)
s1 | s2  # union (3.9+)
```

## Control Flow

```python
if x < 0:
    ...
elif x == 0:
    ...
else:
    ...
for i in range(10):
    ...
for idx, val in enumerate(xs):
    ...
while cond:
    ...
try:
    ...
except ValueError as e:
    ...
finally:
    ...
match x:  # 3.10+
    case 1:
        ...
```

## Functions

```python
def add(a: int, b: int = 0) -> int:
    return a + b

def variadic(*args, **kwargs):
    ...

square = lambda x: x * x
```

## Classes

```python
class Point:
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"Point({self.x}, {self.y})"

class Child(Parent):
    ...
```

## File I/O

```python
with open("f.txt", "r", encoding="utf-8") as f:
    data = f.read()

with open("out.txt", "w", encoding="utf-8") as f:
    f.write("line\n")

from pathlib import Path
text = Path("f.txt").read_text(encoding="utf-8")
```

## Modules

```python
import os
from pathlib import Path
from typing import List, Optional

if __name__ == "__main__":
    main()
```

## Virtual Environments

```bash
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
.venv\Scripts\activate             # Windows
pip install -r requirements.txt
pip freeze > requirements.txt
deactivate
```
