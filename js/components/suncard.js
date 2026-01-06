/*
 * Suncard component for Dashticz.
 * Inspired by https://github.com/edwardtfn/home-assistant-sun-card
 */

var DT_suncard = (function () {
  const SVG_WIDTH = 500;
  const SVG_HEIGHT = 250;
  const MAX_RADIUS = 100; // Max visual altitude height (used for scale)
  const MAX_DAY_LENGTH_HOURS = 16; // Approximate maximum daylight hours for a mid-latitude location
  let LATITUDE = 0; // Equator for simplification

  /**
   * Calculates the solar declination for a given date.
   * @param {Date} date - The date.
   * @returns {number} Declination in degrees.
   */
  function getDeclination(date) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    return 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365.25);
  }

  /**
   * Maps a Date object (HH:MM:SS) to an X coordinate (0 to width) on the 24-hour timeline.
   * @param {Date} date - The date object representing a time.
   * @param {number} width - The total width of the SVG.
   * @returns {number} The X coordinate.
   */
  const timeToX = (date, width) => {
    if (!date || isNaN(date.getTime())) return -1;
    const hours =
      date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    return (hours / 24) * width;
  };

  /**
   * Draws the current sun/moon marker based on the time and path position.
   */
  function drawSunMarker(
    svg,
    X_current,
    Y_current_on_path,
    now,
    dawn,
    sunrise,
    sunset,
    dusk
  ) {
    const markerR = 10;
    let fill = "#ffc107"; // Default Sun Color
    let stroke = "#f57c00";
    let markerType = "sun";

    // Determine the current solar state
    if (now >= sunrise && now <= sunset) {
      markerType = "sun"; // Day
      fill = "#ffc107";
      stroke = "#f57c00";
    } else if (now >= dawn && now < sunrise) {
      markerType = "dawn"; // Morning Twilight
      fill = "#ffed8c";
      stroke = "#ffa000";
    } else if (now > sunset && now <= dusk) {
      markerType = "dusk"; // Evening Twilight
      fill = "#ffa000";
      stroke = "#ff5722";
    } else {
      markerType = "moon"; // Night
      fill = "#90a4ae";
      stroke = "#607d8b";
    }

    // Clamp Y to prevent marker from going outside SVG boundaries
    const Y_clamped = Math.max(
      markerR,
      Math.min(SVG_HEIGHT - markerR, Y_current_on_path)
    );

    // --- 1. Draw the Base Marker (Circle) ---
    const baseMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    baseMarker.setAttribute("cx", X_current);
    baseMarker.setAttribute("cy", Y_clamped);
    baseMarker.setAttribute("r", markerR);
    baseMarker.setAttribute("fill", fill);
    baseMarker.setAttribute("stroke", stroke);
    baseMarker.setAttribute("stroke-width", "3");
    svg.appendChild(baseMarker);

    // --- 2. Add Moon/Star overlay for Night ---
    if (markerType === "moon") {
      // Use a second, smaller circle with the background color to create a crescent effect
      const moonMask = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      moonMask.setAttribute("cx", X_current + 3); // Offset X
      moonMask.setAttribute("cy", Y_clamped - 3); // Offset Y
      moonMask.setAttribute("r", markerR * 0.8);
      moonMask.setAttribute("fill", "#202020"); // Assuming a dark background color for the Suncard area
      moonMask.setAttribute("stroke", "none");
      svg.appendChild(moonMask);

      // Re-apply the base marker outline on top of the mask for sharp edge definition
      baseMarker.setAttribute("stroke-width", "2");
      svg.appendChild(baseMarker);
    }
  }

  /**
   * Draws the 24-hour sun path by forcing the curve through the actual solar event times.
   */
  function drawSunPath(svgElementId, percent, solarEvents) {
    const { sunrise, sunset, solarnoon, dawn, dusk } = solarEvents;

    const svg = document.getElementById(svgElementId);
    if (!svg) {
      console.error(`SVG element with ID '${svgElementId}' not found`);
      return;
    }

    const width = SVG_WIDTH;
    const centerY = MAX_RADIUS + 20; // Horizon line Y position
    const numPoints = 200; // Number of points for smooth curve
    svg.innerHTML = "";

    // --- 1. Calculate Declination and Max Altitude ---
    const decl = getDeclination(new Date());
    const maxAltitude = 90 - LATITUDE + decl;
    const zenithY = centerY - MAX_RADIUS;
    const nadirY = centerY + MAX_RADIUS;

    // --- 2. Calculate X Coordinates (Time-to-X mapping) ---
    const X_sunrise = timeToX(sunrise, width);
    const X_sunset = timeToX(sunset, width);
    const X_solarnoon = timeToX(solarnoon, width);
    const X_dawn = timeToX(dawn, width);
    const X_dusk = timeToX(dusk, width);

    // Define Key Points for labels
    const P0_nadirLeft = { x: 0, y: nadirY };
    const P2_solarnoon = { x: (180 / 360) * width, y: zenithY };
    const P4_nadirRight = { x: width, y: nadirY };

    // --- 4. Calculate Horizon Line Y Position ---
    // Calculate where the cosine curve intersects at sunrise
    const sunriseHours = sunrise.getHours() + sunrise.getMinutes() / 60 + sunrise.getSeconds() / 3600;
    const sunriseAzimuth = (sunriseHours / 24) * 360;
    const sunriseAltitude = -maxAltitude * Math.cos((2 * Math.PI * sunriseAzimuth) / 360);
    const horizonY = centerY - (sunriseAltitude * MAX_RADIUS) / maxAltitude;

    // --- 5. Draw Elements ---

    // Horizon Line
    const horizonLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    horizonLine.setAttribute("x1", 0);
    horizonLine.setAttribute("y1", horizonY);
    horizonLine.setAttribute("x2", width);
    horizonLine.setAttribute("y2", horizonY);
    horizonLine.setAttribute("stroke", "#999");
    horizonLine.setAttribute("stroke-width", "1.5");
    horizonLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(horizonLine);

    // Dawn and Dusk Twilight Zones (colored areas)
    const twilightColor = "#555566"; // A dark blue/purple for twilight

    // Dawn Zone (from Dawn X to Sunrise X)
    const dawnRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    dawnRect.setAttribute("x", X_dawn);
    dawnRect.setAttribute("y", 0);
    dawnRect.setAttribute("width", X_sunrise - X_dawn);
    dawnRect.setAttribute("height", SVG_HEIGHT);
    dawnRect.setAttribute("fill", twilightColor);
    dawnRect.setAttribute("opacity", "0.2");
    svg.appendChild(dawnRect);

    // Dusk Zone (from Sunset X to Dusk X)
    const duskRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    duskRect.setAttribute("x", X_sunset);
    duskRect.setAttribute("y", 0);
    duskRect.setAttribute("width", X_dusk - X_sunset);
    duskRect.setAttribute("height", SVG_HEIGHT);
    duskRect.setAttribute("fill", twilightColor);
    duskRect.setAttribute("opacity", "0.2");
    svg.appendChild(duskRect);

    // --- 5. Calculate Current Position ---

    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    const azimuth = (hours / 24) * 360;
    const altitude = -maxAltitude * Math.cos((2 * Math.PI * azimuth) / 360);
    const X_current = (azimuth / 360) * width;
    const Y_current_on_path = centerY - (altitude * MAX_RADIUS) / maxAltitude;

    // --- 6. Fill Elapsed Time Area ---
    const numPointsElapsed = Math.floor((azimuth / 360) * numPoints);
    let elapsedPathData = `M 0 ${nadirY}`;
    for (let i = 1; i <= numPointsElapsed; i++) {
      const azimuth_i = (i / numPoints) * 360;
      const altitude_i = -maxAltitude * Math.cos((2 * Math.PI * azimuth_i) / 360);
      const x_i = (azimuth_i / 360) * width;
      const y_i = centerY - (altitude_i * MAX_RADIUS) / maxAltitude;
      elapsedPathData += ` L ${x_i} ${y_i}`;
    }
    const fillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const fillD = `M 0 ${horizonY} L 0 ${nadirY} ${elapsedPathData.replace(/^M \d+ \d+/, '')} L ${X_current} ${horizonY} Z`;
    fillPath.setAttribute("d", fillD);
    fillPath.setAttribute("fill", "rgba(255, 255, 0, 0.3)");
    fillPath.setAttribute("stroke", "none");
    svg.appendChild(fillPath);

    // Complete 24-Hour Path (Using Cosine Formula)
    const completePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    let pathData = '';
    for (let i = 0; i <= numPoints; i++) {
      const azimuth = (i / numPoints) * 360;
      const altitude = -maxAltitude * Math.cos((2 * Math.PI * azimuth) / 360);
      const x = (azimuth / 360) * width;
      const y = centerY - (altitude * MAX_RADIUS) / maxAltitude;
      if (i === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    }
    completePath.setAttribute("d", pathData);
    completePath.setAttribute("stroke", "#ddd");
    completePath.setAttribute("stroke-width", "2");
    completePath.setAttribute("fill", "none");
    svg.appendChild(completePath);

    // --- 7. Draw the Marker based on state ---
    drawSunMarker(
      svg,
      X_current,
      Y_current_on_path,
      now,
      dawn,
      sunrise,
      sunset,
      dusk
    );

    // Vertical Time Lines (Sunrise/Sunset)
    if (sunrise && sunset) {
      // Sunrise line
      const sunriseLineElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      sunriseLineElement.setAttribute("x1", X_sunrise);
      sunriseLineElement.setAttribute("y1", 0);
      sunriseLineElement.setAttribute("x2", X_sunrise);
      sunriseLineElement.setAttribute("y2", SVG_HEIGHT);
      sunriseLineElement.setAttribute("stroke", "#ff9800");
      sunriseLineElement.setAttribute("stroke-width", "1");
      sunriseLineElement.setAttribute("opacity", "0.5");
      svg.appendChild(sunriseLineElement);

      // Sunset line
      const sunsetLineElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      sunsetLineElement.setAttribute("x1", X_sunset);
      sunsetLineElement.setAttribute("y1", 0);
      sunsetLineElement.setAttribute("x2", X_sunset);
      sunsetLineElement.setAttribute("y2", SVG_HEIGHT);
      sunsetLineElement.setAttribute("stroke", "#ff6b35");
      sunsetLineElement.setAttribute("stroke-width", "1");
      sunsetLineElement.setAttribute("opacity", "0.5");
      svg.appendChild(sunsetLineElement);
    }
  }

  /**
   * Calculates the time progress (0-100) through a 24-hour day.
   */
  function calculate24HourProgress(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    const progress = (totalMinutes / (24 * 60)) * 100;
    return progress;
  }

  function formatTime(date) {
    if (!date || isNaN(date.getTime())) return "--:--";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function buildSuncardHTML(me) {
    return (
      '<div id="suncard" class="suncard-wrapper">' +
      '<div class="suncard-times-header">' +
      '<div class="suncard-sunrise-column">' +
      '<div class="suncard-time-label">Sunrise</div>' +
      '<div class="suncard-time-value" id="sunriseTime">--:--</div>' +
      "</div>" +
      '<div class="suncard-current-column">' +
      '<div class="suncard-time-label">Current time</div>' +
      '<div class="suncard-time-value" id="currentTime">--:--</div>' +
      "</div>" +
      '<div class="suncard-sunset-column">' +
      '<div class="suncard-time-label">Sunset</div>' +
      '<div class="suncard-time-value" id="sunsetTime">--:--</div>' +
      "</div>" +
      "</div>" +
      `<svg id="mySunSvg" class="suncard-svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" preserveAspectRatio="xMidYMid meet"></svg>` +
      '<div class="suncard-events">' +
      '<div class="suncard-event">' +
      '<div class="suncard-event-label">Dawn</div>' +
      '<div class="suncard-event-time" id="dawnTime">--:--</div>' +
      "</div>" +
      '<div class="suncard-event">' +
      '<div class="suncard-event-label">Solar noon</div>' +
      '<div class="suncard-event-time" id="solarnoonTime">--:--</div>' +
      "</div>" +
      '<div class="suncard-event">' +
      '<div class="suncard-event-label">Dusk</div>' +
      '<div class="suncard-event-time" id="duskTime">--:--</div>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function draw_card(me) {
    const solarEvents = {
      sunrise: me.block.sunrise,
      sunset: me.block.sunset,
      solarnoon: me.block.solarnoon,
      dawn: me.block.dawn,
      dusk: me.block.dusk,
    };

    document.getElementById("sunriseTime").textContent = formatTime(
      solarEvents.sunrise
    );
    document.getElementById("sunsetTime").textContent = formatTime(
      solarEvents.sunset
    );
    document.getElementById("dawnTime").textContent = formatTime(
      solarEvents.dawn
    );
    document.getElementById("duskTime").textContent = formatTime(
      solarEvents.dusk
    );
    document.getElementById("solarnoonTime").textContent = formatTime(
      solarEvents.solarnoon
    );
    document.getElementById("currentTime").textContent = formatTime(new Date());

    const progress = calculate24HourProgress(new Date());

    drawSunPath("mySunSvg", progress, solarEvents);
  }

  return {
    name: "suncard",
    init: function () {
      return DT_function.loadCSS("./js/components/suncard.css");
    },
    canHandle: function (block) {
      return block && block.type && block.type === "suncard";
    },
    defaultCfg: {
      width: 12,
      title: "Suncard",
      scale: 1,
    },
    run: function (me) {
      var width = me.block.size || $(me.mountPoint + " .dt_block").width();
      $(me.mountPoint + " .dt_block").css(
        "font-size",
        (width / 6) * (me.block.scale || 1)
      );

      $(me.mountPoint).html(buildSuncardHTML(me));

       Domoticz.request("type=command&param=getsettings", true)
        .then(function (response) {
          if (response && response.status === "OK") {
            LATITUDE = parseFloat(response.Location["Latitude"]) || 0;
          }
        });

      Domoticz.request("type=command&param=getSunRiseSet", true)
        .then(function (response) {
          if (response && response.status === "OK") {
            const today = new Date();
            const todayStr =
              today.getFullYear() +
              "-" +
              String(today.getMonth() + 1).padStart(2, "0") +
              "-" +
              String(today.getDate()).padStart(2, "0");

            const parseTime = (timeStr) => {
              const date = new Date(todayStr + " " + timeStr);
              return isNaN(date.getTime()) ? null : date;
            };

            me.block.sunrise = parseTime(response.Sunrise);
            me.block.sunset = parseTime(response.Sunset);
            me.block.solarnoon = parseTime(response.SunAtSouth);
            me.block.dawn = parseTime(response.CivTwilightStart);
            me.block.dusk = parseTime(response.CivTwilightEnd);

            draw_card(me);

            me.sunClock = setInterval(function updateDisplay() {
              if (document.getElementById("suncard")) {
                draw_card(me);
              } else {
                clearInterval(me.sunClock);
              }
            }, 60000);
          } else {
            throw new Error("Invalid Domoticz response");
          }
        })
        .catch(function (error) {
          console.warn(
            "Failed to fetch sun data, using approximations for Jan 5, 2026:",
            error
          );
        });
    }
  };
})();

Dashticz.register(DT_suncard);
