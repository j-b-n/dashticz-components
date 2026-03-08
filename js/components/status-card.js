/*
    Status card component for Dashticz. Displays one or more devices in a card format
    with custom title, icon, and background color. Supports multiple device values.
*/

var DT_status_card = (function () {
    function buildHTML(me) {
        var width = me.block.width || 3;
        var bgColor = me.block.backgroundColor || '#4a5568';
        
        return '<div id="status-card-' + me.block.idx + '" class="block_status_card col-xs-' +
            width +
            '" style="background-color: ' + bgColor + ';">' +
            '<div class="status-card-container">' +
            '<div id="status-card-icon-' + me.block.idx + '" class="status-card-icon ' + (me.block.iconName || '') + '"></div>' +
            '<div class="status-card-content">' +
            '<div id="status-card-title-' + me.block.idx + '" class="status-card-title">' + (me.block.title || 'Status') + '</div>' +
            '<div id="status-card-values-' + me.block.idx + '" class="status-card-values"></div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    function drawCard(me) {
        var valuesContainer = document.getElementById('status-card-values-' + me.block.idx);
        
        if (!valuesContainer) {
            return;
        }
        
        valuesContainer.innerHTML = '';
        
        // Handle both single device and multiple devices
        var devices = Array.isArray(me.block.devices) ? me.block.devices : [me.block.devices];
        
        devices.forEach(function(deviceId) {
            var device = Domoticz.getAllDevices(deviceId);
            
            if (device) {
                var valueDiv = document.createElement('div');
                valueDiv.className = 'status-card-value';
                
                var displayValue = device.Data || device.Usage || device.Level || 'N/A';
                var unit = me.block.unit || '';
                
                valueDiv.textContent = displayValue + ' ' + unit;
                valuesContainer.appendChild(valueDiv);
            }
        });
    }

    function onDeviceUpdate(me, device) {
        drawCard(me);
    }

    return {
        name: 'status-card',
        init: function () {
            return DT_function.loadCSS('./js/components/status-card.css');
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'status-card';
        },
        defaultCfg: {
            width: 3,
            devices: [],
            title: 'Status',
            iconName: 'fa fa-heart',
            backgroundColor: '#4a5568',
            unit: ''
        },
        run: function (me) {
            me.html = buildHTML(me);
            
            // Subscribe to device updates
            var devices = Array.isArray(me.block.devices) ? me.block.devices : [me.block.devices];
            devices.forEach(function(deviceId) {
                Dashticz.subscribeDevice(deviceId, onDeviceUpdate, me);
            });
            
            // Initial draw
            setTimeout(function() {
                drawCard(me);
            }, 100);
        }
    };
}());

Dashticz.register({
    key: 'status-card',
    components: [DT_status_card]
});
