/*
    Inspired by https://github.com/home-assistant/frontend/blob/dev/src/components/ha-gauge.ts
*/

var DT_ha_gauge = (function () {

	function getColor(value, me)
	{	
		if (typeof me.block.SolidColor !== 'undefined') {
			return me.block.SolidColor
		}
	
		var color = "white";
		if (typeof me.block.SolidColors !== 'undefined') {
			var percent = value / me.block.max * 100;
			me.block.SolidColors.forEach( (element) => {			
			 	if(element[0] <= percent) {
					color = element[1];
			 	}
			});
		}
		return color;
	}

	function getLinerGradient(value, arrayColors)
	{
		html = '<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">';
		for (var i = 0; i < arrayColors.length; i++) {	
			var color = arrayColors[i][1];
			var percent = arrayColors[i][0];
			html += '<stop offset="'+percent+'%" style="stop-color:'+color+'" />';
		}
		html += '</linearGradient>';
		return html;
	}

    function buildHTML(me, device)
    {
		var color = "white";
		var value = "0";
		var percent = 0;
		var angle = 0;

		var decimals = 0;
		if (typeof me.block.decimals !== 'undefined') {
			decimals = parseInt(me.block.decimals);
		}

		//console.log(device);

		switch (device.SubType) {
			case "Custom":
			case "Electric":
				value = parseFloat(device.Data).toFixed(decimals);
				break;
			case "Temp + Humidity":
				value = parseFloat(device.Temp).toFixed(decimals);
				break;
			case "Energy":
				value = parseFloat(device.Usage).toFixed(decimals);
				break;
		}	

		percent = value / me.block.max * 100;
		angle = 180 * (percent / 100);
		angle = angle > 180 ? 180 : angle;
		angle = angle < 0 ? 0 : angle;

		html = '<svg viewBox="-50 -50 100 80" class="gauge" xmlns="http://www.w3.org/2000/svg">';
		//html = '<svg height="100%" width="100%" class="gauge" style="background-color:brown">';

		if(me.block.GradientColors) {
			html += '<defs>';
			html += getLinerGradient(value, me.block.GradientColors);
			html += '</defs>';
			color = "url(#gradient)";
		} else {
			color = getColor(value, me);
		}

		html += '<path d="M -40 0 A 40 40 0 0 1 40 0" style="fill:none;stroke:'+color+';stroke-width:10" />'

		var cos = 0 - 40 * Math.cos((angle * Math.PI) / 180);
		var sin = 0 - 40 * Math.sin((angle * Math.PI) / 180);
		html += '<path class="level" d="M '+cos+' '+sin+' A 40 40 0 0 1 40 0" style="fill:none;stroke:gray;stroke-width:10" />';

		/*
		var cos = 0 - 40 * Math.cos((180 * Math.PI) / 180);
		var sin = 0 - 40 * Math.sin((180 * Math.PI) / 180);
		html += '<path class="level" d="M '+cos+' '+sin+' A 40 40 0 0 1 40 0" style="fill:none;stroke:gray;stroke-width:10" />';
*/

		if (typeof me.block.segments !== 'undefined') {
			me.block.segments.forEach( (element) => {
				var segmentangle = 180 * (element[0] / 100);
				cos = 0 - 40 * Math.cos((segmentangle * Math.PI) / 180);
				sin = 0 - 40 * Math.sin((segmentangle * Math.PI) / 180);
				html += '<path class="level" d="M '+cos+' '+sin+' A 40 40 0 0 1 40 0" style="fill:none;stroke:'+element[1]+';stroke-width:10" />';

			});
		};

		//Needle

		if(me.block.needle) {
			color = me.block.needleColor;
			html += '<path class="needle" d="M -25 -2.5 L -47.5 0 L -25 2.5 z" transform="rotate('+angle+')" style="fill:'+color+';stroke:none" />';
		}

		color =  me.block.textColor ? me.block.textColor: "white";
		html += '<text class="value-text" x="0" y="-5" text-anchor="middle" dominant-baseline="middle" font-size="10px" fill="'+color+'">';
		html += value;
		if (typeof me.block.Unit !== 'undefined') {
			html += ' '+me.block.Unit;
		}
		html += '</text>';

		html += '<text class="label-text" x="0" y="10" text-anchor="middle" dominant-baseline="middle" font-size="7px" fill="'+color+'">';
		if (typeof me.block.title !== 'undefined') {
			html += me.block.title;
		} else {
			html += device.Name;
		}
		html += '</text>';

		html += '</svg>';
        return html;
    }

    return {
        name: "ha-gauge",
        init: function () {
			return DT_function.loadCSS('./js/components/ha-gauge.css');
        },
        defaultCfg: { 
			//title: '',
            //icon: 'fas fa-robot', 
			show_lastupdate: false,
			idx: 1,
			min: 0,
			max: 100,
			needle: false,
			width: 3,
        },
        run: function (me) {

			me.layout = parseInt(0+me.block.layout);
			var height = isDefined(me.block.height)
                ? parseInt(me.block.height)
                : parseInt($(me.mountPoint + ' div').outerWidth());

			me.block.height = parseInt(height);

			if(me.block.demo == true) {
				me.block.segments =  [["0", "green"], ["33", "yellow"],["67","red"]]
				me.block.needle = true;
				me.block.needleColor = "white";
				//me.block.GradientColors =  [["0", "green"], ["40", "yellow"],["60","yellow"], ["100", "red"]];
				/*
				me.block.SolidColors =  [["0", "#ffffff"], ["10", "#ffe6e6"],["20","#ff9999"], ["30","#ff6666"], 
										 ["40", "#ff3333"], ["50", "#ff0000"], ["60", "#cc0000"], ["70", "#990000"],
										 ["80", "#660000"], ["90", "#330000"], ["100", "#000000"]];
										 */
				//me.block.SolidColor = "green";
				device = {					
					"Data": me.block.demoValue,
					"Type": "Custom",
					"idx": 1
				};
				$(me.mountPoint + ' .dt_content').html(buildHTML(me, device));
			} 
			else 
			{
				Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
					this.value = device.Data;
					$(me.mountPoint + ' .dt_content').html(buildHTML(me, device));
				});
			}
        },
    }
})();

Dashticz.register(DT_ha_gauge);
