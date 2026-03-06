---
applyTo: 'js/components/**/*.{js,css}'
description: Rules for Dashticz component implementation and styling.
---

# Dashticz Component Rules

- Use the existing IIFE module pattern and end each component with `Dashticz.register(...)`.
- Implement `name`, `canHandle()`, `defaultCfg`, and `run()` for each component.
- Pair every component `.js` file with a same-named `.css` file.
- Scope DOM IDs, CSS classes, and selectors with `me.block.idx` to avoid collisions.
- Subscribe to device updates with `Dashticz.subscribeDevice(...)` when the component depends on live data.
- Read device state through Dashticz and Domoticz helpers instead of hardcoding values.
- Load optional external assets in `init()` via `DT_function.loadScript()` or `DT_function.loadCSS()`.
- Respect the existing style: 4-space indentation, single quotes, no semicolons.
- Use Bootstrap sizing conventions already used by Dashticz blocks.
- Avoid framework dependencies and keep DOM work in jQuery.