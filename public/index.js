(function() {
  function gotCurrentTemp() {
    var value;
    try {
      var payload = this.responseText;
      payload = JSON.parse(payload);
      value = parseFloat(payload.data[0].v).toFixed(1);
    } catch (e) {
      console.log(e);
    }
    if (value) {
      updateTemp("latest-temp", value);
    }
  }

  function updateTemp(id, value) {
    var element = document.getElementById(id);
    if (element) {
      element.innerHTML = value;
    }
  }

  var getCurrentTemp = new XMLHttpRequest();
  getCurrentTemp.addEventListener("load", gotCurrentTemp);
  getCurrentTemp.open(
    "GET",
    "https://tidesandcurrents.noaa.gov/api/datagetter?station=9414290&date=latest&product=water_temperature&format=json&units=english&time_zone=lst_ldt"
  );
  getCurrentTemp.send();
})();
