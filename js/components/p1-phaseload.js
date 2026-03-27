/*
  Show the current phase load on all three phases.
  Each phase is represented by a filled box with a height proportional to the load.
  The color of the box can be configured based on load percentage.
  Above the boxes, the current load in ampere is displayed.
  Below the boxes, the current voltage in volt is displayed.
*/

var DT_p1_phaseload = (function () {
    function buildHTML(me, device) {
        let decimals = 1
        if (typeof me.block.decimals !== 'undefined') {
            decimals = parseInt(me.block.decimals)
        }

        // Parse device data: assume format "1.2 A, 2.3 A, 3.4 A"
        const dataArray = device.Data.split(', ')
            .map((str) => {
                if (str.includes(' A')) {
                    return {
                        value: parseFloat(str.replace(' A', '')),
                        unit: 'A',
                    }
                }
                return null
            })
            .filter((d) => d !== null)

        const currents = dataArray
            .filter((d) => d.unit === 'A')
            .map((d) => d.value / me.block.ampere_divider)

        // Assume three phases
        const phases = ['L1', 'L2', 'L3']

        function getColor(percent, block) {
            if (percent < block.threshold_low) return block.color_low
            if (percent < block.threshold_high) return block.color_mid
            return block.color_high
        }

        var l1_voltage = 0
        var l2_voltage = 0
        var l3_voltage = 0

        // Validate voltage device indices exist and devices are available
        if (me.block.l1_voltage_idx) {
            const l1Device = Domoticz.getAllDevices(me.block.l1_voltage_idx)
            if (l1Device && l1Device.Data) {
                l1_voltage = parseInt(l1Device.Data) / me.block.voltage_divider
            }
        }

        if (me.block.l2_voltage_idx) {
            const l2Device = Domoticz.getAllDevices(me.block.l2_voltage_idx)
            if (l2Device && l2Device.Data) {
                l2_voltage = parseInt(l2Device.Data) / me.block.voltage_divider
            }
        }

        if (me.block.l3_voltage_idx) {
            const l3Device = Domoticz.getAllDevices(me.block.l3_voltage_idx)
            if (l3Device && l3Device.Data) {
                l3_voltage = parseInt(l3Device.Data) / me.block.voltage_divider
            }
        }

        var voltage = [
            l1_voltage.toFixed(decimals),
            l2_voltage.toFixed(decimals),
            l3_voltage.toFixed(decimals),
        ]

        var deviceLabel = device.Name || 'Phase load'
        let html = `<svg viewBox="0 0 100 80" class="p1-phaseload-container" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${deviceLabel}"><title>${deviceLabel}</title>`

        phases.forEach((phase, i) => {
            let current = currents[i] || 0
            let percent = (current / me.block.max_current) * 100
            if (percent > 100) percent = 100
            let height = (percent / 100) * 50 // max height 50
            const color = getColor(percent, me.block)
            let x = 10 + i * 30
            let rectY = 70 - height

            // Text above: current in A
            html += `<text x="${
                x + 10
            }" y="10" class="p1-phaseload-current">${current.toFixed(
                decimals,
            )} A</text>`

            // Rectangle for load
            html += `<rect x="${x}" y="20" width="20" height="50" class="p1-phaseload-box-background" />` // background
            html += `<rect x="${x}" y="${rectY}" width="20" height="${height}" fill="${color}" />`

            // Text above: current in A
            html += `<text x="${x + 10}" y="${
                rectY + height + 10
            }" class="p1-phaseload-voltage">${voltage[i]} V</text>`
        })

        html += '</svg>'
        return html
    }

    return {
        name: 'p1-phaseload',
        init: function () {
            return DT_function.loadCSS('./js/components/p1-phaseload.css')
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'p1-phaseload'
        },
        defaultCfg: {
            show_lastupdate: false,
            idx: 1,
            width: 3,
            max: 16,
            max_current: 16,
            decimals: 1,
            voltage_divider: 1000,
            ampere_divider: 1000,
            color_low: 'green',
            color_mid: 'yellow',
            color_high: 'red',
            threshold_low: 33,
            threshold_high: 66,
        },
        run: function (me) {
            me.layout = parseInt(0 + me.block.layout)
            let width = me.block.size || $(me.mountPoint + ' .dt_block').width()
            var height = isDefined(me.block.height)
                ? parseInt(me.block.height)
                : parseInt($(me.mountPoint + ' div').outerWidth())

            me.block.height = parseInt(height)

            Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
                this.value = device.Data
                $(me.mountPoint + ' .dt_content').html(buildHTML(me, device))
            })
        },
    }
})()

Dashticz.register(DT_p1_phaseload)
