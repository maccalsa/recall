---
title: Rust & Cargo
tags: [rust, cargo, rustup]
---

## Project Setup

```bash
cargo new myapp
cargo new --lib mylib
cd myapp && cargo build
```

## Build & Run

```bash
cargo build
cargo build --release
cargo run
cargo run -- arg1 arg2
cargo check              # fast typecheck without full binary
cargo clean
cargo fix --allow-dirty  # apply machine-applicable suggestions
```

## Dependencies

```toml
# Cargo.toml
[dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

```bash
cargo add serde --features derive
cargo remove serde
cargo update
cargo tree
```

## Testing

```bash
cargo test
cargo test -- --nocapture
cargo test my_filter
cargo bench
```

## Documentation

```bash
cargo doc --open
rustdoc src/lib.rs
```

## Publish

```bash
cargo login
cargo publish --dry-run
cargo publish
```

## Rustup

```bash
rustup update
rustup default stable
rustup toolchain install nightly
rustup component add rustfmt clippy
rustup target add wasm32-unknown-unknown
rustup show
```

## Common Patterns

```rust
// Result / Option
let x = opt?;
let v = result.unwrap_or_default();

// Iterator
let sum: i32 = (0..10).filter(|&x| x % 2 == 0).sum();

// String
let s = format!("{n}");
let owned: String = "hello".to_owned();
```

```bash
cargo fmt
cargo clippy
cargo clippy -- -D warnings
```
