.PHONY: help install dev dev-ui build bundle check lint fmt fmt-check test test-js test-rust clean

help:
	@echo "Recall developer commands"
	@echo ""
	@echo "Setup"
	@echo "  make install      Install JS dependencies"
	@echo ""
	@echo "Development"
	@echo "  make dev          Run Tauri development app"
	@echo "  make dev-ui       Run Vite frontend only"
	@echo ""
	@echo "Build"
	@echo "  make build        Build frontend assets"
	@echo "  make bundle       Build Tauri release bundles (.deb/.AppImage)"
	@echo ""
	@echo "Quality"
	@echo "  make check        Run TypeScript/Svelte checks"
	@echo "  make lint         Run Rust clippy and JS formatting check"
	@echo "  make fmt          Format Rust + frontend files"
	@echo "  make fmt-check    Check formatting for Rust + frontend files"
	@echo ""
	@echo "Tests"
	@echo "  make test         Run JS and Rust tests"
	@echo "  make test-js      Run JS tests only"
	@echo "  make test-rust    Run Rust tests only"
	@echo ""
	@echo "Cleanup"
	@echo "  make clean        Remove frontend and Rust build artifacts"

install:
	npm install

dev:
	npm run tauri dev

dev-ui:
	npm run dev

build:
	npm run build

bundle:
	npm run tauri build

check:
	npm run check

lint:
	npm run format:check
	cd src-tauri && cargo clippy -- -D warnings

fmt:
	npm run format
	cd src-tauri && cargo fmt

fmt-check:
	npm run format:check
	cd src-tauri && cargo fmt --check

test: test-js test-rust

test-js:
	npm run test

test-rust:
	cd src-tauri && cargo test

clean:
	rm -rf dist
	cd src-tauri && cargo clean
