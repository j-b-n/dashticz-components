var DT_bargraph = (function () {
    function buildHTML(me) {
        var width = me.block.width || $(me.mountPoint + ' .dt_block').width();
        return '<div id="bargraph-' + me.block.idx + '" class="block_' +
            me.block.type +
            ' col-xs-' +
            width +
            '">' +
            '<div id="bargraph-icon-'+me.block.idx+'" class="bargraph-icon '+me.block.iconName+'"></div>' +
            '<div id="bargraph-title-' + me.block.idx + '" class="bargraph-title"> </div>' +
            '<div id="bargraph-bar-'+me.block.idx+'" class="bargraph-bar"></div>' +
            '<div id="bargraph-value-'+me.block.idx+'" class="bargraph-value"></div>' +
            '</div>';
    }

    function drawCard(me) {
        var device = Domoticz.getAllDevices(me.block.idx);

        var element = document.getElementById('bargraph-title-' + me.block.idx);
        var newText = document.createTextNode(device.Name);
        element.appendChild(newText);        

        var element = document.getElementById('bargraph-bar-' + me.block.idx);
        for (let i = 1; i < (me.block.numSegments+1); i++) {
            const newDiv = document.createElement("div");            
            newDiv.setAttribute("class", "bar-segment-" + me.block.idx + " level-" + i);
            element.appendChild(newDiv);
        }        

        var element = document.getElementById('bargraph-value-' + me.block.idx);
        newText = document.createTextNode(device.Usage);
        element.appendChild(newText);        
    }

    function getColor(level) {
        const colors = [
            '#004d40', '#00796b', '#4caf50',
            '#cddc39', '#ffeb3b', '#ffc107',
            '#ff9800', '#f44336', '#d32f2f'
        ];
        return colors[level - 1];
    }

    return {
        name: "bargraph",
        init: function () {
            return DT_function.loadCSS('./js/components/bargraph.css');
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'bargraph';
        },
        defaultCfg: { 
            width: 6,
            numSegments: 9,
            maxPower: 5000,
            height: 300,
            type: 'bargraph',
            title: 'Bargraph',
            iconName: 'fas fa-bolt',

        },
        run: function (me) {

            var width = me.block.size || $(me.mountPoint + ' .dt_block').width();
            $(me.mountPoint + ' .dt_block').css('font-size', width / 6 * me.block.scale);

            $(me.mountPoint).html(buildHTML(me));
            drawCard(me);

            //subscribe to sensor data
            Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
                var valueDiv = document.getElementById('bargraph-value-' + me.block.idx);
                valueDiv.innerText = device.Usage;

                const activeSegments = Math.ceil((device.Data4 / me.block.maxPower) * me.block.numSegments);
                const segments = document.querySelectorAll('.bar-segment-' + me.block.idx);

                segments.forEach((segment, index) => {
                    if (index < activeSegments) {
                        segment.style.backgroundColor = getColor(index + 1);
                    } else {
                        segment.style.backgroundColor = 'lightgray';
                    }
                });

            });
        }
    }
})();

Dashticz.register(DT_bargraph);