/* exported LatestTempController */
function LatestTempController(temp, station) {
  var self;
  create();
  return self;

  function create() {
    self = {
      temp: temp,
      station: station
    };

    self.fetchData = fetchData.bind(self);
    self.fetched = fetched.bind(self);

    self.fetchData();
  }

  function fetchData() {
    var getCurrentTemp = new XMLHttpRequest();
    getCurrentTemp.addEventListener("load", function() {
      self.fetched(this);
    });
    getCurrentTemp.open("GET", getBaseDataURL(this.station.get().id) + "&date=latest");
    getCurrentTemp.send();
  }

  function fetched(response) {
    var value;
    var time;
    try {
      var payload = response.responseText;
      payload = JSON.parse(payload);
      if (payload.error && payload.error.message) {
        //setStationError(payload.error.message);
      } else {
        value = parseFloat(payload.data[0].v);
        time = payload.data[0].t;
      }
    } catch (e) {
      console.log(e);
    }
    if (value && time) {
      this.temp.change({ value: value, caption: time });
    }
  }
}

function getBaseDataURL(stationId) {
  return (
    "https://tidesandcurrents.noaa.gov/api/datagetter?station=" +
    stationId +
    "&product=water_temperature&format=json&units=english&time_zone=lst_ldt"
  );
}
