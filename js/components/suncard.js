/* global Dashticz DT_function*/

var DT_suncard = (function () {

    function drawSunPath(svgElementId, percent, width, radius) {
    const svg = document.getElementById(svgElementId);
    if (!svg) {
      console.error(`SVG element with ID '${svgElementId}' not found`);
      return;
    }

    // Clear existing paths
    svg.innerHTML = "";

    // Calculate center coordinates
    const centerX = width / 2;
    const centerY = radius + 20; // Offset from top to accommodate the circle

    // Draw the horizontal center line
    const centerLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    centerLine.setAttribute("x1", 0);
    centerLine.setAttribute("y1", centerY);
    centerLine.setAttribute("x2", width);
    centerLine.setAttribute("y2", centerY);
    centerLine.setAttribute("stroke", "#ccc");
    centerLine.setAttribute("stroke-width", "1");
    svg.appendChild(centerLine);

    // Create the complete path
    const totalPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    // Define the three parts of the circle
    // Part 1: Bottom quarter (270° to 0°) - bottom to middle right
    const part1Start = { x: centerX, y: centerY + radius }; // Bottom (270°)
    const part1End = { x: centerX + radius, y: centerY }; // Middle right (0°)

    // Part 2: Top half (180° to 0°) - middle left to top to middle right
    const part2Start = { x: centerX - radius, y: centerY }; // Middle left (180°)
    const part2End = { x: centerX + radius, y: centerY }; // Middle right (0°)

    // Part 3: Bottom quarter (180° to 270°) - middle left to bottom
    const part3Start = { x: centerX - radius, y: centerY }; // Middle left (180°)
    const part3End = { x: centerX, y: centerY + radius }; // Bottom (270°)

    // Build the complete path string
    let pathData = `M ${part1Start.x} ${part1Start.y}`;

    // Part 1: Quarter circle from bottom to middle right (anti-clockwise)
    pathData += ` A ${radius} ${radius} 0 0 0 ${part1End.x} ${part1End.y}`;

    // Part 2: Half circle from middle left to middle right via top (clockwise)
    pathData += ` M ${part2Start.x} ${part2Start.y}`;
    pathData += ` A ${radius} ${radius} 0 0 1 ${part2End.x} ${part2End.y}`;

    // Part 3: Quarter circle from middle left to bottom (clockwise)
    pathData += ` M ${part3Start.x} ${part3Start.y}`;
    pathData += ` A ${radius} ${radius} 0 0 1 ${part3End.x} ${part3End.y}`;

    totalPath.setAttribute("d", pathData);
    totalPath.setAttribute("stroke", "#ddd");
    totalPath.setAttribute("stroke-width", "2");
    totalPath.setAttribute("fill", "none");
    svg.appendChild(totalPath);

    // Calculate the visible portion based on percentage
    if (percent > 0) {
      const visiblePath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      let visiblePathData = "";

      // Normalize percentage (0-100 to 0-1)
      const normalizedPercent = Math.max(0, Math.min(100, percent)) / 100;

      // Total path has 4 quarters: 1 + 2 + 1 = 4 quarters
      // Each quarter represents 25% of the journey

      if (normalizedPercent <= 0.25) {
        // First quarter: bottom to middle right
        const angle = normalizedPercent * 4 * (Math.PI / 2); // 0 to π/2
        const x = centerX + radius * Math.sin(angle);
        const y = centerY + radius * Math.cos(angle);

        visiblePathData = `M ${part1Start.x} ${part1Start.y} A ${radius} ${radius} 0 0 0 ${x} ${y}`;
      } else if (normalizedPercent <= 0.75) {
        // Second part: top half circle (middle left to middle right via top)
        const part2Progress = (normalizedPercent - 0.25) / 0.5; // 0 to 1
        const angle = part2Progress * Math.PI; // 0 to π
        const x = centerX - radius * Math.cos(angle);
        const y = centerY - radius * Math.sin(angle);

        // Include complete first quarter
        visiblePathData = `M ${part1Start.x} ${part1Start.y} A ${radius} ${radius} 0 0 0 ${part1End.x} ${part1End.y}`;
        // Add second part
        visiblePathData += ` M ${part2Start.x} ${part2Start.y} A ${radius} ${radius} 0 0 1 ${x} ${y}`;
      } else {
        // Third part: bottom quarter (middle left to bottom)
        const part3Progress = (normalizedPercent - 0.75) / 0.25; // 0 to 1
        const angle = part3Progress * (Math.PI / 2); // 0 to π/2
        const x = centerX - radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Include complete first and second parts
        visiblePathData = `M ${part1Start.x} ${part1Start.y} A ${radius} ${radius} 0 0 0 ${part1End.x} ${part1End.y}`;
        visiblePathData += ` M ${part2Start.x} ${part2Start.y} A ${radius} ${radius} 0 0 1 ${part2End.x} ${part2End.y}`;
        // Add third part
        visiblePathData += ` M ${part3Start.x} ${part3Start.y} A ${radius} ${radius} 0 0 1 ${x} ${y}`;
      }

      visiblePath.setAttribute("d", visiblePathData);
      visiblePath.setAttribute("stroke", "#ff6b35");
      visiblePath.setAttribute("stroke-width", "3");
      visiblePath.setAttribute("fill", "none");
      svg.appendChild(visiblePath);

      // Add sun position indicator
      const sunPosition = getSunPosition(
        normalizedPercent,
        centerX,
        centerY,
        radius
      );
      const sunDot = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      sunDot.setAttribute("cx", sunPosition.x);
      sunDot.setAttribute("cy", sunPosition.y);
      sunDot.setAttribute("r", "6");
      sunDot.setAttribute("fill", "#ffcc00");
      sunDot.setAttribute("stroke", "#ff6b35");
      sunDot.setAttribute("stroke-width", "2");
      svg.appendChild(sunDot);
    }
  }

  function getSunPosition(normalizedPercent, centerX, centerY, radius) {
    if (normalizedPercent <= 0.25) {
      // First quarter: bottom to middle right
      const angle = normalizedPercent * 4 * (Math.PI / 2);
      return {
        x: centerX + radius * Math.sin(angle),
        y: centerY + radius * Math.cos(angle),
      };
    } else if (normalizedPercent <= 0.75) {
      // Second part: top half circle
      const part2Progress = (normalizedPercent - 0.25) / 0.5;
      const angle = part2Progress * Math.PI;
      return {
        x: centerX - radius * Math.cos(angle),
        y: centerY - radius * Math.sin(angle),
      };
    } else {
      // Third part: bottom quarter
      const part3Progress = (normalizedPercent - 0.75) / 0.25;
      const angle = part3Progress * (Math.PI / 2);
      return {
        x: centerX - radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    }
  }

  function buildSuncardHTML(me) {
    var width = me.block.width || $(me.mountPoint + " .dt_block").width();

    return (
      '<div id="suncard" class="block_' +
      me.block.type +
      " col-xs-" +
      width +
      '">' +
      "</div>"
    );
  }

  function draw_card(me) {

    suncard = document.getElementById("suncard");

    var sun_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sun_svg.setAttribute("id","mySunSvg")
    sun_svg.setAttribute("width", 400);
    sun_svg.setAttribute("heigth", 200);
    sun_svg.setAttribute("style", "background-color: red");
    suncard.appendChild(sun_svg);

    drawSunPath('mySunSvg', 50, 400, 80);

    return;

    var suncard = document.getElementById("suncard");

    var sun_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sun_svg.setAttribute("width", suncard.clientWidth);
    sun_svg.setAttribute("style", "background-color: red");

    var newLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    newLine.setAttribute("id", "line2");
    newLine.setAttribute("x1", "0");
    newLine.setAttribute("y1", "0");
    newLine.setAttribute("x2", "20");
    newLine.setAttribute("y2", "20");
    newLine.setAttribute("stroke", "black");
    sun_svg.append(newLine);

    suncard.appendChild(sun_svg);
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
      //All optional. defaultCfg can also be a function and then will receive block as parameter.
      width: 12,
      title: "Suncard",
    },
    run: function (me) {
      var width = me.block.size || $(me.mountPoint + " .dt_block").width();
      $(me.mountPoint + " .dt_block").css(
        "font-size",
        (width / 6) * me.block.scale
      );

      $(me.mountPoint).html(buildSuncardHTML(me));
      
      draw_card(me);

      const sunClock = setInterval(function dateTime() {
        //Update sunClock
      }, 5000);
    },
  };
})();

Dashticz.register(DT_suncard);
//# sourceURL=js/components/suncard.js
