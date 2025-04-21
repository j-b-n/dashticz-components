/* global Dashticz DT_function*/

var DT_clockcard = {
    buildClockHTML: function(me) {
        return '<div data-id="clock" class="block_' +
            me.block.type +
            (me.block.location==='right'?'_right':'_left')+
            ' col-xs-' +
            me.block.width +            
            '">'+
            '<div class="clock-container"><div class="clock"></div></div>'+
            '<div class="date-container">'+
            '<div class="weekday"></div>'+
            '<div class="clockcard_day"></div>'+
            '<div class="clockcard_month"></div>'+
            '<em class="wi wi-sunrise"></em><span class="sunrise"></span><em class="wi wi-sunset"></em><span class="sunset"></span>' +
            '</div>'+            
            '</div>';        
    },
    name: "clockcard",
    init: function () {
        return DT_function.loadCSS('./js/components/clockcard.css');
    },
    canHandle: function (block) {
        return block && block.type && block.type === 'clockcard';
    },    
    defaultCfg: { //All optional. defaultCfg can also be a function and then will receive block as parameter.
        scale: 1,
        width: 12,
        title: '',

    },    
    run: function (me) {
                
        var width = me.block.size || $(me.mountPoint + ' .dt_block').width();
        $(me.mountPoint + ' .dt_block').css('font-size', width / 6 * me.block.scale);

        $(me.mountPoint ).html(this.buildClockHTML(me));

        const dateClock = setInterval(function dateTime() {
            var currentTime = Date.now();
            var today = new Date();
            let date = today.getDate();
            
            $('.clockcard_day').html(date);
            $('.clockcard_month').html(
                moment().locale(settings['language']).format('MMMM')
            );
            
        }, 1000);

        
    },    
}

Dashticz.register(DT_clockcard); //Don't forget to register the block
//# sourceURL=js/components/clockcard.js

