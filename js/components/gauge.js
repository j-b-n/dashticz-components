/* Gauge - from https://canvas-gauges.com/ */

var DT_gauge = (function () {

    function buildHTML(me)
    {
        var html = '<canvas id="gauge-' + me.block.idx + '"></canvas>';
        return html;
    }

    return {
        name: "gauge",
        canHandle: function (block) {
            return block && block.type && block.type === 'gauge'
        },
        init: function () {
			DT_function.loadCSS('./js/components/gauge.css');
			return DT_function.loadScript('//cdn.rawgit.com/Mikhus/canvas-gauges/gh-pages/download/2.1.7/all/gauge.min.js');
        },
        defaultCfg: { //All optional. defaultCfg can also be a function and then will receive block as parameter.
			title: '',
            //	icon: 'fas fa-robot', // string to define the default icon
			refresh: 5,
			show_lastupdate: true,
			idx: 1,
			width: 3,
        },
        run: function (me) {
	    //this function will be called after the component has been initialized and has been mounted into the DOM.
	    //me.mountPoint: Mountpoint of the container (dt_block)
	    //For basic usage you will add additional code to $(me.mountPoint + ' .dt_state')
	    //me.block: Reference to the block definition in CONFIG.js

	    // Validate device exists
	    const device = Domoticz.getAllDevices(me.block.idx);
	    if (!device) {
	        $(me.mountPoint).html('<div class="error">Device not found (idx: ' + me.block.idx + ')</div>');
	        return;
	    }

	    me.layout = parseInt(0+me.block.layout);
	    var height = isDefined(me.block.height)
                ? parseInt(me.block.height)
                : parseInt($(me.mountPoint + ' div').outerWidth());

	    me.block.height = parseInt(height);

	    var temp = device.Temp || 0;
	    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	    $(me.mountPoint + ' .dt_content').html(buildHTML(me));

	    if(me.block.subtype === 'temperature1') {
	        me.gauge = new LinearGauge({
		    renderTo: 'gauge-'+me.block.idx,
		    value: temp,
		    width: 100,
	        }).draw();
	    }

	    if(me.block.subtype === 'temperature') {
	        me.gauge = new LinearGauge({
		    renderTo: 'gauge-'+me.block.idx,
		    width: me.block.width,
		    height: me.block.height,
		    units: me.block.units,
		    title: me.block.title,
		    minValue: -40,
		    maxValue: 40,
		    majorTicks: [
		        -40,
		        -30,
		        -20,
		        -10,
		        0,
		        10,
		        20,
		        30,
		        40,
		    ],
		    minorTicks: 5,
		    strokeTicks: true,
		    ticksWidth: 15,
		    ticksWidthMinor: 7.5,
		    highlights: [
		        {
			    "from": -40,
			    "to": 0,
			    "color": "rgba(0,0, 255, .3)"
		        },
		        {
			    "from": 0,
			    "to": 40,
			    "color": "rgba(255, 0, 0, .3)"
		        }
		    ],
		    colorMajorTicks: "#ffe66a",
		    colorMinorTicks: "#ffe66a",
		    colorTitle: "#eee",
		    colorUnits: "#ccc",
		    colorNumbers: "#eee",
		    colorPlate: "#2465c0",
		    colorPlateEnd: "#327ac0",
		    borderShadowWidth: 0,
		    borders: false,
		    borderRadius: 10,
		    needleType: "arrow",
		    needleWidth: 3,
		    animation: false,
		    animationDuration: 1500,
		    animationRule: "linear",
		    colorNeedle: "#222",
		    colorNeedleEnd: "",
		    colorBarProgress: "#327ac0",
		    colorBar: "#f5f5f5",
		    barStroke: 0,
		    barWidth: 8,
		    barBeginCircle: false,
		    value: temp
	        }).draw();
	    }

	    if(me.block.subtype === 'type1') {
	        me.gauge = new RadialGauge({
		    renderTo: 'gauge-'+me.block.idx,
		    value: temp,
		    width: me.block.width,
		    height: me.block.height,
		    units: me.block.units,
		    minValue: 0,
		    maxValue: 2200,
		    majorTicks: [
		        "0",
		        "200",
		        "400",
		        "600",
		        "800",
		        "1000",
		        "1200",
		        "1400",
		        "1600",
		        "1800",
		        "2000",
		        "2200"
		    ],
		    minorTicks: 2,
		    strokeTicks: true,
		    highlights: [
		        {
			    "from": 1600,
			    "to": 2200,
			    "color": "rgba(200, 50, 50, .75)"
		        }
		    ],
		    colorPlate: "#fff",
		    borderShadowWidth: 0,
		    borders: false,
		    needleType: "arrow",
		    needleWidth: 2,
		    needleCircleSize: 7,
		    needleCircleOuter: true,
		    needleCircleInner: false,
		    animationDuration: prefersReducedMotion ? 0 : 1500,
		    animationRule: "linear"
	        });
	    }

	    //subscribe to sensor data
	    Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
	        if (me.gauge) me.gauge.value = device.Data;
            });

        },
        refresh: function (me) {
        }
    }
})();

Dashticz.register(DT_gauge); //Don't forget to register the block
