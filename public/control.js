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
    getCurrentTemp.open("GET", getBaseDataURL(self.station.get().id) + "&date=latest");
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
      self.temp.change({ value: value, caption: time });
    }
  }
}

/* exported DisplayUnitsController */
function DisplayUnitsController(displayUnits) {
  var self;
  create();
  return self;

  function create() {
    self = {
      displayUnits: displayUnits
    };

    self.onChange = onChange.bind(self);
  }

  function onChange(units) {
    if (self.displayUnits.get() !== units) {
      localStorage.setItem("units", units);
      self.displayUnits.change(units);
    }
  }
}

/* exported StationsController */
function StationsController(stations) {
  var self;
  create();
  return self;

  function create() {
    self = {
      stations: stations
    };

    self.fetchStations = fetchStations.bind(self);
    self.fetched = fetched.bind(self);

    self.fetchStations();
  }

  function fetchStations() {
    var getStations = new XMLHttpRequest();
    getStations.addEventListener("load", function() {
      self.fetched(this);
    });
    getStations.open("GET", "http://tidesandcurrents.noaa.gov/mdapi/v0.6/webapi/stations.json?type=watertemp");
    getStations.send();
  }

  function fetched(response) {
    try {
      var payload = response.responseText;
      payload = JSON.parse(payload);
      var stations = payload.stations.map(function(station) {
        return {
          id: station.id,
          name: station.name + (station.state ? ", " + station.state : "")
        };
      });
      stations = stations.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });
      self.stations.change(stations);
    } catch (e) {
      console.log(e);
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
