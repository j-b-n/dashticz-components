/* Gauge - from https://canvas-gauges.com/ */

var DT_gauge = (function () {
    var gauge;

    function buildHTML(me)
    {
        html = '<canvas id="'+'gauge-'+me.block.idx+'"></canvas>';
        return html;

        html = '<b>Value: '+this.value+'</b>';
        //return html;

        html = '<script src="//cdn.rawgit.com/Mikhus/canvas-gauges/gh-pages/download/2.1.7/all/gauge.min.js"></script>'+
	    '<canvas data-type="linear-gauge"'+
	    'width="150" height="400"'+
            'data-width="150"'+
            'data-height="400"'+
            'data-border-radius="20"'+
            'data-borders="0"'+
            'data-bar-stroke-width="20"'+
            'data-minor-ticks="10"'+
            'data-major-ticks="0,10,20,30,40,50,60,70,80,90,100"'+
            'data-value="'+this.value+'"'+
            'data-units="C"'+
            'data-color-value-box-shadow="false"'+
	    '></canvas>';
        return html;
    }

    function temperature_gauge(me)
    {
        gauge = new RadialGauge({
	renderTo: 'gauge1XX',
	    width: 200,
	    height: 200,
	    units: "°C",
	    title: "Temperature",
	    minValue: -50,
	    maxValue: 50,
	    majorTicks: [
	        -50,
	        -40,
	        -30,
	        -20,
	        -10,
	        0,
	        10,
	        20,
	        30,
	        40,
	        50
	    ],
	    minorTicks: 2,
	    strokeTicks: true,
	    highlights: [
	        {
		    "from": -50,
		    "to": 0,
		    "color": "rgba(0,0, 255, .3)"
	        },
	        {
		    "from": 0,
		    "to": 50,
		    "color": "rgba(255, 0, 0, .3)"
	        }
	    ],
	    ticksAngle: 225,
	    startAngle: 67.5,
	    colorMajorTicks: "#ddd",
	    colorMinorTicks: "#ddd",
	    colorTitle: "#eee",
	    colorUnits: "#ccc",
	    colorNumbers: "#eee",
	    colorPlate: "#222",
	    borderShadowWidth: 0,
	    borders: true,
	    needleType: "arrow",
	    needleWidth: 2,
	    needleCircleSize: 7,
	    needleCircleOuter: true,
	    needleCircleInner: false,
	    animationDuration: 1000,
	    animationRule: "linear",
	    colorBorderOuter: "#333",
	    colorBorderOuterEnd: "#111",
	    colorBorderMiddle: "#222",
	    colorBorderMiddleEnd: "#111",
	    colorBorderInner: "#111",
	    colorBorderInnerEnd: "#333",
	    colorNeedleShadowDown: "#333",
	    colorNeedleCircleOuter: "#333",
	    colorNeedleCircleOuterEnd: "#111",
	    colorNeedleCircleInner: "#111",
	    colorNeedleCircleInnerEnd: "#222",
	    valueBoxBorderRadius: 0,
	    colorValueBoxRect: "#222",
	    colorValueBoxRectEnd: "#333"
        });
    }

    return {
        name: "gauge",
        init: function () {
			DT_function.loadCSS('./js/components/gauge.css');
			return DT_function.loadScript('//cdn.rawgit.com/Mikhus/canvas-gauges/gh-pages/download/2.1.7/all/gauge.min.js');
			return DT_function.loadCSS('./js/components/gauge.css');
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

	    me.layout = parseInt(0+me.block.layout);
	    var height = isDefined(me.block.height)
                ? parseInt(me.block.height)
                : parseInt($(me.mountPoint + ' div').outerWidth());

	    me.block.height = parseInt(height);

	    var temp = Domoticz.getAllDevices(me.block.idx).Temp;
	    console.log("Gauge temp:"+temp);

	    console.log("Gauge layout:"+me.layout);
	    console.log("Gauge height:"+height);

	    $(me.mountPoint + ' .dt_content').html(buildHTML(me));

	    if(me.block.subtype === 'temperature1') {
	        gauge = new LinearGauge({
		    renderTo: 'gauge-'+me.block.idx,
		    value: temp,
		    width: 100,
	        }).draw();
	    }

	    if(me.block.subtype === 'temperature') {
	        gauge = new LinearGauge({
		    renderTo: 'gauge-'+me.block.idx,
		    width: me.block.wid,
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
	        console.log("---> type1");
	        gauge = new RadialGauge({
		    renderTo: 'gauge-'+me.block.idx,
		    value: temp,
		    width: me.block.wid,
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
		    animationDuration: 1500,
		    animationRule: "linear"
	        });
	    }


        // gauge.value = temp;
	    // gauge.draw();
	    // $(me.mountPoint + ' .dt_content').html(gauge.options.renderTo);

	    // console.log(gauge.options.renderTo);

	    //$(me.mountPoint + ' .dt_content').html(buildHTML(me));

	    //subscribe to sensor data
	    Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
	        this.value = device.Data;
                gauge.value = device.Data;
                //console.log("Subscribed: "+device);
            });



        },
        refresh: function (me) {
	    // if me.block.refresh is defined, and this function exists, then this function will be called every <me.block.refresh> seconds.

	    //gauge.value = this.value;
            //console.log("Refresh: "+gauge.value);

            //	document.body.appendChild(gauge.options.renderTo);
            //	$(me.mountPoint + ' .dt_content').html(buildHTML(me));

        }
    }
})();

Dashticz.register(DT_gauge); //Don't forget to register the block
