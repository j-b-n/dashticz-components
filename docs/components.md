# Components Best Practices

## Purpose

This guide explains how to write, configure, deploy, and maintain Dashticz components in this repository.

It combines:

- Dashticz developer guidance from `dashticz/docs/develop/*`
- Runtime behavior from `dashticz/js/dashticz.js` and helpers
- Core component patterns from `dashticz/js/components/*`
- Patterns used in this repository's components under `js/components/`

Use this as the baseline for new components and refactors.

## Where Components Fit In

At runtime, Dashticz:

1. Enumerates JavaScript files in `js/components/`
2. Loads each component script dynamically
3. Registers each component via `Dashticz.register(...)`
4. Chooses a component for a block by `type` and/or `canHandle(...)`
5. Mounts the block, calls `run(me)`, and wires subscriptions/refresh

Component code is expected to be lightweight, browser-compatible, and resilient to repeated mount/unmount cycles.

## Repository Structure

- `js/components/<name>.js`: component logic
- `js/components/<name>.css`: component styling
- `dashticz-mod/dashticz.js`: loader patch needed for custom component discovery
- `scripts/create-symlinks.py`: links custom components into a Dashticz install

Always create a `.js` and `.css` pair for each component, even if CSS is minimal at first.

## Observed Component Patterns (Core + Custom)

From the files in both `dashticz/js/components/` and `js/components/`, there are two dominant implementation styles:

1. Object literal module:
    - Example style: `var DT_button = { ... }`
    - Used widely in core components
2. IIFE returning object:
    - Example style: `var DT_status_card = (function () { return { ... } })()`
    - Common in custom components and some newer modules

Both are valid as long as registration and hook behavior are correct.

Common hook usage found in core components:

- `name`, `canHandle`, `defaultCfg`, `run` are the baseline.
- `defaultContent` is frequently used in core modules (`button`, `frame`, `log`, `waqi`, `timegraph`) to provide the static shell of `.dt_state`.
- `refresh` is heavily used for polling/network blocks.
- `onResize` appears for layout-sensitive blocks (for example security panel).
- `destroy` appears in heavier modules (for example `dial`) and should be used more broadly in custom modules when attaching extra listeners/observers.

Practical recommendation:

- Use `defaultContent` for static skeleton markup.
- Use `run` for one-time setup and subscriptions.
- Use `refresh` only when periodic updates are required.
- Add `onResize` when layout depends on block width/height.
- Add `destroy` whenever you allocate resources not tracked by Dashticz.

## Component Contract

Each component should follow the IIFE module pattern and register itself.

```javascript
var DT_mycomponent = (function () {
    return {
        name: 'mycomponent',

        canHandle: function (block) {
            return block && block.type && block.type === 'mycomponent'
        },

        init: function () {
            return DT_function.loadCSS('./js/components/mycomponent.css')
        },

        defaultCfg: {
            width: 4,
            title: 'My Component',
        },

        run: function (me) {
            $(me.mountPoint + ' .dt_state').html('<div id="mycomponent-' + me.block.idx + '"></div>')
        },

        refresh: function (me) {
            // Optional
        },

        destroy: function (me) {
            // Optional explicit cleanup
        },
    }
})()

Dashticz.register(DT_mycomponent)
```

## Lifecycle and Hooks

### `name` (required)

- Must be unique and stable.
- Should match the block `type` you document for users.

### `canHandle(block, key)` (recommended)

- Return `true` only for blocks this component owns.
- Typical pattern: `block.type === '<name>'`.
- Keep checks strict and predictable.

### `init(blockdef)` (optional but recommended)

- Load CSS and optional JS dependencies.
- Return a jQuery Deferred/Promise when async.
- Dashticz caches `initPromise`; it usually runs once per component type.

### `defaultCfg` (recommended)

- Object or function returning object.
- Set safe defaults for width, labels, timing, and visual options.
- Keep defaults conservative and performant.

### `defaultContent(me)` (optional)

- Returns static content rendered in `.dt_state` by Dashticz.
- Prefer for static shell markup; dynamic updates can still happen in `run(...)`.
- This pattern is common in core components and keeps `run(...)` simpler.

### `run(me)` (required)

- Main render setup after mount.
- Create instance-specific markup.
- Wire subscriptions and short-lived timers.

### `refresh(me)` (optional)

- Called when `me.block.refresh` is set.
- Also re-called when block config changes if `refresh` exists.
- Keep idempotent and fast.

### `destroy(me)` (optional but important)

- Final custom cleanup hook.
- Use for anything Dashticz does not auto-clean.

## The `me` Runtime Object

`me` is the component instance context. Common fields:

