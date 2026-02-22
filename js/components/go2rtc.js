/* global Dashticz DT_function*/

var DT_go2rtc = {
  buildIframeHTML: function (me) {
    const title = me.block.title;
    const go2rtcUrl = me.block.go2rtcUrl || "http://10.0.0.100:1984";
    const streamName = me.block.streamName || "";
    const iframeId = "go2rtc-iframe-" + me.block.idx;

    if (!streamName) {
      return (
        '<div data-id="go2rtc" class="block_go2rtc col-xs-' +
        me.block.width +
        ' camera dt_block">' +
        (title ? '<div class="go2rtc-title">' + title + "</div>" : "") +
        '<div class="go2rtc-error">Stream name not configured</div>' +
        "</div>"
      );
    }

    const streamUrl =
      go2rtcUrl +
      "/stream.html?src=" +
      encodeURIComponent(streamName);

    return (
      '<div data-id="go2rtc" class="col-xs-' +
      me.block.width +
      ' block_go2rtc dt_block">' +
      (title ? '<div class="go2rtc-title">' + title + "</div>" : "") +
      '<div class="go2rtc-wrapper">' +
      '<iframe id="' +
      iframeId +
      '" class="go2rtc-iframe" src="' +
      streamUrl +
      '" frameborder="0" scrolling="no" allow="autoplay; microphone; camera" allowfullscreen></iframe>' +
      "</div>" +
      "</div>"
    );
  },

  buildWebRTCHTML: function (me) {
    const title = me.block.title;
    const streamName = me.block.streamName || "";
    const idx = me.block.idx || me.block.streamName || "default";
    const videoId = "go2rtc-video-" + idx;

    if (!streamName) {
      return (
        '<div data-id="go2rtc" class="block_go2rtc col-xs-' +
        me.block.width +
        ' camera dt_block">' +
        (title ? '<div class="go2rtc-title">' + title + "</div>" : "") +
        '<div class="go2rtc-error">Stream name not configured</div>' +
        "</div>"
      );
    }

    return (
      '<div data-id="go2rtc" class="col-xs-' +
      me.block.width +
      ' block_go2rtc dt_block">' +
      (title ? '<div class="go2rtc-title">' + title + "</div>" : "") +
      '<div class="go2rtc-wrapper">' +
      '<video id="' +
      videoId +
      '" class="go2rtc-video" autoplay muted playsinline></video>' +
      "</div>" +
      "</div>"
    );
  },

  connectWebRTC: function (me) {
    return new Promise((resolve, reject) => {
      const go2rtcUrl = me.block.go2rtcUrl || "http://10.0.0.100:1984";
      const streamName = me.block.streamName || "";
      const idx = me.block.idx || me.block.streamName || "default";
      const videoId = "go2rtc-video-" + idx;

      if (!streamName) {
        reject(new Error("Stream name not configured"));
        return;
      }

      try {
        const videoElement = document.getElementById(videoId);
        if (!videoElement) {
          reject(new Error("Video element not found"));
          return;
        }

        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: ["stun:stun.l.google.com:19302"] },
            { urls: ["stun:stun1.l.google.com:19302"] },
          ],
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          videoElement.srcObject = event.streams[0];
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          // ICE candidate handling
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          if (
            pc.connectionState === "failed" ||
            pc.connectionState === "disconnected"
          ) {
            reject(
              new Error("WebRTC connection failed: " + pc.connectionState),
            );
          }
        };

        // Monitor signaling state
        pc.onsignalingstatechange = () => {
          // Signaling state changed
        };

        // Add video transceiver (CRITICAL: needed for valid SDP offer)
        try {
          pc.addTransceiver("video", { direction: "recvonly" });
        } catch (e) {
          // Could not add transceiver
        }

        // Create offer and send via WHEP
        (async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const whepUrl =
              go2rtcUrl + "/api/webrtc?src=" + encodeURIComponent(streamName);

            const response = await fetch(whepUrl, {
              method: "POST",
              body: pc.localDescription.sdp,
              headers: { "Content-Type": "text/plain" },
            });

            if (!response.ok) {
              throw new Error(
                "WHEP response error: " +
                  response.status +
                  " " +
                  response.statusText,
              );
            }

            const answerSdp = await response.text();
            await pc.setRemoteDescription(
              new RTCSessionDescription({
                type: "answer",
                sdp: answerSdp,
              }),
            );

            resolve();
          } catch (error) {
            reject(error);
          }
        })();
      } catch (error) {
        reject(error);
      }
    });
  },

  name: "go2rtc",
  init: function () {
    return DT_function.loadCSS("./js/components/go2rtc.css");
  },
  canHandle: function (block) {
    return block && block.type && block.type === "go2rtc";
  },
  defaultCfg: {
    width: 12,
    height: 300,
    title: "",
    go2rtcUrl: "",
    streamName: "",
    go2rtcType: "webrtc", // or "webrtc" (requires video transceiver support)
  },
  run: function (me) {
    const go2rtcType = me.block.go2rtcType || "iframe";

    // Select builder based on type
    const html =
      go2rtcType === "webrtc"
        ? this.buildWebRTCHTML(me)
        : this.buildIframeHTML(me);

    $(me.mountPoint).html(html);

    const height = me.block.height || 400;
    const titleElement = $(me.mountPoint + " .go2rtc-title");
    const titleHeight =
      titleElement.length > 0 ? titleElement.outerHeight(true) : 0;
    const wrapperHeight = height - titleHeight;
    $(me.mountPoint + " .go2rtc-wrapper").css("height", wrapperHeight + "px");

    // Connect WebRTC if mode is webrtc
    if (go2rtcType === "webrtc") {
      this.connectWebRTC(me).catch((error) => {
        me.block.go2rtcType = "iframe";
        this.run(me); // Re-render as iframe
      });
    }
  },
};

Dashticz.register(DT_go2rtc);
//# sourceURL=js/components/go2rtc.js
