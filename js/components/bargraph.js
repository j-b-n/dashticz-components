var DT_bargraph = (function () {
    function buildHTML(me) {
        var width = me.block.width || $(me.mountPoint + ' .dt_block').width();
        return '<div id="bargraph_' + me.block.idx + '" class="block_' +
            me.block.type +
            ' col-xs-' +
            width +
            '">' +
            '</div>';
    }

    function drawCard(me) {
        var card = document.getElementById('bargraph_' + me.block.idx);
        var device = Domoticz.getAllDevices(me.block.idx);
        console.log(device);

        const iconDiv = document.createElement("div");
        iconDiv.setAttribute("class", "fas fa-bolt bargraph-icon");
        card.appendChild(iconDiv);

        const titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "bargraph-title");
        titleDiv.appendChild(document.createTextNode(device.Name));
        card.appendChild(titleDiv);

        const barDiv = document.createElement("div");
        barDiv.setAttribute("class", "bargraph-bar");

        for (let i = 1; i < 10; i++) {
            const newDiv = document.createElement("div");
            //newDiv.setAttribute("width", card.clientWidth);
            newDiv.setAttribute("class", "bar-segment-" + me.block.idx + " level-" + i);
            barDiv.appendChild(newDiv);
        }

        card.appendChild(barDiv);

        const valueDiv = document.createElement("div");
        valueDiv.setAttribute("id", "bargraph-value-" + me.block.idx);
        valueDiv.setAttribute("class", "bargraph-value");
        const newText = document.createTextNode(device.Usage);
        valueDiv.appendChild(newText);

        card.appendChild(valueDiv);
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