- `me.mountPoint`: CSS selector for the host node (example: `#block_12`)
- `me.$mountPoint`: jQuery object of mount point
- `me.block`: effective block config (defaults merged with user config)
- `me.block.idx`: useful unique identifier for instance-scoped DOM ids
- `me.key`: block key
- `me.callbacks`: internal lists for timers/subscriptions managed by Dashticz

Do not overwrite reserved keys such as `key`, `mountPoint`, `type`, `name`, or `me.block`.

## DOM and Markup Best Practices

### Scope everything per instance

Use `me.block.idx` in IDs and instance selectors:

```javascript
var id = 'status-card-' + me.block.idx
$(me.mountPoint).html('<div id="' + id + '"></div>')
```

This prevents collisions when multiple blocks of the same type are rendered.

### Prefer mount-local selectors

Good:

- `$(me.mountPoint + ' .my-class')`
- `$(me.mountPoint).find('.my-class')`

Avoid global selectors unless intentionally global.

### Keep structure predictable

A practical convention:

1. Build HTML string in a helper (`buildHTML`)
2. Inject once in `run(me)`
3. Update only targeted nodes on data changes

This reduces unnecessary reflow and flicker.

## CSS Best Practices

- Create a same-name CSS file and load it from `init()`.
- Prefix root class with component identity (example: `.block_status_card`, `.suncard-wrapper`).
- Avoid styling generic global selectors.
- Keep sizing responsive; respect Dashticz grid (`col-xs-*`) and block width.
- Prefer CSS transitions over frequent JavaScript style writes for simple animations.

## Data Access and Subscriptions

### Use Domoticz APIs through Dashticz helpers

Common patterns:

- Snapshot current state: `Domoticz.getAllDevices(idx)`
- Live updates: `Dashticz.subscribeDevice(me, idx, true, callback)`
- API requests: `Domoticz.request(query, forcehttp)`

### Subscription pattern

```javascript
Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
    updateUI(me, device)
})
```

`Dashticz.subscribeDevice` tracks unsubscribe callbacks under `me.callbacks`, so unmount cleanup is automatic.

### Handle missing or invalid data gracefully

- Validate device existence before rendering charts/gauges.
- Show a concise fallback message inside the block.
- Avoid throwing uncaught errors from `run(...)`.

## Timers, Intervals, and Cleanup

Use Dashticz-managed timers when possible:

- `Dashticz.setTimeout(me, fn, ms)`
- `Dashticz.setInterval(me, fn, ms)`

These are tracked and cleared on block removal.

If you use native timers (`setInterval`, `setTimeout`) directly:

- Store handles on `me` (example: `me._clockTimer`)
- Clear existing timer before creating a new one
- Clear in `destroy(me)` when needed

For DOM observers/listeners you register manually (MutationObserver, document events), always disconnect/remove them in `destroy(me)`.

Important implementation note from core components:

- Some legacy modules use raw `window.setInterval`/`setTimeout` without explicit teardown. Avoid copying that pattern for new code.
- For new custom components, prefer Dashticz-managed timers or explicit `destroy(me)` cleanup.

## External Assets and Dependencies

### CSS and JS loading

- CSS: `DT_function.loadCSS('./js/components/<name>.css')`
- JS: `DT_function.loadScript('<url-or-path>')`
- Dashticz JS with versioning: `DT_function.loadDTScript(...)`

`DT_function` caches loaded resources, so repeated loads are cheap.

### Dependency guidance

- Keep external dependencies minimal.
- Prefer stable, pinned versions.
- Avoid blocking/synchronous requests.
- Fail gracefully if a CDN resource is unavailable.
- Avoid synchronous script fetch patterns (`$.ajax({ async: false })`) found in some legacy modules.

## Compatibility Guidance (Important)

Dashticz developer docs target broad browser compatibility and emphasize ES5 for core files.

Best practice for this repository:

- Prefer ES5-safe syntax in shared runtime paths.
- If modern syntax is used in a component, verify target clients (older tablets are common in dashboards).
- Never introduce synchronous AJAX.
- Keep jQuery-first DOM patterns for consistency with Dashticz internals.

Core codebase reality:

- A few older components still contain legacy patterns (including sync AJAX in specific paths).
- Treat those as compatibility debt, not as templates for new components.

## Configuration Design

### Recommended block options

- `type`: component type selector
- `title`: optional display title
- `idx` or `devices`: Domoticz device references
- `width`: Bootstrap block width
- `refresh`: optional periodic refresh interval in seconds
- component-specific visual options

### Example block

```javascript
blocks['my_status'] = {
    type: 'status-card',
    title: 'System',
    width: 4,
    devices: [
        { id: 123, label: 'CPU', icon: 'fa fa-microchip', color: 'green' },
        { id: 456, label: 'Temp', icon: 'fa fa-thermometer-half', color: 'orange' },
    ],
}
```

