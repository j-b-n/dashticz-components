---
name: ui-skills
description: Opinionated constraints for building Dashticz components with HTML and CSS.
---

# UI Skills for Dashticz Components

Opinionated constraints for building visualization components in dashticz-components.

## Stack

- MUST use vanilla HTML and CSS only
- MUST use jQuery for DOM manipulation (already loaded in Dashticz context)
- MUST NOT use framework dependencies (React, Vue, Svelte, etc.)
- MUST pair each component with a `.css` file for styling


## Component Structure

- MUST follow the IIFE module pattern with `Dashticz.register()`
- MUST implement all required methods: `name`, `canHandle()`, `defaultCfg`, `run()`
- MUST scope all CSS classes and IDs to `me.block.idx` to prevent collisions
- SHOULD use Free Fontawsome SVG icons for UI elements (source from `https://fontawesome.com/icons`)
- MUST NOT hardcode element IDs without idx suffix

## Data Integration

- MUST subscribe to device updates via `Dashticz.subscribeDevice(me, idx, true, callback)`
- MUST access device data via `Domoticz.getAllDevices(idx)`
- MUST render updates inside subscription callback without page reload
- MUST handle missing device data gracefully with fallback text or placeholder

## Styling & Layout

- MUST use Bootstrap grid system (`col-xs-N`) for responsive layouts inherited from Dashticz
- MUST respect component width from `me.block.width` or dynamically detect from mount point
- SHOULD use CSS Grid or Flexbox for internal component layout
- MUST NOT use viewport-relative units (`vh`, `vw`) - use percentages or fixed px instead
- SHOULD scope all styles with component-specific class names to prevent global conflicts

## Configuration

- MUST define sensible defaults in `defaultCfg` object
- MUST allow user override of all visual parameters (width, height, colors, icons, etc.)
- SHOULD validate config values in `run()` before use
- MUST respect Bootstrap grid width constraints

## Performance

- MUST load external scripts (canvas-gauges, D3.js) conditionally in `init()`, not on page load
- SHOULD use `DT_function.loadScript()` and `DT_function.loadCSS()` for resource loading
- MUST NOT embed large inline styles - use external `.css` files
- SHOULD minimize DOM queries in subscription callbacks
- MUST cache DOM references when used repeatedly (e.g., `document.getElementById()` results)

## Interaction

- MUST show values clearly and update in real-time
- SHOULD use visual feedback (color changes, animations) to indicate state
- SHOULD limit animations to max `200ms` duration
- MUST handle `prefers-reduced-motion` if adding animations
- SHOULD provide hover states for interactive elements

## Responsive Design

- MUST work across device sizes (phone to desktop)
- MUST use `me.block.size` or jQuery width detection to adapt to container
- SHOULD use CSS Media Queries for layout changes, not JavaScript detection
