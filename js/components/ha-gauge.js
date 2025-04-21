var DT_ha_gauge = (function () {
    var gauge;

	function getColor(value, min, max)
	{	
		var color = "white";
		if (value < min) {
			color = "green";
		} else if (value > max) {
			color = "red";
		} else {
			color = "yellow";
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

		//console.log(device);

		if(device.SubType == "Energy") {
			value = parseFloat(device.Usage).toFixed(0);
			percent = value / me.block.max * 100;
			//console.log("Percent: "+percent);
			angle = 180 * (percent / 100);
			//console.log("Angle: "+angle);
			if (angle > 180) {
				angle = 180;
			}
			if (angle < 0) {
				angle = 0;
			}

			//color = getColor(value, 1000, 2000);
		}
	
		if(device.SubType == "Electric") {
			value = parseFloat(device.Data).toFixed(0);
			percent = value / me.block.max * 100;
			//console.log("Percent: "+percent);
			angle = 180 * (percent / 100);
			//console.log("Angle: "+angle);
			if (angle > 180) {
				angle = 180;
			}
			if (angle < 0) {
				angle = 0;
			}

			//color = getColor(value, 1000, 2000);
		}

		html = '<svg viewBox="-50 -50 100 50" class="gauge">';

		if(me.block.GradientColors) {
			html += '<defs>';
			html += getLinerGradient(value, me.block.GradientColors);
			html += '</defs>';
			color = "url(#gradient)";
		} else {
			color = "white";
		}

		html += '<path d="M -40 0 A 40 40 0 0 1 40 0" style="fill:none;stroke:'+color+';stroke-width:10" />'

		var cos = 0 - 40 * Math.cos((angle * Math.PI) / 180);
		var sin = 0 - 40 * Math.sin((angle * Math.PI) / 180);
		html += '<path class="level" d="M '+cos+' '+sin+' A 40 40 0 0 1 40 0" style="fill:none;stroke:gray;stroke-width:10" />';


		//Needle

		if(me.block.needle) {
			color = me.block.needleColor;
			html += '<path class="needle" d="M -25 -2.5 L -47.5 0 L -25 2.5 z" transform="rotate('+angle+')" style="fill:'+color+';stroke:none" />';
		}

		/*
		var cos = 0 - 40 * Math.cos((180 * Math.PI) / 180);
		var sin = 0 - 40 * Math.sin((180 * Math.PI) / 180);
		html += '<path class="level" d="M '+cos+' '+sin+' A 40 40 0 0 1 40 0" style="fill:none;stroke:gray;stroke-width:10" />';
*/

		if (typeof me.block.segments !== 'undefined') {
			me.block.segments.forEach( (element) => {
				angle = element[0];
				cos = 0 - 40 * Math.cos((angle * Math.PI) / 180);
				sin = 0 - 40 * Math.sin((angle * Math.PI) / 180);
				html += '<path class="level" d="M '+cos+' '+sin+' A 40 40 0 0 1 40 0" style="fill:none;stroke:'+element[1]+';stroke-width:10" />';

			});
		};

		color  =  me.block.textColor ? me.block.textColor: "white";
		html += '<text class="value-text" x="0" y="-5" text-anchor="middle" dominant-baseline="middle" font-size="20px" fill="'+color+'">';
		html += value;
		html += '</text>';
		html += '</svg>';
        return html;

    }

    return {
        name: "ha-gauge",
        init: function () {
			return DT_function.loadCSS('./js/components/ha-gauge.css');
        },
        defaultCfg: { //All optional. defaultCfg can also be a function and then will receive block as parameter.
			title: '',
            //	icon: 'fas fa-robot', // string to define the default icon
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

			console.log(me.block);

			Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
				this.value = device.Data;

				//console.log(device);

				$(me.mountPoint + ' .dt_content').html(buildHTML(me, device));
			});
			

        },

    }
})();

Dashticz.register(DT_ha_gauge); //Don't forget to register the block
