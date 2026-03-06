# Architecture

## Overview

`dashticz-components` extends Dashticz with custom dashboard widgets and a small set of helper scripts for deployment into a Dashticz installation.

## Repository Layout

- `js/components/`: Reusable dashboard components. Each component is delivered as a `.js` and `.css` pair.
- `scripts/`: Utilities for creating or removing symlinks and updating generated values.
- `tests/`: Test support files and Python tests for repository scripts.
- `dashticz-mod/`: Modified Dashticz loader used to enable custom component discovery.

## Component Model

Each component follows the same Dashticz module pattern:

1. Export an IIFE assigned to `DT_<name>`.
2. Provide `name`, `init()`, `canHandle()`, `defaultCfg`, and `run()`.
3. Register the component with `Dashticz.register()`.

Components render into `me.mountPoint`, read configuration from `me.block`, and subscribe to live device data through `Dashticz.subscribeDevice()` when needed.

## Styling and DOM Conventions

- Keep CSS in paired component stylesheets under `js/components/`.
- Scope element IDs and selectors with `me.block.idx` so multiple instances can coexist safely.
- Use jQuery for DOM updates because that matches the surrounding Dashticz runtime.

## Deployment Model

The repository is designed to be linked into an existing Dashticz installation. Symlink creation and removal are handled by scripts in `scripts/`, and Dashticz itself requires the loader patch in `dashticz-mod/dashticz.js` plus web-server directory listing support.

## Validation Entry Points

- `python3 -m pip install -r requirements.txt`
- `python3 tests/test_update_specials.py`
- `python3 scripts/create-symlinks.py --debug`

These commands are the current deterministic checks documented in the repository. Add more entry points here when new tests or automation are introduced.