(function() {
  var stationId = "9414290";

  function getBaseDataURL(stationId) {
    return (
      "https://tidesandcurrents.noaa.gov/api/datagetter?station=" +
      stationId +
      "&product=water_temperature&format=json&units=english&time_zone=lst_ldt"
    );
  }

  function gotCurrentTemp() {
    var value;
    var time;
    try {
      var payload = this.responseText;
      payload = JSON.parse(payload);
      value = parseFloat(payload.data[0].v).toFixed(1);
      time = payload.data[0].t;
    } catch (e) {
      console.log(e);
    }
    if (value && time) {
      updateTempValue("latest-temp", value);
      updateTempCaption("latest-temp", time);
    }
  }

  function got24Hours() {
    var min;
    var avg;
    var max;
    try {
      var payload = this.responseText;
      payload = JSON.parse(payload);
      var sum = 0;
      payload.data.forEach(function(datum) {
        var value = parseFloat(datum.v);
        if (value) {
          sum = sum + value;
          if (!min || value < min) {
            min = value;
          }
          if (!max || value > max) {
            max = value;
          }
        }
      });
      if (sum !== 0) {
        avg = sum / payload.data.length;
      }
    } catch (e) {
      console.log(e);
    }
    if (min) {
      updateTempValue("24-hours-min", min.toFixed(1));
    }
    if (avg) {
      updateTempValue("24-hours-avg", avg.toFixed(1));
    }
    if (max) {
      updateTempValue("24-hours-max", max.toFixed(1));
    }
  }

  function updateTempValue(id, value) {
    var element = document.getElementById(id);
    if (element && element.children[0]) {
      element.children[0].innerHTML = value;
    }
  }

  function updateTempCaption(id, caption) {
    var element = document.getElementById(id);
    if (element && element.children[2]) {
      element.children[2].innerHTML = caption;
    }
  }
  var getCurrentTemp = new XMLHttpRequest();
  getCurrentTemp.addEventListener("load", gotCurrentTemp);
  getCurrentTemp.open("GET", getBaseDataURL(stationId) + "&date=latest");
  getCurrentTemp.send();

  var get24Hours = new XMLHttpRequest();
  get24Hours.addEventListener("load", got24Hours);
  get24Hours.open("GET", getBaseDataURL(stationId) + "&range=24");
  get24Hours.send();
})();
