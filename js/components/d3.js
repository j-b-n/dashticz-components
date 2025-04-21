var DT_d3 = (function () {
    
    /** Initialization of the Graph object */
    function d3Initialize(me) {
	    me.$block = me.$mountPoint.find('.dt_block');
	//me.$block = me.$mountPoint.find('.dt_state');
	//me.$block.html('<canvas id="'+'d3-'+me.block.idx+'"> </canvas>');
	me.$block.html('<div id="' + 'd3-' + me.block.idx +'" '+
                       'class="block_'+
                       me.block.type +
                       ' col-xs-' +
                       me.block.width +
                       '">' +                       
                       '</div>');
        
	me.block.range = "day";

		//var height = isDefined(me.block.height)
		//    ? parseInt(me.block.height)
		//    : parseInt($(me.mountPoint + ' div').outerWidth());

		var width = parseInt(me.$mountPoint.find('div').innerWidth()) - 10;

		me.layout = parseInt(0 + me.block.layout);
		var height = isDefined(me.block.height)
			? parseInt(me.block.height)
			: parseInt($(me.mountPoint + ' div').outerWidth());
		if (height < 0) {
			console.log('dial width unknown.');
			me.height = me.height * me.block.scale || 100;
		} else me.height = height * me.block.scale || me.height;

		me.block.height = parseInt(height);

		if (me.block.height > 155)
			me.block.height = 155;

		me.block.width = parseInt(width);

		var device = Domoticz.getAllDevices(me.block.idx);
		$.extend(device, Domoticz.getAllDevices(me.block.idx)); //Make a copy of the current device data

		me.graphDevice = device;
		d3GetDeviceDefaults(me, me.graphDevice);
	}

	/** 
	 * Extends device with all default graph parameters
	 * */
	function d3GetDeviceDefaults(me, device) {
		var currentValue = device['Data'];
		var sensor = 'counter';
		var txtUnit = '?';
		var decimals = 2;
		var method = 1;
		var type;

		switch (device['Type']) {
			case 'Rain':
				sensor = 'rain';
				txtUnit = 'mm';
				decimals = 1;
				break;
			case 'Lux':
				sensor = 'counter';
				txtUnit = 'Lux';
				decimals = 0;
				break;
			case 'UV':
				sensor = 'uv';
				txtUnit = 'Lux';
				decimals = 1;
				break;
			case 'Wind':
				sensor = 'wind';
				var windspeed = device.Data.split(';')[2] / 10;
				if (settings['use_beaufort']) {
					currentValue = Beaufort(windspeed);
					decimals = 0;
					txtUnit = 'Bft';
				} else {
					currentValue = windspeed;
					decimals = 1;
					txtUnit = 'm/s';
				}
				break;
			case 'Temp':
			case 'Temp + Humidity':
			case 'Temp + Humidity + Baro':
			case 'Temp + Baro':
			case 'Heating':
				sensor = 'temp';
				txtUnit = _TEMP_SYMBOL;
				currentValue = device['Temp'];
				decimals = 1;
				break;
			case 'Humidity':
				sensor = 'temp';
				txtUnit = '%';
				decimals = 1;
				break;
			case 'RFXMeter':
				txtUnit = device['CounterToday'].split(' ')[1];
				currentValue = device['CounterToday'].split(' ')[0];
				switch (device['SwitchTypeVal']) {
					case 0: //Energy
						break;
					case 1: //Gas
						break;
					case 2: //Water
						decimals = 0;
						break;
					case 3: //Counter
						break;
					case 4: //Energy generated
						break;
					case 5: //Time
						break;
				}
				break;
			case 'Air Quality':
				sensor = 'counter';
				txtUnit = 'ppm';
				decimals = 1;
				break;
		}

		switch (device['SubType']) {
			case 'Percentage':
				sensor = 'Percentage';
				txtUnit = '%';
				decimals = 1;
				break;
			case 'Custom Sensor':
				sensor = 'Percentage';
				txtUnit = device['SensorUnit'];
				decimals = 2;
				break;
			case 'Gas':
				txtUnit = 'm3';
				currentValue = device['CounterToday'];
				method = 0;
				break;
			case 'Electric':
				txtUnit = 'Watt';
				break;
			case 'Energy':
			case 'kWh':
			case 'YouLess counter':
				txtUnit = device.SwitchTypeVal == 1 ? 'm3' : 'kWh'; //SwitchTypeVal 0: Electra; 1: Gas
				currentValue = device['CounterToday'];
				break;
			case 'Managed Counter':
				txtUnit = 'kWh';
				break;
			case 'Visibility':
				txtUnit = 'km';
				break;
			case 'Radiation':
			case 'Solar Radiation':
				txtUnit = 'Watt/m2';
				decimals = 0;
				break;
			case 'Pressure':
				txtUnit = 'Bar';
				break;
			case 'Soil Moisture':
				txtUnit = 'cb';
				break;
			case 'Leaf Wetness':
				txtUnit = 'Range';
				break;
			case 'A/D':
				txtUnit = 'mV';
				break;
			case 'Voltage':
			case 'VoltageGeneral':
				txtUnit = 'V';
				break;
			case 'DistanceGeneral':
			case 'Distance':
				txtUnit = 'cm';
				break;
			case 'Sound Level':
				txtUnit = 'dB';
				break;
			case 'CurrentGeneral':
			case 'CM113, Electrisave':
			case 'Current':
				txtUnit = 'A';
				break;
			case 'Weight':
				txtUnit = 'kg';
				break;
			case 'Waterflow':
				sensor = 'Percentage';
				txtUnit = 'l/min';
				break;
			case 'Counter Incremental':
				txtUnit = device['CounterToday'].split(' ')[1];
				currentValue = device['CounterToday'].split(' ')[0];
				break;
			case 'Barometer':
				sensor = 'temp';
				txtUnit = device['Data'].split(' ')[1];
				break;
			case 'SetPoint':
				sensor = 'temp';
				txtUnit = _TEMP_SYMBOL;
				currentValue = device['SetPoint'];
				decimals = 1;
				break;
		}

		if (device.SwitchType) {
			//device is a switch
			sensor = '';
			currentValue = device['Data'];
			decimals = 0;
			txtUnit = 'level';
			type = 'text';
		}


		if (typeof me.block.decimals !== 'undefined') decimals = me.block.decimals;

		if (typeof me.decimals === 'undefined') me.decimals = decimals;

		var obj = {
			currentValue: currentValue,
			idx: parseInt(device.idx),
			name: device.Name,
			sensor: sensor,
			subtype: device.SubType,
			title: device.Name,
			txtUnit: txtUnit,
			type: device.Type,
			decimals: decimals,
			method: method,
		};

		$.extend(device, obj);
	}

	function d3GetRegularGraphData(me) {
		var cmd = Domoticz.info.api15330 ? 'type=command&param=graph' : 'type=graph';
		//var device = Domoticz.getAllDevices(me.block.idx);
		var device = me.graphDevice;
		var params = cmd +
			'&sensor=' +
			device.sensor +
			'&idx=' +
			me.block.idx +
			'&range=' +
			me.block.range +
			'&method=' +
			device.method; //todo: check method

		me.params = params;
		return Domoticz.request(params);
	}

	function d3CreateGraph(me) {
		var accentColor = '';
		var areaColor = '';
		var textColor = ''

		if (me.block.chartTemplate === "red") {
			accentColor = '#E03534';
			areaColor = '#861313';
			textColor = accentColor;
		}

		if (me.block.chartTemplate === "green") {
			accentColor = '#00FF80';
			areaColor = '#006600';
			textColor = accentColor;
		}

		if (me.block.chartTemplate === "blue") {
			accentColor = '#0080FF';
			areaColor = '#000066';
			textColor = accentColor;
		}


		if (typeof me.block.accentColor !== 'undefined') {
			accentColor = me.block.accentColor;
		}

		if (typeof me.block.areaColor !== 'undefined') {
			areaColor = me.block.areaColor;
		}

		if (typeof me.block.textColor !== 'undefined') {
			textColor = me.block.textColor;
		}


		//var w = parseInt(me.$mountPoint.width()); // * me.block.scale);
		//var w = parseInt(me.$mountPoint.find('div').innerWidth())
		//var h = parseInt($(me.mountPoint + ' div').outerWidth());
		var w = me.block.width;
		var h = me.block.height;

		// Setting dimensions
		const margin = { top: 0, right: 0, bottom: 0, left: 0 },
			width = w - margin.left - margin.right,
			height = h - margin.top - margin.bottom;


		//var dimension = dimensions[10];

		var max = width;

		var lineData = me.block.lineData;

		//const maxY = d3.max(lineData, function(d) { return +d[1]; }) + 1;
		const maxY = d3.max(lineData, d => d[1]) + 1;
		//console.log(me.block.idx+" MaxY: "+d3.max(lineData,d=>d[1]))
		//console.log("MaxY:"+maxY);

		var element = document.getElementById('SVG-' + me.block.idx);
		if (element) element.innerHTML = "";

		element = document.getElementById('d3-' + me.block.idx);
		if (element) element.innerHTML = "";

		d3.select("SVG-" + me.block.idx).remove();
		d3.select("d3-" + me.block.idx).remove();

		//element = document.getElementById('d3-'+me.block.idx);

		var svg = d3.select(element)
			.append('svg')
			.attr("id", "SVG-" + me.block.idx)
			.attr('width', width)
			.attr('height', height)
			.attr("class", "graph-svg-component")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			;

		var xScale = d3.scaleLinear().domain([0, width]).range([0, width]);
	        var yScale = d3.scaleLinear().domain([0, maxY]).range([height, 0]);
	    //yScale.domain([d3.min(lineData,d=>d[1]),d3.max(lineData, d=>[1] )]);


	        var arr = d3.extent(lineData, d => d[1]);
	        if(arr.length == 2) {
		    arr[0] = arr[0]-1;
		    arr[1] = arr[1]+1;
		}
	    
		yScale.domain(arr);


		svg.append("svg:rect")
			.attr("rx", 3)
			.attr("ry", 3)
			.attr("x", 1)
			.attr("y", 1)
			//.attr("width", '100%')
			.attr("width", width - 2)
			.attr("height", height - 2)
			//.style("fill", "#FFFFFF");
			.style("fill", "#000000");


		var area = d3.area()
			.x(function (d) { return xScale(d[0]); })
			.y0(height)
			.y1(function (d) { return yScale(d[1]); });

		var line = d3.line()
			.x(function (d) { return xScale(d[0]); })
			.y(function (d) {
				return yScale(d[1]);
			})
		//.curve(d3.curveMonotoneX)	   


		svg.append("path")
			.datum(lineData)
			.attr("class", "line")
			.attr("transform", "translate(" + 0 + "," + 0 + ")")
			.attr("fill", "none")
			.attr("d", line)
			.style("stroke", accentColor)
			.style("stroke-width", "2");

		svg.append("linearGradient")
			.attr("id", me.block.idx + "-area-gradient")
			//.attr("gradientUnits", "userSpaceOnUse")
			.attr("x1", 0).attr("y1", 0)
			.attr("x2", 0).attr("y2", 1)
			.selectAll("stop")
			.data([
				{ offset: "60%", color: areaColor },
				{ offset: "100%", color: "black" }
			])
			.enter().append("stop")
			.attr("offset", function (d) { return d.offset; })
			.attr("stop-color", function (d) { return d.color; });


		svg.append("path")
			.datum(lineData)
			//	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "area")
			.style('fill', "url(#" + me.block.idx + "-area-gradient)")
			//.style('fill', areaColor)
			//.attr("stroke", accentColor)
			//.attr("stroke-width", 2)
			.attr("d", area)


		//Title of the graph
		var fontsize = 10;
		svg.append('text')
			.attr('x', margin.left + 3)
			.attr('y', margin.top + fontsize + 3)
			.attr('text-anchor', 'left')
			.style('font-family', 'Helvetica')
			.style('font-size', fontsize)
			.attr("fill", textColor)
			.text(me.block.title);


		var middleX = width / 2;
		var middleY = height / 2;
		//var value = Domoticz.getAllDevices(me.block.idx).Temp;

		var value = me.graphDevice.currentValue;

		var value_text = '';

		switch (me.graphDevice.SubType) {
			case "Energy":
				value_text = me.graphDevice.Usage;
				break;
			default:
				if (me.block.units) {
					value_text = value + ' ' + me.block.units;
				} else {
					value_text = value;
				}
		}

		//Current value of the sensor
		svg.append('text')
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "central")
			.attr('x', middleX)
			.attr('y', middleY)
			.style('font-family', 'Helvetica')
			.style('font-size', 20)
			.attr("fill", textColor)
			.text(value_text);
	}


    /** This function will update the graph.
     * All graph data must be available.
     */
    function d3FormatData(me) {
        
	var lineData = [];
	var max = me.block.width;
        
	if (typeof me.data.result === "object" && me.data.result.length > 0) {
	    var arr = me.data.result;
	    var i = 1; //me.keys.indexOf(me.block.chartValue);
            
	    var val = 0;
	    var x = 0;
            
	    for (var i = arr.length - max; i < arr.length; i++) {
		var value = parseInt(arr[i][me.block.chartValue]);
                
		if (typeof value !== "number") {
		    console.log("Error converting " + arr[i][val] + " to int");
		    return;
		}
		lineData.push([x, value]);
		x = x + 1;
	    }
	}
	else {
	    console.log("Error no data!");
	    return;
	}
	me.block.lineData = lineData;
    }


	function d3GetDeviceGraphData(me, device) {
		var res;
		switch (true) {
			case !!device.SwitchType:
				res = d3GetSwitchGraphData(me);
				break;
			default:
				res = d3GetRegularGraphData(me);
		}

		return res.then(function (data) {
			data.device = device;
			data.idx = device.idx;
			data.txtUnit = device.txtUnit;
			me.data = data;
		});
	}

	function d3GetAllGraphData(me) {

		return $.when(d3GetDeviceGraphData(me, me.graphDevice));

		return $.when.apply(
			$,
			d3GetDeviceGraphData(me, me.graphDevice)
		);
	}


	/** Pulls all graph data from Domoticz and refreshes the graph
	 *
	 */
	function d3RefreshGraph(me) {
		d3GetDeviceDefaults(me, me.graphDevice);

		d3GetAllGraphData(me).then(function () {
			d3FormatData(me);
			d3CreateGraph(me);
		});
	}

	/** This function handles a device update
	 *
	 * */
	function d3DeviceUpdate(me, graphDevice, device) {
		$.extend(graphDevice, device);
		d3GetDeviceDefaults(me, graphDevice); //In fact we only need a update of currentValue, but this is the most easy
		DT_d3.refresh(me);
	}

	return {
		name: 'd3',
		init: function () {
			DT_function.loadCSS('./js/components/d3.css');
			return DT_function.loadScript('//d3js.org/d3.v7.min.js');
		},
		defaultCfg: function (block) {
			return {
				refresh: 3600, //update once per hour
			};
		},
		run: function (me) {
			try {
				d3Initialize(me);
				//subscribe to sensor data
				var graphDevice = me.graphDevice;
				Dashticz.subscribeDevice(me, graphDevice.idx, true, function (device) {
					d3DeviceUpdate(me, graphDevice, device);
				});

			} catch (err) {
				console.warn(err);
				me.block.refresh = 0; //prevent refresh of graph in case of error during initialization
			}

		},
		refresh: function (me) {
			d3RefreshGraph(me);
		},
	};
})();

Dashticz.register(DT_d3);
