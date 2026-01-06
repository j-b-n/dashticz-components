/*
    Waterflow component for Dashticz - illustrates water flow in liters per minute using a water drop gauge.
    The drop fills with blue (cold) or red (hot) water based on the waterType setting.
*/

var DT_waterflow = (function () {
  function buildHTML(me, device) {
    var value = "0";
    var percent = 0;
    var decimals = 0;
    var waterType = me.block.waterType || "cold";
    var color = waterType === "hot" ? "red" : "blue";

    if (typeof me.block.decimals !== "undefined") {
      decimals = parseInt(me.block.decimals);
    }

    switch (device.SubType) {
      case "Custom":
      case "Electric":
        value = parseFloat(device.Data).toFixed(decimals);
        break;
      case "Temp + Humidity":
        value = parseFloat(device.Temp).toFixed(decimals);
        break;
      case "Energy":
        value = parseFloat(device.Usage).toFixed(decimals);
        break;
    }

    percent = (value / me.block.max) * 100;
    percent = percent > 100 ? 100 : percent;
    percent = percent < 0 ? 0 : percent;

    var html =
      '<svg viewBox="0 0 100 120" class="waterflow" xmlns="http://www.w3.org/2000/svg">';

    // Define clip path for fill level
    var dropStartY = 0;
    var dropHeight = 100;
    var clipHeight = dropHeight * (percent / 100);
    var clipY = dropStartY + dropHeight * (1 - percent / 100)+2;
    html += '<defs>';
    html += '<style>';
    html += '#coldGradient > stop:first-child { stop-color: var(--waterflow-cold-light); }';
    html += '#coldGradient > stop:last-child { stop-color: var(--waterflow-cold-dark); }';
    html += '#hotGradient > stop:first-child { stop-color: var(--waterflow-hot-light); }';
    html += '#hotGradient > stop:last-child { stop-color: var(--waterflow-hot-dark); }';
    html += '</style>';
    html += '<clipPath id="dropClip">';
    html += '<rect x="0" y="' + clipY + '" width="100" height="' + clipHeight + '" />';
    html += '</clipPath>';
    html += '<linearGradient id="coldGradient" x1="0%" y1="0%" x2="0%" y2="100%">';
    html += '<stop offset="0%" style="stop-opacity:1" />';
    html += '<stop offset="100%" style="stop-opacity:1" />';
    html += '</linearGradient>';
    html += '<linearGradient id="hotGradient" x1="0%" y1="0%" x2="0%" y2="100%">';
    html += '<stop offset="0%" style="stop-opacity:1" />';
    html += '<stop offset="100%" style="stop-opacity:1" />';
    html += '</linearGradient>';
    html += '</defs>';

    // Drop outline
    html += '<path d="M61.38,18.68c-4.77,-6.86,-8.90,-12.78,-9.89,-15.62c-0.22,-0.62,-0.80,-1.04,-1.47,-1.05c-0.61,0.02,-1.26,0.40,-1.49,1.01c-1.02,2.68,-4.93,8.30,-9.47,14.81C28.68,32.75,14.46,53.18,14.46,66.51c0,19.61,15.94,35.55,35.55,35.55s35.55,-15.94,35.55,-35.55C85.50,53.39,71.58,33.34,61.38,18.68z" fill="none" stroke="white" stroke-width="2" />';

    // Filled drop
    var waterClass = waterType === 'hot' ? 'waterflow-fill-hot' : 'waterflow-fill-cold';
    html += '<path d="M61.38,18.68c-4.77,-6.86,-8.90,-12.78,-9.89,-15.62c-0.22,-0.62,-0.80,-1.04,-1.47,-1.05c-0.61,0.02,-1.26,0.40,-1.49,1.01c-1.02,2.68,-4.93,8.30,-9.47,14.81C28.68,32.75,14.46,53.18,14.46,66.51c0,19.61,15.94,35.55,35.55,35.55s35.55,-15.94,35.55,-35.55C85.50,53.39,71.58,33.34,61.38,18.68z" class="' + waterClass + '" clip-path="url(#dropClip)" />';

    // Value text
    var textColor = me.block.textColor ? me.block.textColor : "white";
    html +=
      '<text class="waterflow-value-text" x="50" y="112" text-anchor="middle" dominant-baseline="middle" font-size="10px" fill="' +
      textColor +
      '">';
    html += value;
    if (typeof me.block.Unit !== "undefined") {
      html += " " + me.block.Unit;
    } else {
      html += " L/min";
    }
    html += "</text>";

    // Title
    html +=
      '<text class="waterflow-label-text" x="50" y="125" text-anchor="middle" dominant-baseline="middle" font-size="7px" fill="' +
      textColor +
      '">';
    if (typeof me.block.title !== "undefined") {
      html += me.block.title;
    } else {
      html += device.Name;
    }
    html += "</text>";

    html += "</svg>";
    return html;
  }

  return {
    name: "waterflow",
    init: function () {
      return DT_function.loadCSS("./js/components/waterflow.css");
    },
    defaultCfg: {
      show_lastupdate: false,
      idx: 1,
      min: 0,
      max: 100,
      decimals: 1,
      waterType: "cold", // 'cold' or 'hot'
      width: 3,
    },
    run: function (me) {
      me.layout = parseInt(0 + me.block.layout);
      var height = isDefined(me.block.height)
        ? parseInt(me.block.height)
        : parseInt($(me.mountPoint + " div").outerWidth());

      me.block.height = parseInt(height);

      if (me.block.demo == true) {
        device = {
          Data: me.block.demoValue || 50,
          SubType: "Custom",
          Name: "Demo Waterflow",
          idx: 1,
        };
        $(me.mountPoint + " .dt_content").html(buildHTML(me, device));
      } else {
        Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
          this.value = device.Data;
          $(me.mountPoint + " .dt_content").html(buildHTML(me, device));
        });
      }
    },
  };
})();

Dashticz.register(DT_waterflow);
