/*
  Show the current phase load on all three phases.
  Each phase is represented by a filled box with a height proportional to the load.
  The color of the box can be configured based on load percentage.
  Above the boxes, the current load in ampere is displayed.
  Below the boxes, the current voltage in volt is displayed.
*/

var DT_p1_phaseload = (function () {
  function buildHTML(me, device) {
    let decimals = 1;
    if (typeof me.block.decimals !== "undefined") {
      decimals = parseInt(me.block.decimals);
    }

    // Parse device data: assume format "1.2 A, 2.3 A, 3.4 A"
    const dataArray = device.Data.split(", ")
      .map((str) => {
        if (str.includes(" A")) {
          return { value: parseFloat(str.replace(" A", "")), unit: "A" };
        }
        return null;
      })
      .filter((d) => d !== null);

    const currents = dataArray
      .filter((d) => d.unit === "A")
      .map((d) => d.value / me.block.ampere_divider);

    // Assume three phases
    const phases = ["L1", "L2", "L3"];

    function getColor(percent) {
      if (percent < 33) return "green";
      if (percent < 66) return "yellow";
      return "red";
    }

    var l1_voltage =
      parseInt(Domoticz.getAllDevices(me.block.l1_voltage_idx).Data) /
      me.block.voltage_divider; // L1 Voltage
    var l2_voltage =
      parseInt(Domoticz.getAllDevices(me.block.l2_voltage_idx).Data) /
      me.block.voltage_divider; // L2 Voltage
    var l3_voltage =
      parseInt(Domoticz.getAllDevices(me.block.l3_voltage_idx).Data) /
      me.block.voltage_divider; // L3 Voltage

    var voltage = [
      l1_voltage.toFixed(decimals),
      l2_voltage.toFixed(decimals),
      l3_voltage.toFixed(decimals),
    ];

    let html = `<svg viewBox="0 0 100 80" class="p1-phaseload-container" xmlns="http://www.w3.org/2000/svg">`;

    phases.forEach((phase, i) => {
      let current = currents[i] || 0;
      let percent = (current / me.block.max_current) * 100;
      if (percent > 100) percent = 100;
      let height = (percent / 100) * 50; // max height 50
      const color = getColor(percent);
      let x = 10 + i * 30;
      let rectY = 70 - height;

      // Text above: current in A
      html += `<text x="${
        x + 10
      }" y="10" class="p1-phaseload-current">${current.toFixed(
        decimals
      )} A</text>`;

      // Rectangle for load
      html += `<rect x="${x}" y="20" width="20" height="50" class="p1-phaseload-box-background" />`; // background
      html += `<rect x="${x}" y="${rectY}" width="20" height="${height}" fill="${color}" />`;

      // Text above: current in A
      html += `<text x="${x + 10}" y="${
        rectY + height + 10
      }" class="p1-phaseload-voltage">${voltage[i]} V</text>`;
    });

    html += "</svg>";
    return html;
  }

  return {
    name: "p1-phaseload",
    init: function () {
      return DT_function.loadCSS("./js/components/p1-phaseload.css");
    },
    canHandle: function (block) {
      return block && block.type && block.type === "p1-phaseload";
    },
    defaultCfg: {
      show_lastupdate: false,
      idx: 1,
      width: 3,
      max: 16,
      max_current: 16,
      decimals: 1,
      voltage_divider: 1000,
      ampere_divider: 1000,
    },
    run: function (me) {
      me.layout = parseInt(0 + me.block.layout);
      let width = me.block.size || $(me.mountPoint + " .dt_block").width();
      var height = isDefined(me.block.height)
        ? parseInt(me.block.height)
        : parseInt($(me.mountPoint + " div").outerWidth());

      me.block.height = parseInt(height);

      console.log(width, height);

      Dashticz.subscribeDevice(me, me.block.idx, true, function (device) {
        this.value = device.Data;
        $(me.mountPoint + " .dt_content").html(buildHTML(me, device));
      });
    },
  };
})();

Dashticz.register(DT_p1_phaseload);
