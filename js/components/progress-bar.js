var DT_progress_bar = (function () {
    function buildHTML(me) {
        var width = me.block.width || $(me.mountPoint + ' .dt_block').width()
        var headerHTML = ''

        // Only add header HTML if header is not false
        if (me.block.header !== false) {
            headerHTML =
                '<div id="progress-header-' +
                me.block.idx +
                '" class="progress-header"></div>'
        }

        var valueHTML = ''
        if (me.block.value && me.block.value !== 'after') {
            // Value in separate div for left/right/below positions
            valueHTML =
                '<div id="progress-value-' +
                me.block.idx +
                '" class="progress-value progress-value-' +
                me.block.value +
                '"></div>'
        }

        var barHTML = '<div class="progress-container">'
        if (me.block.value === 'inside') {
            barHTML +=
                '<div id="progress-value-' +
                me.block.idx +
                '" class="progress-value progress-value-inside"></div>'
        }
        barHTML +=
            '<div id="progress-fill-' +
            me.block.idx +
            '" class="progress-fill"></div>' +
            '</div>'

        var content = ''
        if (me.block.headerPosition === 'below') {
            if (me.block.value === 'below') {
                content = barHTML + valueHTML + headerHTML
            } else if (me.block.value === 'left') {
                content = valueHTML + barHTML + headerHTML
            } else if (me.block.value === 'right') {
                content = barHTML + valueHTML + headerHTML
            } else {
                content = barHTML + headerHTML + valueHTML
            }
        } else {
            if (me.block.value === 'below') {
                content = headerHTML + barHTML + valueHTML
            } else if (me.block.value === 'left') {
                content = valueHTML + barHTML + headerHTML
            } else if (me.block.value === 'right') {
                content = barHTML + valueHTML + headerHTML
            } else {
                content = headerHTML + barHTML + valueHTML
            }
        }

        return (
            '<div id="progress-bar-' +
            me.block.idx +
            '" class="block_' +
            me.block.type +
            ' col-xs-' +
            width +
            '">' +
            content +
            '</div>'
        )
    }

    function drawCard(me) {
        var device = Domoticz.getAllDevices(me.block.idx)

        // Validate device exists
        if (!device) {
            var element = document.getElementById(
                'progress-header-' + me.block.idx,
            )
            if (element) element.innerText = 'Device not found'
            return
        }

        var element = document.getElementById('progress-header-' + me.block.idx)
        if (element) {
            // Determine header text
            var headerText = ''
            if (me.block.header === true) {
                headerText = device.Name
            } else if (typeof me.block.header === 'string') {
                headerText = me.block.header
            }
            element.innerText = headerText
            // Store original header for later value appending
            element.dataset.headerText = headerText
        }

        // Set initial progress
        updateProgress(me, device)
    }

    function updateProgress(me, device) {
        var value = 0

        // Try Data field first (for General/Percentage devices like "21.6%")
        if (device.Data) {
            value = parseFloat(device.Data.replace('%', '')) || 0
        } else if (device.Usage) {
            // Fall back to Usage field
            value = parseFloat(device.Usage) || 0
        }

        var percentage = Math.min(100, Math.max(0, value))
        var fillElement = document.getElementById(
            'progress-fill-' + me.block.idx,
        )
        fillElement.style.width = percentage + '%'
        fillElement.style.backgroundColor =
            me.block.themes[me.block.theme] || me.block.themes.default

        // Update value display if enabled
        if (me.block.value === 'after') {
            // Append value to header
            var headerElement = document.getElementById(
                'progress-header-' + me.block.idx,
            )
            if (headerElement) {
                var headerText = headerElement.dataset.headerText || ''
                headerElement.innerText =
                    headerText + ' ' + Math.round(percentage) + '%'
            }
        } else if (me.block.value) {
            // Update separate value element
            var valueElement = document.getElementById(
                'progress-value-' + me.block.idx,
            )
            if (valueElement) {
                valueElement.innerText = Math.round(percentage) + '%'
            }
        }
    }

    return {
        name: 'progress-bar',
        init: function () {
            return DT_function.loadCSS('./js/components/progress-bar.css')
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'progress-bar'
        },
        defaultCfg: {
            width: 6,
            height: 50,
            type: 'progress-bar',
            title: 'Progress Bar',
            header: true, // true = device name, false = no header, string = custom text
            headerPosition: 'above', // 'above' or 'below'
            value: false, // false = no value, 'below' = centered below bar, 'after' = after header, 'left' = left of bar, 'right' = right of bar, 'inside' = inside bar
            theme: 'default',
            themes: {
                default: '#708090',
                red: '#dc3545',
                green: '#28a745',
                yellow: '#ffc107',
                purple: '#6f42c1',
            },
        },
        run: function (me) {
            $(me.mountPoint).html(buildHTML(me))
            drawCard(me)

            // Subscribe to device updates
            Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
                updateProgress(me, device)
            })
        },
    }
})()

Dashticz.register(DT_progress_bar)
