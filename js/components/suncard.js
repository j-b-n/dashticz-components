/* global Dashticz DT_function*/

var DT_suncard = (function () {
    function buildSuncardHTML(me) {
        var width = me.block.width || $(me.mountPoint + ' .dt_block').width();

        return '<div id="suncard" class="block_' +
            me.block.type +
            ' col-xs-' +
            width +            
            '">' +
        '</div>';
        
    }

    function draw_card(me) {
        var suncard = document.getElementById('suncard');        
        
        var sun_svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        sun_svg.setAttribute("width", suncard.clientWidth);
        sun_svg.setAttribute("style","background-color: red");

        var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        newLine.setAttribute('id','line2');
        newLine.setAttribute('x1','0');
        newLine.setAttribute('y1','0');
        newLine.setAttribute('x2','20');
        newLine.setAttribute('y2','20');
        newLine.setAttribute("stroke", "black")
        sun_svg.append(newLine);

        suncard.appendChild(sun_svg);
    }
    
    return {
        name: "suncard",
        init: function () {        
            return DT_function.loadCSS('./js/components/suncard.css');
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'suncard';
        },    
        defaultCfg: { //All optional. defaultCfg can also be a function and then will receive block as parameter.
            width: 12,
            title: 'Suncard',
            
        },    
        run: function (me) {
            
            var width = me.block.size || $(me.mountPoint + ' .dt_block').width();
            $(me.mountPoint + ' .dt_block').css('font-size', width / 6 * me.block.scale);
            
            $(me.mountPoint ).html(buildSuncardHTML(me));
            
            draw_card(me);            
            
            const sunClock = setInterval(function dateTime() {
                //Update sunClock                                                               
            }, 5000);            
        }
    }
})();

Dashticz.register(DT_suncard);
//# sourceURL=js/components/suncard.js

