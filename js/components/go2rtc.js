/* global Dashticz DT_function*/

var DT_go2rtc = (function () {
    return {
        buildIframeHTML: function (me) {
            const title = me.block.title
            const go2rtcUrl = me.block.go2rtcUrl
            const streamName = me.block.streamName || ''
            const iframeId = 'go2rtc-iframe-' + me.block.idx
            const autoplay = me.block.autoplay !== false // Default to true

            if (!streamName) {
                return (
                    '<div data-id="go2rtc" class="block_go2rtc col-xs-' +
                    me.block.width +
                    ' camera dt_block">' +
                    (title
                        ? '<div class="go2rtc-title">' + title + '</div>'
                        : '') +
                    '<div class="go2rtc-error">Stream name not configured</div>' +
                    '</div>'
                )
            }

            let streamUrl =
                go2rtcUrl + '/stream.html?src=' + encodeURIComponent(streamName)

            // Add autoplay parameter to stream URL if enabled
            if (autoplay) {
                streamUrl += '&autoplay=1'
            }

            return (
                '<div data-id="go2rtc" class="col-xs-' +
                me.block.width +
                ' block_go2rtc dt_block">' +
                (title ? '<div class="go2rtc-title">' + title + '</div>' : '') +
                '<div class="go2rtc-wrapper">' +
                '<iframe id="' +
                iframeId +
                '" class="go2rtc-iframe" src="' +
                streamUrl +
                '" frameborder="0" scrolling="no" allow="microphone; camera" allowfullscreen></iframe>' +
                '</div>' +
                '</div>'
            )
        },

        buildWebRTCHTML: function (me) {
            const title = me.block.title
            const streamName = me.block.streamName || ''
            const idx = me.block.idx || me.block.streamName || 'default'
            const videoId = 'go2rtc-video-' + idx

            if (!streamName) {
                return (
                    '<div data-id="go2rtc" class="block_go2rtc col-xs-' +
                    me.block.width +
                    ' camera dt_block">' +
                    (title
                        ? '<div class="go2rtc-title">' + title + '</div>'
                        : '') +
                    '<div class="go2rtc-error">Stream name not configured</div>' +
                    '</div>'
                )
            }

            return (
                '<div data-id="go2rtc" class="col-xs-' +
                me.block.width +
                ' block_go2rtc dt_block">' +
                (title ? '<div class="go2rtc-title">' + title + '</div>' : '') +
                '<div class="go2rtc-wrapper">' +
                '<video id="' +
                videoId +
                '" class="go2rtc-video" muted playsinline></video>' +
                '</div>' +
                '</div>'
            )
        },

        connectWebRTC: function (me) {
            return new Promise((resolve, reject) => {
                const go2rtcUrl = me.block.go2rtcUrl
                const streamName = me.block.streamName || ''
                const idx = me.block.idx || me.block.streamName || 'default'
                const videoId = 'go2rtc-video-' + idx
                const autoplay = me.block.autoplay !== false // Default to true

                //console.log("[go2rtc] Connecting WebRTC for stream: " + streamName);
                //console.log("[go2rtc] Server URL: " + go2rtcUrl);

                if (!streamName) {
                    const error = 'Stream name not configured'
                    console.error('[go2rtc] ' + error)
                    reject(new Error(error))
                    return
                }

                try {
                    const videoElement = document.getElementById(videoId)
                    if (!videoElement) {
                        const error = 'Video element not found: ' + videoId
                        console.error('[go2rtc] ' + error)
                        reject(new Error(error))
                        return
                    }

                    // Create RTCPeerConnection
                    const pc = new RTCPeerConnection({
                        iceServers: [
                            { urls: ['stun:stun.l.google.com:19302'] },
                            { urls: ['stun:stun1.l.google.com:19302'] },
                        ],
                    })

                    // Handle remote stream
                    pc.ontrack = (event) => {
                        videoElement.srcObject = event.streams[0]
                        if (autoplay) {
                            videoElement.play().catch(() => {
                                // Autoplay failed, likely due to browser policy
                            })
                        }
                    }

                    // Handle ICE candidates
                    pc.onicecandidate = (event) => {
                        // ICE candidate handling
                    }

                    // Handle connection state changes
                    pc.onconnectionstatechange = () => {
                        if (
                            pc.connectionState === 'failed' ||
                            pc.connectionState === 'disconnected'
                        ) {
                            console.error(
                                '[go2rtc] Connection state: ' +
                                    pc.connectionState,
                            )
                            reject(
                                new Error(
                                    'WebRTC connection failed: ' +
                                        pc.connectionState,
                                ),
                            )
                        }
                    }

                    // Monitor signaling state
                    pc.onsignalingstatechange = () => {
                        // Signaling state changed
                    }

                    // Add visibility change listener to pause/resume video
                    const handleVisibilityChange = () => {
                        if (document.hidden) {
                            videoElement.pause()
                        } else if (videoElement.srcObject && autoplay) {
                            videoElement.play().catch(() => {
                                // Play failed
                            })
                        }
                    }
                    document.addEventListener(
                        'visibilitychange',
                        handleVisibilityChange,
                    )

                    // Add standby mode listener (Dashticz adds/removes 'standby' class on body)
                    const handleStandbyChange = () => {
                        const isStandby =
                            document.body.classList.contains('standby')
                        if (isStandby) {
                            videoElement.pause()
                        } else if (videoElement.srcObject && autoplay) {
                            videoElement.play().catch(() => {
                                // Play failed
                            })
                        }
                    }

                    // Use MutationObserver to watch for class changes on body
                    const standbyObserver = new MutationObserver(() => {
                        handleStandbyChange()
                    })
                    standbyObserver.observe(document.body, {
                        attributes: true,
                        attributeFilter: ['class'],
                    })

                    // Store handlers for cleanup
                    me.go2rtcData = {
                        pc: pc,
                        visibilityHandler: handleVisibilityChange,
                        standbyObserver: standbyObserver,
                    }

                    // Add video transceiver (CRITICAL: needed for valid SDP offer)
                    try {
                        pc.addTransceiver('video', { direction: 'recvonly' })
                    } catch (e) {
                        console.warn(
                            '[go2rtc] Failed to add video transceiver: ' +
                                e.message,
                        )
                    }

                    // Create offer and send via WHEP
                    ;(async () => {
                        try {
                            const offer = await pc.createOffer()
                            await pc.setLocalDescription(offer)

                            // Try different WHEP endpoint paths
                            const whepPaths = [
                                'api/webrtc?src=' +
                                    encodeURIComponent(streamName),
                                'webrtc?src=' + encodeURIComponent(streamName),
                                'publish?src=' + encodeURIComponent(streamName),
                            ]

                            let response = null
                            let workingPath = null

                            for (const path of whepPaths) {
                                // Ensure no double slashes in URL
                                const baseUrl = go2rtcUrl.endsWith('/')
                                    ? go2rtcUrl.slice(0, -1)
                                    : go2rtcUrl
                                const whepUrl = baseUrl + '/' + path

                                try {
                                    response = await fetch(whepUrl, {
                                        method: 'POST',
                                        body: pc.localDescription.sdp,
                                        headers: {
                                            'Content-Type': 'text/plain',
                                        },
                                    })

                                    if (response.ok) {
                                        workingPath = path
                                        //console.log("[go2rtc] WebRTC connection established for stream: " + streamName);
                                        break
                                    }
                                } catch (e) {
                                    // Fetch error, try next endpoint
                                }
                            }

                            if (!response || !response.ok) {
                                throw new Error(
                                    'WHEP request failed with status: ' +
                                        (response
                                            ? response.status
                                            : 'unknown'),
                                )
                            }

                            const answerSdp = await response.text()
                            await pc.setRemoteDescription(
                                new RTCSessionDescription({
                                    type: 'answer',
                                    sdp: answerSdp,
                                }),
                            )
                            resolve()
                        } catch (error) {
                            console.error(
                                '[go2rtc] WHEP error: ' + error.message,
                            )
                            reject(error)
                        }
                    })()
                } catch (error) {
                    console.error(
                        '[go2rtc] Unexpected error during WebRTC setup: ' +
                            error.message,
                    )
                    reject(error)
                }
            })
        },

        name: 'go2rtc',
        init: function () {
            return DT_function.loadCSS('./js/components/go2rtc.css')
        },
        canHandle: function (block) {
            return block && block.type && block.type === 'go2rtc'
        },
        defaultCfg: {
            width: 12,
            height: 300,
            title: '',
            go2rtcUrl: '',
            streamName: '',
            go2rtcType: 'iframe', // or "webrtc" (requires video transceiver support)
            aspectRatio: '16 / 9', // Customize for different camera aspect ratios (e.g., "4 / 3")
            autoplay: true, // Set to false to prevent autoplay (allows device sleep mode)
        },
        run: function (me) {
            const go2rtcType = me.block.go2rtcType || 'iframe'

            // Clean up old event listeners if they exist
            if (me.go2rtcData) {
                if (me.go2rtcData.visibilityHandler) {
                    document.removeEventListener(
                        'visibilitychange',
                        me.go2rtcData.visibilityHandler,
                    )
                }
                if (me.go2rtcData.standbyObserver) {
                    me.go2rtcData.standbyObserver.disconnect()
                }
                if (me.go2rtcData.iframeStandbyObserver) {
                    me.go2rtcData.iframeStandbyObserver.disconnect()
                }
            }

            // Select builder based on type
            const html =
                go2rtcType === 'webrtc'
                    ? this.buildWebRTCHTML(me)
                    : this.buildIframeHTML(me)

            $(me.mountPoint).html(html)

            const height = me.block.height || 400
            const titleElement = $(me.mountPoint + ' .go2rtc-title')
            const titleHeight =
                titleElement.length > 0 ? titleElement.outerHeight(true) : 0
            const wrapperHeight = height - titleHeight

            const wrapper = $(me.mountPoint + ' .go2rtc-wrapper')
            wrapper.css('height', wrapperHeight + 'px')

            // Apply aspect ratio if configured
            const aspectRatio = me.block.aspectRatio || '16 / 9'
            wrapper.css('aspect-ratio', aspectRatio)

            // Handle standby mode for iframes (pause stream to allow device sleep)
            if (go2rtcType === 'iframe') {
                const iframeId = 'go2rtc-iframe-' + me.block.idx
                const handleIframeStandby = () => {
                    const iframe = document.getElementById(iframeId)
                    if (!iframe) return

                    const isStandby =
                        document.body.classList.contains('standby')
                    if (isStandby) {
                        // Store original src and clear it to pause the stream
                        if (!me.go2rtcData.iframeSrcBackup) {
                            me.go2rtcData.iframeSrcBackup = iframe.src
                        }
                        iframe.src = ''
                    } else if (me.go2rtcData && me.go2rtcData.iframeSrcBackup) {
                        // Restore the original src
                        iframe.src = me.go2rtcData.iframeSrcBackup
                    }
                }

                // Monitor standby class changes for iframe
                const iframeStandbyObserver = new MutationObserver(() => {
                    handleIframeStandby()
                })
                iframeStandbyObserver.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['class'],
                })

                if (!me.go2rtcData) {
                    me.go2rtcData = {}
                }
                me.go2rtcData.iframeStandbyObserver = iframeStandbyObserver
            }

            // Connect WebRTC if mode is webrtc
            if (go2rtcType === 'webrtc') {
                this.connectWebRTC(me).catch((error) => {
                    console.error(
                        "[go2rtc] WebRTC connection failed for stream '" +
                            me.block.streamName +
                            "':",
                        error.message,
                    )
                    console.error('[go2rtc] URL: ' + me.block.go2rtcUrl)
                    console.error('[go2rtc] Falling back to iframe mode')
                    me.block.go2rtcType = 'iframe'
                    this.run(me) // Re-render as iframe
                })
            }
        },
    }
})()

Dashticz.register(DT_go2rtc)
//# sourceURL=js/components/go2rtc.js
