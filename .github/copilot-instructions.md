# AI Coding Agent Instructions for Dashticz Components

## Purpose

This repository contains custom Dashticz components and helper scripts used to install them into a Dashticz instance.

## Repo Map

- `js/components/`: Component source. Each component is a paired `.js` and `.css` file.
- `scripts/`: Deployment and maintenance scripts.
- `tests/`: Python and Dashticz test fixtures.
- `dashticz-mod/`: Required loader patch for custom component discovery.
- `docs/`: Architecture notes, ADR placeholders, and runbooks.

## Core Rules

- Keep component files in the existing IIFE pattern and register with `Dashticz.register()`.
- Pair every component JavaScript file with a same-named CSS file.
- Scope DOM IDs and CSS selectors with `me.block.idx` to avoid collisions.
- Use jQuery for DOM work and Dashticz helpers for script and CSS loading.
- Keep repository-wide instructions short; put durable details in `docs/` and scoped rules in `.github/instructions/`.

## Scoped Guidance

- Use `.github/instructions/components.instructions.md` when editing files under `js/components/`.

## Validation

- `python3 tests/test_update_specials.py`
- `python3 scripts/create-symlinks.py --debug`

## Key References

- Architecture: `docs/architecture.md`
- Runbooks: `docs/runbooks/`
- ADRs: `docs/decisions/`