Keep option names explicit and documented. Avoid hidden magic values.

## Width and Height Rules

This section defines the canonical sizing model for components in this repository.

### Core sizing model

1. `width` is grid width in columns (`1..12`), not pixels.
2. Height is controlled globally by Dashticz in this order:
   - `aspectratio` (preferred for responsive layout)
   - `height` (fixed height)
3. Component internals may derive pixel sizes from measured DOM width, but should not repurpose `me.block.width` to store pixel values.

### Canonical configuration matrix

| Option | Type | Scope | Canonical meaning | Who applies it | Notes |
|---|---|---|---|---|---|
| `width` | number | block config | Bootstrap grid columns (`col-xs-N`) | `dashticz.js` container renderer | Keep as logical layout width only |
| `height` | number or css value | block config | Fixed block height | `dashticz.js` (or component internals for special widgets) | Use when content needs strict vertical size |
| `aspectratio` | number | block config | Height derived from rendered width (`height = width * aspectratio`) | `dashticz.js` renderer | Prefer over fixed `height` for responsive blocks |
| `scale` | number | component option | Scales inner typography or drawing | Component `run/refresh` code | Common in clock/weather/custom cards |
| `size` | number | component option | Override measured width basis for internal sizing | Component code | Used as explicit width baseline in some clock/gauge patterns |
| `scaletofit` | number | component option | Fit iframe/embed content to available width | Component code | Used in frame-like components with CSS transform |
| `containerClass` / `containerExtra` | string/function | block config | Container-level class/style extension | `dashticz.js` container builder | Useful for controlled layout overrides |

### Recommended width/height combinations

| Component type | Width strategy | Height strategy | Recommended options |
|---|---|---|---|
| Text/status card | Grid width (`width`) + optional `scale` | Auto or fixed `height` if needed | `width`, `scale` |
| Chart/graph | Grid width (`width`) | Prefer explicit `height` | `width`, `height` |
| Iframe/embed/map | Grid width (`width`) | Prefer `aspectratio`, optional `height` override | `width`, `aspectratio`, `scaletofit` |
| Icon/clock tile | Grid width (`width`) + measured DOM width | Usually auto, internal font scaling | `width`, `scale`, optional `size` |

### Do and don't examples

Do: keep layout width semantic and derive local pixel width from DOM.

```javascript
defaultCfg: {
    width: 4,
    aspectratio: 0.6,
    scale: 1,
},
run: function (me) {
    var pixelWidth = $(me.mountPoint + ' .dt_block').width()
    var fontSize = (pixelWidth / 6) * me.block.scale
    $(me.mountPoint + ' .dt_block').css('font-size', fontSize)
}
```

Don't: overwrite `me.block.width` with measured pixel width.

```javascript
// Avoid this pattern: it mixes grid columns with pixels.
var width = parseInt(me.$mountPoint.find('div').innerWidth())
me.block.width = width
```

Do: use `aspectratio` for responsive embed height.

```javascript
defaultCfg: {
    width: 12,
    aspectratio: 0.56,
    scaletofit: 1024,
}
```

Don't: hardcode large fixed heights for all breakpoints unless strictly required.

```javascript
// Avoid rigid defaults for responsive dashboards.
defaultCfg: { width: 12, height: 900 }
```

### Implementation notes from runtime behavior

- Container width class comes from `col-xs-${me.block.width}`.
- Global renderer sets fixed height when `aspectratio` or `height` is present.
- For chart libraries, set chart option `maintainAspectRatio = false` when applying explicit height to the chart container.

### Sizing checklist

- Use `width` only for grid columns.
- Prefer `aspectratio` over fixed `height` when responsiveness matters.
- Keep measured pixel dimensions in separate variables (`pixelWidth`, `pixelHeight`) or instance fields (`me.pixelWidth`).
- If using iframe transform scaling, pair `scaletofit` with `aspectratio`.
- Verify behavior on both small and wide screens.

## Rendering and Performance

- Compute expensive values once per update cycle.
- Batch DOM writes where practical.
- Avoid rebuilding full HTML if only one field changed.
- Keep refresh frequency reasonable; do not poll every second unless necessary.
- For heavy visuals (charts/video), gate updates when block is hidden or in standby mode.

## Error Handling and Resilience

- Validate required config early in `run(me)`.
- Show clear in-block errors for missing required options.
- Catch and log async failures with enough context (component name, idx, endpoint).
- Fallback to simpler behavior when advanced mode fails (example: WebRTC to iframe).

## Accessibility and UX

