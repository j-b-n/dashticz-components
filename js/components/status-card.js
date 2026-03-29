/*
    Status card component for Dashticz. Displays a card with a header (icon + title)
    and a list of device rows. Percentage devices show a gradient progress bar.

    Config example:
      blocks['my-card'] = {
          type: 'status-card',
          title: 'Home Server',
          iconName: 'fa fa-server',
          backgroundColor: '#111827',
          width: 4,
          theme: 'glow',
          color: 'orange',
          devices: [
              { id: 123, icon: 'fa fa-microchip', label: 'CPU', color: 'green' },
              { id: 456, icon: 'fa fa-thermometer-half', label: 'Temp', color: 'red' },
              { id: 789, icon: 'fa fa-hdd-o', label: 'Disk' },
          ]
      }

    Themes: 'simple', 'glow'
    Colors: 'green', 'orange', 'red', 'yellow', 'blue', 'purple'
    Simple form also supported: devices: [123, 456, 789]
*/

var DT_status_card = (function () {
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
    }

    function normalizeDevices(me) {
        var raw = me.block.devices || []
        if (!Array.isArray(raw)) raw = [raw]
        return raw.map(function (d) {
            if (typeof d === 'object' && d !== null) return d
            return { id: d }
        })
    }

    function isPercentage(device) {
        return device && device.Data && device.Data.indexOf('%') !== -1
    }

    function getPercentage(device) {
        if (!device || !device.Data) return 0
        return Math.min(100, Math.max(0, parseFloat(device.Data) || 0))
    }

    function getDisplayValue(device, deviceCfg, me) {
        var val = device.Data || device.Usage || device.Level || 'N/A'
        var unit = deviceCfg.unit || me.block.unit || ''
        if (unit && val.indexOf(unit) === -1) {
            return val + ' ' + unit
        }
        return val
    }

    function buildRowHTML(me, deviceCfg) {
        var device = Domoticz.getAllDevices(deviceCfg.id)
        var showBar =
            deviceCfg.showBar !== false &&
            (deviceCfg.showBar === true || isPercentage(device))
        var pct = showBar && device ? getPercentage(device) : 0
        var icon = deviceCfg.icon || 'fa fa-circle'
        var label
        if (deviceCfg.label === true) {
            label = (device && device.Name) || 'Device ' + deviceCfg.id
        } else if (typeof deviceCfg.label === 'string') {
            label = deviceCfg.label
        } else {
            label = (device && device.Name) || 'Device ' + deviceCfg.id
        }
        var displayValue = device
            ? getDisplayValue(device, deviceCfg, me)
            : 'N/A'

        var rowColor = deviceCfg.color || me.block.color || ''
        var colorClass = rowColor ? ' color-' + rowColor : ''

        return (
            '<div id="status-card-row-' +
            me.block.idx +
            '-' +
            deviceCfg.id +
            '"' +
            ' class="status-card-row' +
            (showBar ? ' status-card-row-bar' : '') +
            colorClass +
            '"' +
            (showBar ? ' style="--fill: ' + pct + '%"' : '') +
            '>' +
            '<div class="status-card-row-content">' +
            '<i class="status-card-row-icon ' +
            icon +
            '"></i>' +
            '<span class="status-card-row-label">' +
            escHtml(label) +
            '</span>' +
            '<span id="status-card-val-' +
            me.block.idx +
            '-' +
            deviceCfg.id +
            '" class="status-card-row-value">' +
            escHtml(displayValue) +
            '</span>' +
            '</div>' +
            '</div>'
        )
    }

    function buildHTML(me) {
        var width = me.block.width || 3
        var bgColor = me.block.backgroundColor || '#111827'
        var icon = me.block.iconName
        var title = me.block.title
        var theme = me.block.theme || 'simple'

        var rowsHTML = ''
        normalizeDevices(me).forEach(function (deviceCfg) {
            rowsHTML += buildRowHTML(me, deviceCfg)
        })

        var headerHTML = ''
        if (icon || title) {
            headerHTML =
                '<div class="status-card-header">' +
                (icon
                    ? '<i class="status-card-header-icon ' + icon + '"></i>'
                    : '') +
                (title
                    ? '<span class="status-card-header-title">' +
                      title +
                      '</span>'
                    : '') +
                '</div>'
        }

        return (
            '<div id="status-card-' +
            me.block.idx +
            '" class="block_status_card theme-' +
            theme +
            ' col-xs-' +
            width +
            '" style="background-color: ' +
            bgColor +
            ';">' +
            headerHTML +
            '<div id="status-card-rows-' +
            me.block.idx +
            '" class="status-card-rows">' +
            rowsHTML +
            '</div>' +
            '</div>'
        )
    }

    function updateDeviceDisplay(me, deviceCfg, device) {
        var showBar =
            deviceCfg.showBar !== false &&
            (deviceCfg.showBar === true || isPercentage(device))

        var valEl = document.getElementById(
            'status-card-val-' + me.block.idx + '-' + deviceCfg.id,
        )
        if (valEl) valEl.textContent = getDisplayValue(device, deviceCfg, me)

        if (showBar) {
            var rowEl = document.getElementById(
                'status-card-row-' + me.block.idx + '-' + deviceCfg.id,
            )
            if (rowEl)
                rowEl.style.setProperty('--fill', getPercentage(device) + '%')
        }
    }

    return {
        name: 'status-card',
        init: function () {
            return DT_function.loadCSS('./js/components/status-card.css')
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'status-card'
        },
        defaultCfg: {
            width: 3,
            devices: [],
            title: 'Status',
            iconName: 'fa fa-home',
            backgroundColor: '#111827',
            theme: 'simple',
            color: '', // e.g., 'green', 'orange', 'red', 'yellow', 'blue', 'purple'
        },
        run: function (me) {
            $(me.mountPoint).html(buildHTML(me))

            normalizeDevices(me).forEach(function (deviceCfg) {
                if (!deviceCfg.id) return
                Dashticz.subscribeDevice(
                    me,
                    deviceCfg.id,
                    true,
                    function (device) {
                        updateDeviceDisplay(me, deviceCfg, device)
                    },
                )
            })
        },
    }
})()

Dashticz.register(DT_status_card)
