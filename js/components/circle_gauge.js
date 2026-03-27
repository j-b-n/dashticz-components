/*
    Circle gauge component for Dashticz with icon in the middle of the circle. The circle is filled 
	according to the current value. The color of the circle can be set by a gradient or by a solid color.
*/

var DT_circle_gauge = (function () {
    function getColor(value, me) {
        if (typeof me.block.SolidColor !== 'undefined') {
            return me.block.SolidColor
        }

        var color = 'white'
        if (typeof me.block.SolidColors !== 'undefined') {
            var percent = (value / me.block.max) * 100
            me.block.SolidColors.forEach((element) => {
                if (element[0] <= percent) {
                    color = element[1]
                }
            })
        }
        return color
    }

    function getLinerGradient(value, arrayColors) {
        html =
            '<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">'
        for (var i = 0; i < arrayColors.length; i++) {
            var color = arrayColors[i][1]
            var percent = arrayColors[i][0]
            html +=
                '<stop offset="' +
                percent +
                '%" style="stop-color:' +
                color +
                '" />'
        }
        html += '</linearGradient>'
        return html
    }

    /**
     * Creates SVG path elements for a donut-shaped circle divided into segments.
     *
     * @param {number} x The x-coordinate of the center.
     * @param {number} y The y-coordinate of the center.
     * @param {number} outerRadius The outer radius of the donut.
     * @param {string} svgNS The SVG namespace (usually "http://www.w3.org/2000/svg").
     * @param {number} [thicknessRatio=0.3] Optional parameter (0.0 to 1.0) determining the donut's thickness
     * as a percentage of the outer radius. Defaults to 0.3 (30%).
     * @param {number} [numberOfSegments=20] The total number of segments if the circle were 100% filled.
     * @param {number} percent The percentage to fill the circle (determines how many segments are drawn).
     * @returns {SVGPathElement[]} An array of SVGPathElement objects, each representing a segment of the donut.
     */
    function createDonutSegments(
        x,
        y,
        outerRadius,
        svgNS,
        thicknessRatio = 0.3,
        numberOfSegments = 20,
        percent,
    ) {
        const anglePerSegment = (2 * Math.PI) / numberOfSegments // Angle in radians for each segment

        // Define the offset to start drawing from the top (12 o'clock position)
        const angleOffset = -Math.PI / 2 // This is -90 degrees

        if (thicknessRatio <= 0 || thicknessRatio >= 1) {
            console.warn(
                'thicknessRatio should be between 0 (exclusive) and 1 (exclusive). Using default value 0.3.',
            )
            thicknessRatio = 0.3
        }
        const thickness = outerRadius * thicknessRatio
        const innerRadius = outerRadius - thickness

        const paths = []

        const _segmentsToDraw = Math.round(numberOfSegments * (percent / 100))

        for (
            let currentSegmentIndex = 0;
            currentSegmentIndex < _segmentsToDraw;
            currentSegmentIndex++
        ) {
            // Adjust startAngle and endAngle with the offset
            const startAngle =
                angleOffset + currentSegmentIndex * anglePerSegment
            const endAngle =
                angleOffset + (currentSegmentIndex + 1) * anglePerSegment

            // Calculate points for the outer arc
            const outerStartX = x + outerRadius * Math.cos(startAngle)
            const outerStartY = y + outerRadius * Math.sin(startAngle)
            const outerEndX = x + outerRadius * Math.cos(endAngle)
            const outerEndY = y + outerRadius * Math.sin(endAngle)

            // Calculate points for the inner arc
            const innerStartX = x + innerRadius * Math.cos(startAngle)
            const innerStartY = y + innerRadius * Math.sin(startAngle)
            const innerEndX = x + innerRadius * Math.cos(endAngle)
            const innerEndY = y + innerRadius * Math.sin(endAngle)

            // Create the SVG path data string for one segment
            // M = moveTo
            // A = elliptical arc (rx ry x-axis-rotation large-arc-flag sweep-flag x y)
            // L = lineTo
            // Z = closePath
            const pathData = `
      M ${outerStartX} ${outerStartY}
      A ${outerRadius} ${outerRadius} 0 0 1 ${outerEndX} ${outerEndY}
      L ${innerEndX} ${innerEndY}
      A ${innerRadius} ${innerRadius} 0 0 0 ${innerStartX} ${innerStartY}
      Z
    `

            const pathElement = document.createElementNS(svgNS, 'path')
            pathElement.setAttribute('d', pathData.trim())

            paths.push(pathElement)
        }
        return paths
    }

    // Returns a single rgb color interpolation between given rgb color
    // based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
    function interpolateColor(color1, color2, factor) {
        if (arguments.length < 3) {
            factor = 0.5
        }
        var result = color1.slice()
        for (var i = 0; i < 3; i++) {
            result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]))
        }
        return result
    }
    // My function to interpolate between two colors completely, returning an array
    function interpolateColors(color1, color2, steps) {
        var stepFactor = 1 / (steps - 1),
            interpolatedColorArray = []

        color1 = color1.match(/\d+/g).map(Number)
        color2 = color2.match(/\d+/g).map(Number)

        for (var i = 0; i < steps; i++) {
            interpolatedColorArray.push(
                interpolateColor(color1, color2, stepFactor * i),
            )
        }

        return interpolatedColorArray
    }

    function mycircle(me, device) {
        const svgElement = document.getElementById(
            'circle-gauge-svg-' + me.block.idx,
        )
        const svgNS = 'http://www.w3.org/2000/svg' // SVG Namespace

        if (svgElement) {
            svgElement.innerHTML = ''
            var value_text = ''
            var decimals = 0
            var textColor = 'white'
            if (typeof me.block.decimals !== 'undefined') {
                decimals = parseInt(me.block.decimals)
            }

            switch (device.SubType) {
                case 'Custom':
                case 'Electric':
                    value = parseFloat(device.Data).toFixed(decimals)
                    value_text = ''

                    break
                case 'Temp + Humidity':
                    value = parseFloat(device.Temp).toFixed(decimals)
                    break
                case 'Energy':
                    value = parseFloat(device.Usage).toFixed(decimals)
                    break
            }

            if (me.block.units) {
                value_text = value + ' ' + me.block.units
            } else {
                value_text = value
            }
            percent = (value / me.block.max) * 100

            var titleLabel =
                (device.Name || me.block.title || 'Gauge') + ': ' + value_text
            svgElement.setAttribute('aria-label', titleLabel)
            var titleEl = document.createElementNS(svgNS, 'title')
            titleEl.textContent = titleLabel
            svgElement.appendChild(titleEl)

            const centerX = 200
            const centerY = 200
            const radius = 150
            const thicknessParam = 0.4 // x% thickness

            const donutSegments = createDonutSegments(
                centerX,
                centerY,
                radius,
                svgNS,
                thicknessParam,
                me.block.segments,
                percent,
            )

            var colors = interpolateColors(
                'rgb(255, 255, 255)',
                'rgb(255, 0, 0)',
                me.block.segments,
            )
            //    console.log(colors);

            // Append each segment to the SVG element and style them
            donutSegments.forEach((segment, index) => {
                // Example of simple styling - vary the color for each segment
                //const hue = (index * (360 / me.block.segments)) % 360;
                //segment.setAttribute("fill", `hsl(${hue}, 70%, 70%)`);
                segment.setAttribute(
                    'fill',
                    `rgb(${colors[index][0]},${colors[index][1]},${colors[index][2]})`,
                )
                segment.setAttribute('stroke', 'none')
                segment.setAttribute('stroke-width', '1.5')
                svgElement.appendChild(segment)
            })

            //Append value
            var newText = document.createElementNS(svgNS, 'text')
            newText.setAttributeNS(null, 'text-anchor', 'middle')
            newText.setAttributeNS(null, 'dominant-baseline', 'central')
            newText.setAttributeNS(null, 'x', centerX)
            newText.setAttributeNS(null, 'y', centerY)
            newText.setAttributeNS(null, 'font-family', 'Helvetica')
            newText.setAttributeNS(null, 'font-size', '50')
            newText.setAttributeNS(null, 'fill', textColor)
            var textNode = document.createTextNode(value_text)
            newText.appendChild(textNode)
            svgElement.appendChild(newText)
        } else {
            console.error('Could not find the SVG element.')
        }
    }

    function buildHTML(me, device) {
        var color = 'white'
        var value = '0'
        var percent = 0
        var angle = 0
        var radius = 45
        var html = ''

        var decimals = 0
        if (typeof me.block.decimals !== 'undefined') {
            decimals = parseInt(me.block.decimals)
        }

        html +=
            '<svg id="circle-gauge-svg-' +
            me.block.idx +
            '" viewBox="0 0 400 400" class="circle-gauge" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
            (me.block.title || 'Gauge') +
            '">'
        html += '</svg>\n'

        return html
    }

    return {
        name: 'circle-gauge',
        canHandle: function (block) {
            return block && block.type && block.type === 'circle-gauge'
        },
        init: function () {
            return DT_function.loadCSS('./js/components/circle_gauge.css')
        },
        defaultCfg: {
            //title: '',
            iconName: 'fas fa-robot',
            show_lastupdate: false,
            idx: 1,
            min: 0,
            max: 100,
            needle: false,
            width: 3,
            segments: 20,
        },
        run: function (me) {
            me.layout = parseInt(0 + me.block.layout)
            var height = isDefined(me.block.height)
                ? parseInt(me.block.height)
                : parseInt($(me.mountPoint + ' div').outerWidth())

            me.block.height = parseInt(height)

            if (me.block.demo == true) {
                me.block.needle = true
                me.block.needleColor = 'white'

                device = {
                    Data: me.block.demoValue,
                    Type: 'Custom',
                    SubType: 'Custom',
                    idx: 1,
                }
                $(me.mountPoint + ' .dt_content').html(buildHTML(me, device))

                if (me._demoInterval) clearInterval(me._demoInterval)
                me._demoInterval = setInterval(function () {
                    me.block.demoValue += me.block.max / me.block.segments

                    if (me.block.demoValue > me.block.max) {
                        me.block.demoValue = 0
                    }
                    device = {
                        Data: me.block.demoValue,
                        Type: 'Custom',
                        SubType: 'Custom',
                        idx: 1,
                    }
                    mycircle(me, device)
                    //$(me.mountPoint + " .dt_content").html(buildHTML(me, device));
                }, 1000)
            } else {
                var device = Domoticz.getAllDevices(me.block.idx)
                if (!device) {
                    $(me.mountPoint).html(
                        '<div class="error">Device not found (idx: ' +
                            me.block.idx +
                            ')</div>',
                    )
                    return
                }
                $(me.mountPoint + ' .dt_content').html(buildHTML(me, device))
                Dashticz.subscribeDevice(
                    me,
                    me.block.idx,
                    true,
                    function (device) {
                        this.value = device.Data
                        mycircle(me, device)
                    },
                )
            }
        },
    }
})()

Dashticz.register(DT_circle_gauge)
