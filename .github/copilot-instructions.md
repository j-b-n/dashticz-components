# AI Coding Agent Instructions for Dashticz Components

## Project Overview

**dashticz-components** is a collection of custom visualization and data display components for [Dashticz](https://github.com/Dashticz/dashticz), a web-based dashboard solution for [Domoticz](https://github.com/domoticz/domoticz) home automation systems.

Each component is a reusable widget that displays sensor data (temperature, power usage, time, etc.) in various visual formats (gauges, graphs, cards). Components are installed as symlinks into a Dashticz installation for hot-reloading.

## Architecture

### Component Structure
Each component follows a **module pattern** with paired `.js` and `.css` files:
- **`js/components/*.js`** - Component implementation (see `bargraph.js`, `gauge.js`)
- **`js/components/*.css`** - Component styling (paired CSS file)

### Component Anatomy (IIFE Module Pattern)
All components follow this pattern in `js/components/*.js`:

```javascript
var DT_<componentname> = (function () {
    return {
        name: "componentname",
        init: function () { /* Load CSS/scripts */ },
        canHandle: function (block) { /* Return true if block.type matches */ },
        defaultCfg: { /* Default configuration object */ },
        run: function (me) { /* Mount to DOM, subscribe to data updates */ },
        refresh: function (me) { /* Optional: Called at interval */ }
    }
})();
Dashticz.register(DT_<componentname>);
```

### Critical Integration Points
- **`Dashticz.register()`** - Required to register component with Dashticz framework
- **`Dashticz.subscribeDevice()`** - Subscribe to real-time sensor updates (seen in `bargraph.js`)
- **`Domoticz.getAllDevices()`** - Access device data by idx
- **`DT_function.loadCSS()` / `DT_function.loadScript()`** - Dynamic resource loading in `init()`

### Data Flow
1. Dashticz framework calls `canHandle()` to route a block config to correct component
2. Component's `run()` mounts HTML to `me.mountPoint`
3. Component subscribes to device changes via `subscribeDevice()`
4. Updates trigger real-time re-renders without page refresh

## Installation & Deployment

### Configuration
Environment variables in `.env` (copy from `.env.EXAMPLE`):
```
DASHTICZ_COMPONENTS_PATH=/path/to/dashticz/js/components/
DASHTICZ_COMPONENTS_SOURCE_PATH=/home/pi/dashticz-components/js/components/
```

### Deployment Scripts
- **`scripts/create-symlinks.py`** - Links components from source to Dashticz installation
  - Use `--debug` flag to preview changes without modifying filesystem
  - Deletes conflicting regular files before creating symlinks
  - Respects existing symlinks
- **`scripts/sync-dashticz-components.sh`** - Alternative shell sync script
- **`scripts/remove-symlinks.py`** - Cleanup script for uninstalling

### Dashticz Modifications Required
1. Patch main `dashticz.js` loader to support custom components (see `dashticz-mod/dashticz.js`)
2. Configure web server to allow directory listing:
   - Apache: `Options +Indexes` in `.htaccess` for component directory
   - Enables dynamic component discovery

## Key Patterns & Conventions

### Configuration Pattern
Components expose config via `defaultCfg` object:
```javascript
defaultCfg: {
    width: 6,              // Bootstrap grid width (col-xs-N)
    numSegments: 9,        // Component-specific settings
    maxPower: 5000,
    height: 300,
    type: 'bargraph',      // Must match canHandle() logic
    title: 'Bargraph',
    iconName: 'fas fa-bolt', // FontAwesome icon class
}
```

### HTML Building Pattern
Build HTML in `buildHTML(me)` function, inject via `$(me.mountPoint).html()` in `run()`:
- Use component-specific CSS classes tied to `me.block.idx`
- Example: `id="bargraph-bar-'+me.block.idx+'"` prevents ID collisions

### Dynamic Styling
Color calculations and conditional styling happen in `run()` and subscription callbacks:
- See `bargraph.js` `getColor(level)` for color mapping
- Segments colored based on power thresholds

### Code Style
- **Prettier config** (`.prettierrc`): 4-space tabs, trailing commas (es5), no semicolons, single quotes
- **jQuery heavily used**: `$()`, `.css()`, `.html()`, `.append()` for DOM manipulation
- **Console logging** for debugging (seen in `gauge.js`)

## Common Tasks

### Adding a New Component
1. Create `js/components/newname.js` following IIFE pattern
2. Create paired `js/components/newname.css` for styling
3. Implement required methods: `name`, `canHandle()`, `defaultCfg`, `run()`
4. Call `Dashticz.register(DT_newname)` at end
5. For data updates, use `Dashticz.subscribeDevice()` callback in `run()`

### Modifying Block Styling
- Always scope CSS classes to component idx: `.bargraph-bar-'+me.block.idx
- Reference in DOM with element IDs: `document.getElementById('bargraph-bar-' + me.block.idx)`
- Use `$(me.mountPoint)` jQuery context for sizing queries

### Testing in Dashticz
1. Set `DASHTICZ_COMPONENTS_SOURCE_PATH` in `.env`
2. Run `scripts/create-symlinks.py` to link components
3. Restart Dashticz web interface (directory listing must be enabled)
4. Check browser console for component init/run flow

## External Dependencies

- **canvas-gauges library** - Used in `gauge.js` for radial/linear gauges
  - Loaded via CDN in `init()`: `gauge.min.js`
  - Creates `RadialGauge` and `LinearGauge` objects
- **FontAwesome icons** - Icon classes (e.g., `fas fa-bolt`)
- **Domoticz REST API** - Accessed through Dashticz framework methods
- **D3.js** - Included for chart components (`d3.js`)

## Testing
- **`tests/dashticz.js`** - Mock/test version of Dashticz framework
- **`tests/test_update_specials.py`** - Python test for utility scripts
- Run with: Python test runner for scripts, browser console for component testing

## Common Pitfalls

1. **Forgetting `Dashticz.register()`** - Component won't be recognized
2. **Hardcoded element IDs** - Use `me.block.idx` suffix to avoid collisions with multiple instances
3. **Missing symlink update** - Run `create-symlinks.py` after code changes for live reload
4. **Web server directory listing disabled** - Components won't load without `Options +Indexes`
5. **Ignoring `me.block` config** - Always respect user-provided config in `defaultCfg`
