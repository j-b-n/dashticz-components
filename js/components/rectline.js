var DT_rectline = (function ()  {
    return {
        name: "rectline",
        init: function () {
            DT_function.loadCSS('./js/components/rectline.css');
            return DT_function.loadScript('//d3js.org/d3.v7.min.js');
        },
        defaultCfg: { //All optional. defaultCfg can also be a function and then will receive block as parameter.
            title: '',
            //icon: 'fas fa-robot', // string to define the default icon
            refresh: 5,
            show_lastupdate: true,
            idx: 1,
            //        orientation: 'vertical',
            orientation: 'horizontal',
            type: 'temperature',
            width: 3,
        },
        run: function (me) {
            //this function will be called after the component has been initialized and has been mounted into the DOM.
            //me.mountPoint: Mountpoint of the container (dt_block)
            //For basic usage you will add additional code to $(me.mountPoint + ' .dt_state')
            //me.block: Reference to the block definition in CONFIG.js
            
            me.layout = parseInt(0 + me.block.layout);
            var height = isDefined(me.block.height)
                ? parseInt(me.block.height)
                : parseInt($(me.mountPoint + ' div').outerWidth());
            
            var width = parseInt(me.$mountPoint.find('div').innerWidth());
            
            me.block.height = parseInt(height);
            me.block.width = parseInt(width);
            
            //	var temp = Domoticz.getAllDevices(me.block.idx).Temp;
            
            $(me.mountPoint + ' .dt_content').html(buildHTML(me));
            
            var device = Domoticz.getAllDevices(me.block.idx);
            draw_rect(me, device.Temp);
            
            //subscribe to sensor data
            Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
                this.value = device.Temp;
                draw_rect(me, device.Temp);
            });
            
        },
    };
    
    //
    function draw_rect(me, value) {
        const accentColor = '#E03534';
        const areaColor = '#462225';
        const borderColor = '#23252A';
        
        // Selecting the element
        const element = document.getElementById('rectline-' + me.block.idx);
        if (element) element.innerHTML = "";
        
        if (document.getElementById('rectline-desc-' + me.block.idx))
            document.getElementById('rectline-desc-' + me.block.idx).innerHTML = "";
        
        // Setting dimensions
        
        const margin = { top: 10, right: 5, bottom: 0, left: 5 },
              width = me.block.width,
              height = me.block.height;
        
        var svg = d3.select(element)
            .append('svg')
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("viewbox", "0 0 " + width + " " + height)
            .attr("class", "rectline-graph-" + me.block.idx);
        
        var min = -20;
        var step = 1;
        var value_text = '';
        
        if (me.block.units) {
            value_text = value + ' ' + me.block.units;
        } else {
            value_text = value;
        }
        
        var textColor = "#FF3333";
        if (parseFloat(value) < 0) {
            textColor = "#0000FF";
        }
        
        var x = 0;
        var y = 30;
        var stepX = 5;
        var bar_width = 3;
        var bar_height = 30;
        
        if(me.block.orientation === "vertical")
        {
            console.log("Vertical!")
            bar_width = 30;
            bar_height = 3;
            x = (width / 2) - bar_width;
            y = 30;
        } else
        {
            bar_width = 3;
            bar_height = 30;
        }
        
        svg.append('text')
            .attr("text-anchor", "left")
            .attr("dominant-baseline", "central")
            .attr('x', x)
            .attr('y', 10)
            .style('font-family', 'Helvetica')
            .style('font-size', 10)
            .attr("fill", textColor)
            .text(value_text);
        
        const number_of_bars = Math.floor(width / (stepX));
        min = 0 - Math.floor(number_of_bars / 2);
        
        if ((min + number_of_bars) > (value - 5)) {
            min = Math.floor((value + 10) - number_of_bars);
        }
        
        for (let i = min; i < (min + number_of_bars); i += step) {
            
            let classstr = build_classstr(i, value, step);
            
            svg.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', bar_width)
                .attr('height', bar_height)
            //	    .on('mouseover', showTooltip)
            //    	    .on('mouseout', hideTooltip)
                .attr("class", classstr);
            
            if(me.block.orientation === "vertical")
                y = y + stepX;
            else
                x = x + stepX;
        }
    }
    
    function build_classstr(currentRect, value, step) {
        
        let colors = [
            [-1000,-15,"blue"],
            [-15,0,"lightblue"],
            [0,15,"yellow"],
        ];
        
        let classstr = "rect-" + currentRect;
        
        if (value >= currentRect && value < currentRect + step) {
            classstr += " rectlineon";
        }
        
        let found = false;
        let i = 0;
        
        while (i < colors.length && found===false) {
            if(currentRect >= colors[i][0] && currentRect <= colors[i][1])
            {
                classstr += " "+colors[i][2];
                found = true;
            }
            i++;
        }    
        
        return classstr;
    }
    
    
    
    function buildHTML(me){
        return '<div class="rectline">' +
            '<div id="rectline-' + me.block.idx + '" class="rectline"></div>' +
            '<div id="rectline-desc-' + me.block.idx + '" class="description"></div>' +
            '</div>';
    }
    //
    
})();

Dashticz.register(DT_rectline); //Don't forget to register the block



