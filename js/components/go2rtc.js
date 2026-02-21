/* global Dashticz DT_function*/

var DT_go2rtc = {
    buildVideoHTML: function(me) {
        const title = me.block.title;
        const go2rtcUrl = me.block.go2rtcUrl || 'http://10.0.0.100:1984';
        const streamName = me.block.streamName || '';
        const iframeId = 'go2rtc-iframe-' + me.block.idx;
        
        if (!streamName) {
            return '<div data-id="go2rtc" class="block_go2rtc col-xs-' +
                me.block.width +
                '">'+
                (title ? '<div class="go2rtc-title">' + title + '</div>' : '') +
                '<div class="go2rtc-error">Stream name not configured</div>'+
                '</div>';
        }
        
        const streamUrl = go2rtcUrl + '/webrtc.html?src=' + encodeURIComponent(streamName) + '&media=video';
        
        return '<div data-id="go2rtc" class="block_go2rtc col-xs-' +
            me.block.width +
            '">'+
            (title ? '<div class="go2rtc-title">' + title + '</div>' : '') +
            '<div class="go2rtc-wrapper">'+
            '<iframe id="' + iframeId + '" class="go2rtc-iframe" src="' + streamUrl + '" frameborder="0" scrolling="no" allow="autoplay; microphone; camera" allowfullscreen></iframe>'+
            '</div>'+
            '</div>';
    },
    
    name: "go2rtc",
    init: function () {
        return DT_function.loadCSS('./js/components/go2rtc.css');
    },
    canHandle: function (block) {
        return block && block.type && block.type === 'go2rtc';
    },    
    defaultCfg: {
        width: 8,
        height: 600,
        title: '',
        go2rtcUrl: 'http://10.0.0.100:1984',
        streamName: 'nest1',
    },
    run: function (me) {
        $(me.mountPoint).html(this.buildVideoHTML(me));
        
        const height = me.block.height || 400;
        const titleHeight = $(me.mountPoint + ' .go2rtc-title').outerHeight(true);
        const wrapperHeight = height - titleHeight - 10; // 10px for padding/margin
        $(me.mountPoint + ' .go2rtc-wrapper').css('height', wrapperHeight + 'px');
    },    
}

Dashticz.register(DT_go2rtc);
//# sourceURL=js/components/go2rtc.js
