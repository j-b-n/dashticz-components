# Deployment Runbook

## Purpose

Install or update the component files in a Dashticz environment using symlinks for fast iteration.

## Prerequisites

- A working Dashticz installation.
- Python 3 with dependencies installed from `requirements.txt`.
- Environment variables defined in `.env` or the shell:

```bash
DASHTICZ_COMPONENTS_PATH=/path/to/dashticz/js/components/
DASHTICZ_COMPONENTS_SOURCE_PATH=/home/pi/dashticz-components/js/components/
```

## Procedure

1. Review the target paths in `.env`.
2. Install Python dependencies if they are not already available:

```bash
python3 -m pip install -r requirements.txt
```

3. Preview link creation:

```bash
python3 scripts/create-symlinks.py --debug
```

4. If the preview is correct, create or refresh the symlinks:

```bash
python3 scripts/create-symlinks.py
```

5. Patch the Dashticz loader with `dashticz-mod/dashticz.js` if custom components are not already supported.
6. Ensure the web server allows directory listing for the Dashticz components directory.

Apache example:

```apache
Options +Indexes
```

7. Reload the Dashticz web interface and verify the components appear.

## Validation

- Use the dry-run command before changing symlinks.
- Run `python3 tests/test_update_specials.py` when changing repository scripts.
- Check the browser console if a component does not initialize or update.