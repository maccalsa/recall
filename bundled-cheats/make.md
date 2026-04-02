---
title: Make
tags: [make, makefile, build]
---

## Basics

```makefile
target: deps
	tab-prefixed commands

all: build

build:
	cc -o app main.c

clean:
	rm -f app
```

```bash
make
make target
make -j$(nproc)
make -n        # dry run
```

## Variables

```makefile
CC := gcc
CFLAGS ?= -O2
OBJ := main.o util.o

app: $(OBJ)
	$(CC) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $<
```

- `=` recursive (lazy)
- `:=` simple (immediate)
- `?=` set if unset
- `+=` append

## Pattern Rules

```makefile
%.o: %.c
	$(CC) -c $(CFLAGS) -o $@ $<

vpath %.c src
```

## Functions

```makefile
SRC := $(wildcard src/*.c)
OBJ := $(patsubst %.c,%.o,$(SRC))
DIR := $(dir $(SRC))
NAMES := $(notdir $(SRC))
EMPTY := $(filter-out a b,a b c)
```

## Phony Targets

```makefile
.PHONY: clean test all

clean:
	rm -f *.o app

test: app
	./run-tests.sh
```

## Conditionals

```makefile
ifeq ($(DEBUG),1)
CFLAGS += -g
else
CFLAGS += -O2
endif

ifdef CI
  EXTRA := --ci
endif
```

## Common Patterns

```makefile
# Default goal
.DEFAULT_GOAL := all

# Fail on undefined variables
MAKEFLAGS += --warn-undefined-variables

# Pass args: make run ARGS='-v'
run: app
	./app $(ARGS)

# Include generated deps
-include $(OBJ:.o=.d)
```
