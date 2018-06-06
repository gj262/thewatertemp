/* global Model */

/* exported LatestTempController */
function LatestTempController(temp, station, error) {
  var self;
  create();
  return self;

  function create() {
    self = {
      temp: temp,
      station: station,
      error: error
    };

    fetchData();

    station.watch(function() {
      self.temp.change({});
      self.error.change("");
      fetchData();
    });
  }

  function fetchData() {
    var getCurrentTemp = new XMLHttpRequest();
    getCurrentTemp.addEventListener("load", function() {
      fetched(this);
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
        error.change(payload.error.message);
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

/* exported TwentyFourHourRangeController */
function TwentyFourHourRangeController(range, station) {
  var self;
  create();
  return self;

  function create() {
    self = {
      range: range,
      station: station
    };

    fetchData();

    station.watch(function() {
      self.range.change({});
      fetchData();
    });
  }

  function fetchData() {
    var getCurrentTemp = new XMLHttpRequest();
    getCurrentTemp.addEventListener("load", function() {
      fetched(this);
    });
    getCurrentTemp.open("GET", getBaseDataURL(self.station.get().id) + "&range=24");
    getCurrentTemp.send();
  }

  function fetched(response) {
    var data;
    try {
      var payload = response.responseText;
      payload = JSON.parse(payload);
      data = payload.data;
    } catch (e) {
      console.log(e);
    }
    if (data) {
      self.range.change(getRangeFromData(data));
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

    self.onChange = onChange;
    self.displayUnits.watch(onUpdate);
  }

  function onChange(units) {
    if (self.displayUnits.get() !== units) {
      self.displayUnits.change(units);
    }
  }

  function onUpdate(before) {
    if (self.displayUnits.get() !== before) {
      localStorage.setItem("units", self.displayUnits.get());
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

    self.fetchStations = fetchStations;
    self.fetched = fetched;

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

/* exported SelectedStationController */
function SelectedStationController(selectedStation) {
  var self;
  create();
  return self;

  function create() {
    self = {
      selectedStation: selectedStation
    };

    self.onChange = onChange;
    self.selectedStation.watch(onUpdate);
  }

  function onChange(selection) {
    if (self.selectedStation.get().id !== selection.id) {
      self.selectedStation.change(selection);
    }
  }

  function onUpdate(before) {
    if (self.selectedStation.get().id !== before.id) {
      localStorage.setItem("stationId", self.selectedStation.get().id);
      localStorage.setItem("stationName", self.selectedStation.get().name);
    }
  }
}

/* exported SevenDayComparisonController */
function SevenDayComparisonController(comparison, station) {
  var self;
  create();
  return self;

  function create() {
    var nowMS = Date.now();

    var series = [];
    for (var day = 1; day <= 7; day++) {
      var dayMS = nowMS - day * 24 * 60 * 60 * 1000;
      var dayDate = new Date(dayMS);
      var dayOfWeek = dayDate.toLocaleString("en-us", { weekday: "long" });
      series.push({
        title: dayOfWeek,
        dateStr:
          dayDate.getFullYear() +
          "-" +
          (dayDate.getMonth() + 1 + "").padStart(2, "0") +
          "-" +
          (dayDate.getDate() + "").padStart(2, "0"),
        range: Model({})
      });
    }

    comparison.change({ title: comparison.get().title, series: series });

    var beginMS = nowMS - 7 * 24 * 60 * 60 * 1000;
    var beginDate = new Date(beginMS);

    self = {
      comparison: comparison,
      station: station,
      beginDate: beginDate
    };

    fetchData();

    station.watch(function() {
      self.comparison.get().series.forEach(function(seriesItem) {
        seriesItem.range.change({});
      });
      fetchData();
    });
  }

  function fetchData() {
    var getData = new XMLHttpRequest();
    getData.addEventListener("load", function() {
      fetched(this);
    });
    var beginStr =
      self.beginDate.getFullYear() +
      (self.beginDate.getMonth() + 1 + "").padStart(2, "0") +
      (self.beginDate.getDate() + "").padStart(2, "0");
    getData.open("GET", getBaseDataURL(self.station.get().id) + "&begin_date=" + beginStr + "&range=168");
    getData.send();
  }

  function fetched(response) {
    var data;
    try {
      var payload = response.responseText;
      payload = JSON.parse(payload);
      data = payload.data;
    } catch (e) {
      console.log(e);
    }
    if (data) {
      self.comparison.get().series.forEach(function(seriesItem) {
        var rangeData = data.filter(function(datum) {
          return datum.t.indexOf(seriesItem.dateStr) === 0;
        });
        seriesItem.range.change(getRangeFromData(rangeData));
      });
    }
  }
}

/* exported ThisDayInPriorYearsController */
function ThisDayInPriorYearsController(comparison, station) {
  var self;
  create();
  return self;

  function create() {
    var todaysDate = new Date();

    self = {
      comparison: comparison,
      station: station,
      todaysDate: todaysDate,
      nextYearToFetch: todaysDate.getFullYear() - 1,
      consecutiveBlankYears: 0
    };

    fetchData();

    station.watch(function() {
      self.nextYearToFetch = todaysDate.getFullYear() - 1;
      self.consecutiveBlankYears = 0;
      self.comparison.change({ title: self.comparison.get().title, series: [] });
      fetchData();
    });
  }

  function fetchData() {
    var getData = new XMLHttpRequest();
    getData.addEventListener("load", function() {
      fetched(this);
    });
    var beginStr =
      self.nextYearToFetch +
      (self.todaysDate.getMonth() + 1 + "").padStart(2, "0") +
      (getDateButFudgeLeapYear(self.todaysDate) + "").padStart(2, "0");
    getData.open("GET", getBaseDataURL(self.station.get().id) + "&begin_date=" + beginStr + "&range=24");
    getData.send();
  }

  function getDateButFudgeLeapYear(date) {
    if (date.getMonth() === 1 && date.getDate() === 29) {
      return 28;
    }
    return date.getDate();
  }

  function fetched(response) {
    var data;
    try {
      var payload = response.responseText;
      payload = JSON.parse(payload);
      data = payload.data;
    } catch (e) {
      console.log(e);
    }

    var forYear = self.nextYearToFetch;
    self.nextYearToFetch = self.nextYearToFetch - 1;

    if (data) {
      for (var i = self.consecutiveBlankYears; i > 0; i--) {
        self.comparison.change({
          title: self.comparison.get().title,
          series: self.comparison.get().series.concat([{ title: forYear + i, noData: true }])
        });
      }
      self.consecutiveBlankYears = 0;
      var seriesItem = { title: forYear, range: Model(getRangeFromData(data)) };
      self.comparison.change({ title: self.comparison.get().title, series: self.comparison.get().series.concat([seriesItem]) });
    } else {
      if (!self.consecutiveBlankYears) {
        self.consecutiveBlankYears = 1;
      } else {
        self.consecutiveBlankYears++;
      }
    }

    if (!self.consecutiveBlankYears || self.consecutiveBlankYears < 3) {
      fetchData(self.stationId);
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

function getRangeFromData(data) {
  var min;
  var avg;
  var max;
  var sum = 0;
  var count = 0;
  data.forEach(function(datum) {
    var value = parseFloat(datum.v);
    if (value) {
      sum = sum + value;
      count++;
      if (!min || value < min) {
        min = value;
      }
      if (!max || value > max) {
        max = value;
      }
    }
  });
  if (sum !== 0 && count !== 0) {
    avg = sum / count;
  }
  return { min: min, avg: avg, max: max };
}
