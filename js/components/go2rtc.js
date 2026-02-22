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
      "/webrtc.html?src=" +
      encodeURIComponent(streamName) +
      "&media=video";

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

      console.group("🎥 go2rtc WebRTC Connection Debug");
      console.log("Stream:", streamName);
      console.log("URL:", go2rtcUrl);
      console.log("Block idx:", me.block.idx);
      console.log("Video Element ID:", videoId);

      if (!streamName) {
        console.error("❌ Stream name not configured");
        console.groupEnd();
        reject(new Error("Stream name not configured"));
        return;
      }

      try {
        const videoElement = document.getElementById(videoId);
        if (!videoElement) {
          console.error("❌ Video element not found with ID:", videoId);
          console.log(
            "Available elements with 'go2rtc-video':",
            document.querySelectorAll('[id*="go2rtc-video"]'),
          );
          console.groupEnd();
          reject(new Error("Video element not found"));
          return;
        }
        console.log("✓ Video element found");

        // Create RTCPeerConnection
        console.log("Creating RTCPeerConnection with STUN servers...");
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: ["stun:stun.l.google.com:19302"] },
            { urls: ["stun:stun1.l.google.com:19302"] },
          ],
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log(
            "✓ Track received:",
            event.track.kind,
            "-",
            event.track.id,
          );
          videoElement.srcObject = event.streams[0];
          console.log("✓ Stream attached to video element");
        };

        // Handle ICE candidates
        let iceCount = 0;
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            iceCount++;
            console.log(
              `ICE candidate #${iceCount}:`,
              event.candidate.candidate,
            );
          }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log("📊 Connection state:", pc.connectionState);
          if (
            pc.connectionState === "failed" ||
            pc.connectionState === "disconnected"
          ) {
            console.error("❌ Connection failed/disconnected");
            reject(
              new Error("WebRTC connection failed: " + pc.connectionState),
            );
          }
        };

        // Monitor signaling state
        pc.onsignalingstatechange = () => {
          console.log("📡 Signaling state:", pc.signalingState);
        };

        console.log("✓ RTCPeerConnection created");

        // Add video transceiver (CRITICAL: needed for valid SDP offer)
        try {
          pc.addTransceiver("video", { direction: "recvonly" });
          console.log("✓ Video transceiver added");
        } catch (e) {
          console.warn("⚠️ Could not add transceiver:", e.message);
        }

        // Create offer and send via WHEP
        (async () => {
          try {
            console.log("Creating offer...");
            const offer = await pc.createOffer();
            console.log("✓ Offer created, setting local description...");
            await pc.setLocalDescription(offer);
            console.log("✓ Local description set");

            const whepUrl =
              go2rtcUrl + "/api/webrtc?src=" + encodeURIComponent(streamName);
            console.log("📤 POSTing to WHEP endpoint:", whepUrl);

            console.log("SDP Offer:\n", pc.localDescription.sdp);

            const response = await fetch(whepUrl, {
              method: "POST",
              body: pc.localDescription.sdp,
              headers: { "Content-Type": "text/plain" },
            });

            console.log(
              "📥 Response status:",
              response.status,
              response.statusText,
            );

            if (!response.ok) {
              console.error("❌ WHEP error response:");
              const errorText = await response.text();
              console.error(errorText);
              throw new Error(
                "WHEP response error: " +
                  response.status +
                  " " +
                  response.statusText,
              );
            }

            const answerSdp = await response.text();
            console.log("✓ Answer received");
            console.log("SDP Answer:\n", answerSdp);

            console.log("Setting remote description...");
            await pc.setRemoteDescription(
              new RTCSessionDescription({
                type: "answer",
                sdp: answerSdp,
              }),
            );

            console.log("✓ Remote description set");
            console.log("✅ WebRTC connection established!");
            console.groupEnd();
            resolve();
          } catch (error) {
            console.error("❌ WebRTC connection error:", error);
            console.log("Error details:", error.message || error);
            console.groupEnd();
            reject(error);
          }
        })();
      } catch (error) {
        console.error("❌ WebRTC setup error:", error);
        console.groupEnd();
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
    console.log("Set go2rtc wrapper height to " + wrapperHeight + "px");

    // Connect WebRTC if mode is webrtc
    if (go2rtcType === "webrtc") {
      this.connectWebRTC(me).catch((error) => {
        console.error(
          "WebRTC connection failed, falling back to iframe:",
          error,
        );
        me.block.go2rtcType = "iframe";
        this.run(me); // Re-render as iframe
      });
    }
  },
};

Dashticz.register(DT_go2rtc);
//# sourceURL=js/components/go2rtc.js
