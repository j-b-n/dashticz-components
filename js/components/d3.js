var DT_d3 = (function () {
    function d3ResolveDeviceIdxs(me) {
        var deviceIdxs = []

        if ($.isArray(me.block.devices)) {
            deviceIdxs = me.block.devices.slice(0, 2)
        } else if (typeof me.block.devices === 'string') {
            deviceIdxs = me.block.devices.split(',')
        } else {
            deviceIdxs.push(me.block.idx)
            if (typeof me.block.idx2 !== 'undefined') {
                deviceIdxs.push(me.block.idx2)
            } else if (typeof me.block.secondaryIdx !== 'undefined') {
                deviceIdxs.push(me.block.secondaryIdx)
            }
        }

        deviceIdxs = $.map(deviceIdxs, function (idx) {
            var parsedIdx = parseInt(idx)
            return isNaN(parsedIdx) ? null : parsedIdx
        })

        return $.grep(deviceIdxs, function (idx, position) {
            return idx !== null && deviceIdxs.indexOf(idx) === position
        }).slice(0, 2)
    }

    function d3GetLineColor(me, seriesIndex) {
        var defaultLineColors = ['#f2de63', '#9ad8e6']

        if (
            $.isArray(me.block.lineColors) &&
            me.block.lineColors[seriesIndex]
        ) {
            return me.block.lineColors[seriesIndex]
        }

        if (seriesIndex === 0 && typeof me.block.accentColor !== 'undefined') {
            return me.block.accentColor
        }

        if (
            seriesIndex === 1 &&
            typeof me.block.secondaryAccentColor !== 'undefined'
        ) {
            return me.block.secondaryAccentColor
        }

        if (me.block.chartTemplate === 'red') {
            return seriesIndex === 0 ? '#E03534' : '#F7A1A1'
        }

        if (me.block.chartTemplate === 'green') {
            return seriesIndex === 0 ? '#00FF80' : '#8FFFD0'
        }

        if (me.block.chartTemplate === 'blue') {
            return seriesIndex === 0 ? '#0080FF' : '#7BC7FF'
        }

        return defaultLineColors[seriesIndex] || defaultLineColors[0]
    }

    function d3GetTextColor(me) {
        if (typeof me.block.textColor !== 'undefined') {
            return me.block.textColor
        }

        return '#F5F5F5'
    }

    function d3GetSecondaryTextColor(me) {
        if (typeof me.block.secondaryTextColor !== 'undefined') {
            return me.block.secondaryTextColor
        }

        return '#A9ADB5'
    }

    function d3FormatCurrentValue(device, unitsOverride) {
        var value = device.currentValue
        var formattedValue = value
        var numericValue = parseFloat(value)

        if (!isNaN(numericValue) && isFinite(numericValue)) {
            formattedValue = numericValue.toFixed(device.decimals)
        }

        if (device.SubType === 'Energy' && device.Usage) {
            formattedValue = device.Usage
        }

        var unit =
            typeof unitsOverride !== 'undefined'
                ? unitsOverride
                : device.txtUnit
        if (!unit || device.type === 'text') {
            return '' + formattedValue
        }

        return formattedValue + ' ' + unit
    }

    function d3GetChartValueKey(me, seriesIndex) {
        if (
            $.isArray(me.block.chartValues) &&
            typeof me.block.chartValues[seriesIndex] !== 'undefined'
        ) {
            return me.block.chartValues[seriesIndex]
        }

        if (seriesIndex === 1 && typeof me.block.chartValue2 !== 'undefined') {
            return me.block.chartValue2
        }

        return me.block.chartValue
    }

    function d3RenderDeviceHeader(svg, me, device, seriesIndex, width) {
        var textColor = d3GetTextColor(me)
        var secondaryTextColor = d3GetSecondaryTextColor(me)
        var isRightAligned = seriesIndex === 1
        var anchor = isRightAligned ? 'end' : 'start'
        var valueX = isRightAligned ? width - 16 : 16
        var labelX = isRightAligned ? width - 16 : 16
        var valueY = 38
        var labelY = 60

        svg.append('text')
            .attr('x', valueX)
            .attr('y', valueY)
            .attr('text-anchor', anchor)
            .style('font-family', 'Helvetica')
            .style('font-size', me.graphDevices.length > 1 ? 28 : 20)
            .style('font-weight', '700')
            .attr('fill', textColor)
            .text(d3FormatCurrentValue(device, me.block.units))

        svg.append('text')
            .attr('x', labelX)
            .attr('y', labelY)
            .attr('text-anchor', anchor)
            .style('font-family', 'Helvetica')
            .style('font-size', 12)
            .attr('fill', secondaryTextColor)
            .text(device.title)
    }

    function d3RenderSingleDeviceValue(svg, me, width, height) {
        var middleX = width / 2
        var middleY = height / 2

        svg.append('text')
            .attr('x', 16)
            .attr('y', 20)
            .attr('text-anchor', 'start')
            .style('font-family', 'Helvetica')
            .style('font-size', 12)
            .attr('fill', d3GetSecondaryTextColor(me))
            .text(me.block.title || me.graphDevice.title)

        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('x', middleX)
            .attr('y', middleY)
            .style('font-family', 'Helvetica')
            .style('font-size', 20)
            .style('font-weight', '700')
            .attr('fill', d3GetTextColor(me))
            .text(d3FormatCurrentValue(me.graphDevice, me.block.units))
    }

    /** Initialization of the Graph object */
    function d3Initialize(me) {
        me.$block = me.$mountPoint.find('.dt_block')
        //me.$block = me.$mountPoint.find('.dt_state');
        //me.$block.html('<canvas id="'+'d3-'+me.block.idx+'"> </canvas>');
        me.$block.html(
            '<div id="' +
                'd3-' +
                me.block.idx +
                '" ' +
                'class="block_' +
                me.block.type +
                ' col-xs-' +
                me.block.width +
                '">' +
                '</div>',
        )

        me.block.range = 'day'

        //var height = isDefined(me.block.height)
        //    ? parseInt(me.block.height)
        //    : parseInt($(me.mountPoint + ' div').outerWidth());

        var width = parseInt(me.$mountPoint.find('div').innerWidth()) - 10

        me.layout = parseInt(0 + me.block.layout)
        var height = isDefined(me.block.height)
            ? parseInt(me.block.height)
            : parseInt($(me.mountPoint + ' div').outerWidth())
        if (height < 0) {
            console.log('dial width unknown.')
            me.height = me.height * me.block.scale || 100
        } else me.height = height * me.block.scale || me.height

        me.block.height = parseInt(height)

        if (me.block.height > 155) me.block.height = 155

        me._pixelWidth = parseInt(width)

        me.deviceIdxs = d3ResolveDeviceIdxs(me)
        me.graphDevices = []

        $.each(me.deviceIdxs, function (_, idx) {
            var device = Domoticz.getAllDevices(idx)
            if (!device) {
                console.warn(
                    'D3 component: Device not found (idx: ' + idx + ')',
                )
                return
            }

            var graphDevice = $.extend({}, device)
            d3GetDeviceDefaults(me, graphDevice)
            me.graphDevices.push(graphDevice)
        })

        if (!me.graphDevices.length) {
            console.warn('D3 component: No valid devices configured')
            return
        }

        me.graphDevice = me.graphDevices[0]
    }

    /**
     * Extends device with all default graph parameters
     * */
    function d3GetDeviceDefaults(me, device) {
        var currentValue = device['Data']
        var sensor = 'counter'
        var txtUnit = '?'
        var decimals = 2
        var method = 1
        var type

        switch (device['Type']) {
            case 'Rain':
                sensor = 'rain'
                txtUnit = 'mm'
                decimals = 1
                break
            case 'Lux':
                sensor = 'counter'
                txtUnit = 'Lux'
                decimals = 0
                break
            case 'UV':
                sensor = 'uv'
                txtUnit = 'Lux'
                decimals = 1
                break
            case 'Wind':
                sensor = 'wind'
                var windspeed = device.Data.split(';')[2] / 10
                if (settings['use_beaufort']) {
                    currentValue = Beaufort(windspeed)
                    decimals = 0
                    txtUnit = 'Bft'
                } else {
                    currentValue = windspeed
                    decimals = 1
                    txtUnit = 'm/s'
                }
                break
            case 'Temp':
            case 'Temp + Humidity':
            case 'Temp + Humidity + Baro':
            case 'Temp + Baro':
            case 'Heating':
                sensor = 'temp'
                txtUnit = _TEMP_SYMBOL
                currentValue = device['Temp']
                decimals = 1
                break
            case 'Humidity':
                sensor = 'temp'
                txtUnit = '%'
                decimals = 1
                break
            case 'RFXMeter':
                txtUnit = device['CounterToday'].split(' ')[1]
                currentValue = device['CounterToday'].split(' ')[0]
                switch (device['SwitchTypeVal']) {
                    case 0: //Energy
                        break
                    case 1: //Gas
                        break
                    case 2: //Water
                        decimals = 0
                        break
                    case 3: //Counter
                        break
                    case 4: //Energy generated
                        break
                    case 5: //Time
                        break
                }
                break
            case 'Air Quality':
                sensor = 'counter'
                txtUnit = 'ppm'
                decimals = 1
                break
        }

        switch (device['SubType']) {
            case 'Percentage':
                sensor = 'Percentage'
                txtUnit = '%'
                decimals = 1
                break
            case 'Custom Sensor':
                sensor = 'Percentage'
                txtUnit = device['SensorUnit']
                decimals = 2
                break
            case 'Gas':
                txtUnit = 'm3'
                currentValue = device['CounterToday']
                method = 0
                break
            case 'Electric':
                txtUnit = 'Watt'
                break
            case 'Energy':
            case 'kWh':
            case 'YouLess counter':
                txtUnit = device.SwitchTypeVal == 1 ? 'm3' : 'kWh' //SwitchTypeVal 0: Electra; 1: Gas
                currentValue = device['CounterToday']
                break
            case 'Managed Counter':
                txtUnit = 'kWh'
                break
            case 'Visibility':
                txtUnit = 'km'
                break
            case 'Radiation':
            case 'Solar Radiation':
                txtUnit = 'Watt/m2'
                decimals = 0
                break
            case 'Pressure':
                txtUnit = 'Bar'
                break
            case 'Soil Moisture':
                txtUnit = 'cb'
                break
            case 'Leaf Wetness':
                txtUnit = 'Range'
                break
            case 'A/D':
                txtUnit = 'mV'
                break
            case 'Voltage':
            case 'VoltageGeneral':
                txtUnit = 'V'
                break
            case 'DistanceGeneral':
            case 'Distance':
                txtUnit = 'cm'
                break
            case 'Sound Level':
                txtUnit = 'dB'
                break
            case 'CurrentGeneral':
            case 'CM113, Electrisave':
            case 'Current':
                txtUnit = 'A'
                break
            case 'Weight':
                txtUnit = 'kg'
                break
            case 'Waterflow':
                sensor = 'Percentage'
                txtUnit = 'l/min'
                break
            case 'Counter Incremental':
                txtUnit = device['CounterToday'].split(' ')[1]
                currentValue = device['CounterToday'].split(' ')[0]
                break
            case 'Barometer':
                sensor = 'temp'
                txtUnit = device['Data'].split(' ')[1]
                break
            case 'SetPoint':
                sensor = 'temp'
                txtUnit = _TEMP_SYMBOL
                currentValue = device['SetPoint']
                decimals = 1
                break
        }

        if (device.SwitchType) {
            //device is a switch
            sensor = ''
            currentValue = device['Data']
            decimals = 0
            txtUnit = 'level'
            type = 'text'
        }

        if (typeof me.block.decimals !== 'undefined')
            decimals = me.block.decimals

        var obj = {
            currentValue: currentValue,
            idx: parseInt(device.idx),
            name: device.Name,
            sensor: sensor,
            subtype: device.SubType,
            title: device.Name,
            txtUnit: txtUnit,
            type: type || device.Type,
            decimals: decimals,
            method: method,
        }

        $.extend(device, obj)
    }

    function d3GetRegularGraphData(me, device) {
        var cmd = Domoticz.info.api15330
            ? 'type=command&param=graph'
            : 'type=graph'
        var params =
            cmd +
            '&sensor=' +
            device.sensor +
            '&idx=' +
            device.idx +
            '&range=' +
            me.block.range +
            '&method=' +
            device.method //todo: check method

        me.params = params
        return Domoticz.request(params)
    }

    function d3CreateGraph(me) {
        //var w = parseInt(me.$mountPoint.width()); // * me.block.scale);
        //var w = parseInt(me.$mountPoint.find('div').innerWidth())
        //var h = parseInt($(me.mountPoint + ' div').outerWidth());
        var w = me._pixelWidth || me.block.width
        var h = me.block.height

        // Setting dimensions
        const margin = { top: 0, right: 0, bottom: 0, left: 0 },
            width = w - margin.left - margin.right,
            height = h - margin.top - margin.bottom

        //var dimension = dimensions[10];

        var seriesData = me.seriesData || []
        var allValues = []
        var maxPoints = 0

        $.each(seriesData, function (_, series) {
            maxPoints = Math.max(maxPoints, series.lineData.length)
            $.each(series.lineData, function (_, point) {
                allValues.push(point[1])
            })
        })

        if (!allValues.length || !maxPoints) {
            return
        }

        var element = document.getElementById('SVG-' + me.block.idx)
        if (element) element.innerHTML = ''

        element = document.getElementById('d3-' + me.block.idx)
        if (!element) return // container not in DOM (user navigated away)
        element.innerHTML = ''

        d3.select('#SVG-' + me.block.idx).remove()

        //element = document.getElementById('d3-'+me.block.idx);

        var svgRoot = d3
            .select(element)
            .append('svg')
            .attr('id', 'SVG-' + me.block.idx)
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'graph-svg-component')

        var defs = svgRoot.append('defs')

        var svg = svgRoot
            .append('g')
            .attr(
                'transform',
                'translate(' + margin.left + ',' + margin.top + ')',
            )
        var xMax = Math.max(1, maxPoints - 1)
        var xScale = d3.scaleLinear().domain([0, xMax]).range([0, width])
        var yScale = d3.scaleLinear().range([height, 0])

        var arr = d3.extent(allValues)
        if (arr.length === 2) {
            var padding = Math.max(0.5, (arr[1] - arr[0]) * 0.1)
            if (arr[0] === arr[1]) {
                padding = Math.max(0.5, Math.abs(arr[0]) * 0.1)
            }
            arr[0] = arr[0] - padding
            arr[1] = arr[1] + padding
        }

        yScale.domain(arr)

        svg.append('svg:rect')
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('x', 1)
            .attr('y', 1)
            .attr('width', width - 2)
            .attr('height', height - 2)
            .style('fill', 'transparent')

        var area = d3
            .area()
            .curve(d3.curveMonotoneX)
            .x(function (d) {
                return xScale(d[0])
            })
            .y0(height)
            .y1(function (d) {
                return yScale(d[1])
            })

        var line = d3
            .line()
            .curve(d3.curveMonotoneX)
            .x(function (d) {
                return xScale(d[0])
            })
            .y(function (d) {
                return yScale(d[1])
            })

        $.each(seriesData, function (seriesIndex, series) {
            var lineColor = d3GetLineColor(me, seriesIndex)
            var gradientId = me.block.idx + '-area-gradient-' + seriesIndex

            defs.append('linearGradient')
                .attr('id', gradientId)
                .attr('gradientUnits', 'userSpaceOnUse')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', height)
                .selectAll('stop')
                .data([
                    { offset: '0%', color: lineColor, opacity: 0.35 },
                    { offset: '55%', color: lineColor, opacity: 0.18 },
                    { offset: '100%', color: lineColor, opacity: 0 },
                ])
                .enter()
                .append('stop')
                .attr('offset', function (d) {
                    return d.offset
                })
                .attr('stop-color', function (d) {
                    return d.color
                })
                .attr('stop-opacity', function (d) {
                    return d.opacity
                })

            svg.append('path')
                .datum(series.lineData)
                .attr('class', 'area')
                .style('fill', 'url(#' + gradientId + ')')
                .attr('d', area)

            svg.append('path')
                .datum(series.lineData)
                .attr('class', 'line')
                .attr('fill', 'none')
                .attr('d', line)
                .style('stroke', lineColor)
                .style('stroke-width', me.graphDevices.length > 1 ? '3' : '2')
                .style('stroke-linecap', 'round')
                .style('stroke-linejoin', 'round')

            if (me.graphDevices.length > 1) {
                d3RenderDeviceHeader(svg, me, series.device, seriesIndex, width)
            }
        })

        if (me.graphDevices.length === 1) {
            d3RenderSingleDeviceValue(svg, me, width, height)
        }
    }

    /** This function will update the graph.
     * All graph data must be available.
     */
    function d3FormatData(me, seriesResults) {
        var max = me._pixelWidth || me.block.width
        me.seriesData = []

        $.each(seriesResults, function (seriesIndex, seriesResult) {
            var lineData = []
            var chartValueKey = d3GetChartValueKey(me, seriesIndex)

            if (
                !seriesResult ||
                typeof seriesResult.result !== 'object' ||
                !seriesResult.result.length
            ) {
                return
            }

            var arr = seriesResult.result
            var startIndex = Math.max(0, arr.length - max)

            for (var i = startIndex; i < arr.length; i++) {
                var value = parseFloat(arr[i][chartValueKey])

                if (isNaN(value)) {
                    continue
                }

                lineData.push([lineData.length, value])
            }

            if (lineData.length) {
                me.seriesData.push({
                    device: seriesResult.device,
                    idx: seriesResult.idx,
                    lineData: lineData,
                    txtUnit: seriesResult.txtUnit,
                    chartValueKey: chartValueKey,
                })
            }
        })
    }

    function d3GetDeviceGraphData(me, device) {
        return d3GetRegularGraphData(me, device).then(function (data) {
            data.device = device
            data.idx = device.idx
            data.txtUnit = device.txtUnit
            return data
        })
    }

    function d3GetAllGraphData(me) {
        var requests = $.map(me.graphDevices, function (device) {
            return d3GetDeviceGraphData(me, device)
        })

        return $.when.apply($, requests).then(function () {
            if (requests.length === 1) {
                return [arguments[0]]
            }

            return Array.prototype.slice.call(arguments)
        })
    }

    /** Pulls all graph data from Domoticz and refreshes the graph
     *
     */
    function d3RefreshGraph(me) {
        $.each(me.graphDevices, function (_, device) {
            d3GetDeviceDefaults(me, device)
        })

        d3GetAllGraphData(me).then(function (seriesResults) {
            d3FormatData(me, seriesResults)
            d3CreateGraph(me)
        })
    }

    /** This function handles a device update
     *
     * */
    function d3DeviceUpdate(me, graphDevice, device) {
        $.extend(graphDevice, device)
        d3GetDeviceDefaults(me, graphDevice) //In fact we only need a update of currentValue, but this is the most easy
        DT_d3.refresh(me)
    }

    return {
        name: 'd3',
        canHandle: function (block) {
            return block && block.type && block.type === 'd3'
        },
        init: function () {
            DT_function.loadCSS('./js/components/d3.css')
            return DT_function.loadScript('//d3js.org/d3.v7.min.js')
        },
        defaultCfg: function (block) {
            return {
                refresh: 3600, //update once per hour
            }
        },
        run: function (me) {
            try {
                d3Initialize(me)
                if (!me.graphDevices || !me.graphDevices.length) {
                    me.block.refresh = 0
                    return
                }
                //subscribe to sensor data
                $.each(me.graphDevices, function (_, graphDevice) {
                    Dashticz.subscribeDevice(
                        me,
                        graphDevice.idx,
                        true,
                        function (device) {
                            d3DeviceUpdate(me, graphDevice, device)
                        },
                    )
                })
            } catch (err) {
                console.warn(err)
                me.block.refresh = 0 //prevent refresh of graph in case of error during initialization
            }
        },
        refresh: function (me) {
            d3RefreshGraph(me)
        },
    }
})()

Dashticz.register(DT_d3)