- Keep text readable at dashboard distance.
- Ensure color contrast is sufficient.
- Provide labels/icons consistently.
- Use `aria-label` on custom SVG/media elements where useful.
- Respect reduced-motion preferences for animations when possible.

## Security and Safety

- Never insert unsanitized HTML from device data directly into `innerHTML`.
- Treat URLs as untrusted input; validate before embedding in iframes or fetch.
- Avoid exposing credentials or tokens in component logs.

## Deployment and Use in a Dashticz Installation

1. Ensure component files are available in the Dashticz `js/components/` directory (or symlinked there).
2. If you use this repository workflow, custom component files in `dashticz/js/components/` are symlinks to `/custom_components/*` (created by the symlink scripts).
3. Apply loader patch from `dashticz-mod/dashticz.js` if your Dashticz version does not support custom component discovery out of the box.
4. Enable directory listing for `js/components/` in your web server (required by the loader strategy used here).
5. Reload the dashboard and inspect browser console for load/init errors.

For this repository's local workflow, use:

- `python3 scripts/create-symlinks.py --debug`
- `python3 scripts/create-symlinks.py`

## Validation Checklist Before Opening a PR

- Component `.js` + `.css` pair exists with same basename.
- `name`, `canHandle`, `run`, and `Dashticz.register(...)` are present.
- IDs/selectors are instance-safe via `me.block.idx`.
- Subscriptions are via `Dashticz.subscribeDevice(...)`.
- Timers/listeners/observers are cleaned up.
- No synchronous AJAX.
- No untracked global timers/event listeners.
- Works with multiple instances of same block type.
- Error state is visible and non-breaking.
- Docs/config examples updated when new options are added.

## Troubleshooting

### Component does not load

- Check that `<name>.js` exists in Dashticz `js/components/`.
- Verify web server directory indexing is enabled.
- Confirm file permissions allow web server read access.

### Component loads but shows empty block

- Check `canHandle(...)` logic and `type` in block config.
- Validate required config (`idx`, URLs, etc.).
- Add temporary console logs in `run(...)` and subscription callback.

### Multiple blocks interfere with each other

- Ensure all IDs are suffixed with `me.block.idx`.
- Remove global selectors and use mount-local queries.

### Memory leaks or slow dashboard over time

- Replace native timers with Dashticz timer helpers where possible.
- Implement `destroy(me)` to remove custom listeners/observers.
- Reduce refresh rate and avoid full re-render on small updates.

### Component behaves differently than core Dashticz blocks

- Check whether the core reference component relies on `defaultContent` versus fully replacing markup in `run`.
- Verify whether updates are subscription-driven (`subscribeDevice`) or refresh-driven (`refresh` interval).
- Confirm class/container assumptions (`.dt_state`, `.dt_content`, icon/title rendering) against `dashticz/js/dashticz.js`.

## Starter Template

Use this template for new components:

```javascript
/* global Dashticz DT_function Domoticz */

var DT_mycomponent = (function () {
    function buildHTML(me) {
        return (
            '<div id="mycomponent-' +
            me.block.idx +
            '" class="mycomponent-root">' +
            '<div class="mycomponent-value" id="mycomponent-value-' +
            me.block.idx +
            '">--</div>' +
            '</div>'
        )
    }

    function updateValue(me, device) {
        var el = document.getElementById('mycomponent-value-' + me.block.idx)
        if (!el) return
        el.textContent = device && device.Data ? device.Data : 'N/A'
    }

    return {
        name: 'mycomponent',
        init: function () {
            return DT_function.loadCSS('./js/components/mycomponent.css')
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'mycomponent'
        },
        defaultCfg: {
            width: 4,
            title: '',
            idx: 0,
        },
        run: function (me) {
            $(me.mountPoint).html(buildHTML(me))

            if (!me.block.idx) {
                $(me.mountPoint + ' .mycomponent-root').text('Missing idx')
                return
            }

            Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
                updateValue(me, device)
            })
        },
        destroy: function (me) {
            // Add explicit cleanup here if you added non-Dashticz listeners/observers.
        },
    }
})()

Dashticz.register(DT_mycomponent)
```

## Canonical References

- Runtime mount/refresh/subscription lifecycle: `dashticz/js/dashticz.js`
- Script/CSS loading helpers: `dashticz/js/dt_function.js`
- Core component examples:
    - `dashticz/js/components/button.js`
    - `dashticz/js/components/frame.js`
    - `dashticz/js/components/domoticzblock.js`
    - `dashticz/js/components/graph.js`
    - `dashticz/js/components/secpanel.js`
- Custom component examples:
    - `js/components/status-card.js`
    - `js/components/d3.js`
    - `js/components/go2rtc.js`
    - `js/components/suncard.js`
