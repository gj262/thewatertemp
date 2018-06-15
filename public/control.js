/* global Model */

/* exported Controller */
var Controller = (function() {
  function LatestTemp(temp, station, error) {
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

      station.watch(function(before) {
        if (self.station.get().id !== before.id) {
          if (self.dataRequest) {
            self.dataRequest.abort();
          }
          self.temp.change({});
          self.error.change("");
          fetchData();
        }
      });
    }

    function fetchData() {
      self.temp.change({ loading: true }, { augmentObject: true });
      self.dataRequest = fetch(getBaseDataURL(self.station.get().id) + "&date=latest", fetched);
    }

    function fetched(response) {
      self.temp.change({ loading: false }, { augmentObject: true });
      self.dataRequest = null;
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
        self.temp.change({ value: value, caption: time }, { augmentObject: true });
      }
    }
  }

  function TwentyFourHourRange(range, station) {
    var self;
    create();
    return self;

    function create() {
      self = {
        range: range,
        station: station
      };

      fetchData();

      station.watch(function(before) {
        if (self.station.get().id !== before.id) {
          if (self.dataRequest) {
            self.dataRequest.abort();
          }
          self.range.change({});
          fetchData();
        }
      });
    }

    function fetchData() {
      self.dataRequest = fetch(getBaseDataURL(self.station.get().id) + "&range=24", fetched);
    }

    function fetched(response) {
      self.dataRequest = null;
      var data = unpackData(response.responseText);
      if (data) {
        self.range.change(getRangeFromData(data));
      }
    }
  }

  function Stations(stations) {
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
      fetch("https://tidesandcurrents.noaa.gov/mdapi/v0.6/webapi/stations.json?type=watertemp", fetched);
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

  function DisplayUnits(displayUnits) {
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

  function SelectedStation(selectedStation, stations) {
    var self;
    create();
    return self;

    function create() {
      var initialStation = getStationFromLocationOrDefaults();
      selectedStation.change(initialStation);

      self = {
        selectedStation: selectedStation,
        stations: stations
      };

      self.onChange = onChange;
      window.addEventListener("popstate", function(event) {
        var station = event.state && event.state.station ? event.state.station : getStationFromLocationOrDefaults();
        if (station.id !== self.selectedStation.get().id) {
          self.selectedStation.change(station);
        }
      });
      stations.watch(stationsUpdated);
    }

    function getStationFromLocationOrDefaults() {
      var url = new URL(document.location.href);
      if (url.pathname.length > 1) {
        return { id: url.pathname.substr(1), name: "" };
      }
      return {
        id: "9414290",
        name: "San Francisco, CA"
      };
    }

    function onChange(selection) {
      if (self.selectedStation.get().id !== selection.id) {
        var url = new URL(document.location.href);
        url.pathname = "/" + selection.id;
        history.pushState(Object.assign({}, history.state, { station: selection }), "", url.href);
        self.selectedStation.change(selection);
      }
    }

    function stationsUpdated() {
      if (self.selectedStation.get().name === "") {
        // when initialized from a URL, the name is unknown
        for (var i = 0; i < self.stations.get().length; i++) {
          if (self.selectedStation.get().id === self.stations.get()[i].id) {
            self.selectedStation.change(self.stations.get()[i]);
          }
        }
      }
    }
  }

  function SelectedComparison(selectedComparison, selectedStation, comparisons) {
    var self;
    create();
    return self;

    function create() {
      var initialComparison = getComparisonFromLocationOrDefaults(comparisons);
      selectedComparison.change(initialComparison);

      self = {
        selectedComparison: selectedComparison,
        selectedStation: selectedStation,
        comparisons: comparisons
      };

      self.onChange = onChange;
      window.addEventListener("popstate", function(event) {
        var comparison;
        if (event.state && event.state.comparisonName) {
          comparison =
            comparisons.find(function(comparison) {
              return comparison.name === event.state.comparisonName;
            }) || comparisons[0];
        } else {
          comparison = getComparisonFromLocationOrDefaults(comparisons);
        }
        if (comparison.name !== self.selectedComparison.get().name) {
          changeTo(comparison);
        }
      });

      self.selectedComparisonController = selectedComparison.get().Controller(selectedComparison, selectedStation);
    }

    function getComparisonFromLocationOrDefaults(comparisons) {
      var url = new URL(document.location.href);
      if (url.searchParams.has("compared-with")) {
        return (
          comparisons.find(function(comparison) {
            return comparison.name === url.searchParams.get("compared-with");
          }) || comparisons[0]
        );
      }

      return comparisons[0];
    }

    function onChange(selection) {
      if (self.selectedComparison.get().name !== selection.name) {
        var url = new URL(document.location.href);
        url.searchParams.set("compared-with", selection.name);
        history.pushState(Object.assign({}, history.state, { comparisonName: selection.name }), "", url.href);
        changeTo(selection);
      }
    }

    function changeTo(comparison) {
      self.selectedComparisonController.destroy();
      self.selectedComparison.change(comparison);
      self.selectedComparisonController = self.selectedComparison
        .get()
        .Controller(self.selectedComparison, self.selectedStation, self.comparisons);
    }
  }

  function SevenDayComparison(comparison, station) {
    var self;
    create();
    return self;

    function create() {
      var nowMS = Date.now();

      var series = [];
      for (var day = 1; day <= 7; day++) {
        var dayMS = nowMS - day * 24 * 60 * 60 * 1000;
        var dayDate = new Date(dayMS);
        var dayOfWeek = dayDate.toLocaleString(
          "en-us",
          { weekday: "long" }
        );
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

      comparison.change({ series: series }, { augmentObject: true });

      var beginMS = nowMS - 7 * 24 * 60 * 60 * 1000;
      var beginDate = new Date(beginMS);

      self = {
        comparison: comparison,
        station: station,
        beginDate: beginDate,
        destroy: destroy
      };

      fetchData();

      self.stationWatchId = station.watch(function(before) {
        if (self.station.get().id !== before.id) {
          if (self.dataRequest) {
            self.dataRequest.abort();
          }
          self.comparison.get().series.forEach(function(seriesItem) {
            seriesItem.range.change({});
          });
          fetchData();
        }
      });
    }

    function fetchData() {
      var beginStr =
        self.beginDate.getFullYear() +
        (self.beginDate.getMonth() + 1 + "").padStart(2, "0") +
        (self.beginDate.getDate() + "").padStart(2, "0");
      self.dataRequest = fetch(getBaseDataURL(self.station.get().id) + "&begin_date=" + beginStr + "&range=168", fetched);
    }

    function fetched(response) {
      self.dataRequest = null;
      var data = unpackData(response.responseText);

      if (data) {
        self.comparison.get().series.forEach(function(seriesItem) {
          var rangeData = data.filter(function(datum) {
            return datum.t.indexOf(seriesItem.dateStr) === 0;
          });
          seriesItem.range.change(getRangeFromData(rangeData));
        });
      }
    }

    function destroy() {
      self.station.remove(self.stationWatchId);
    }
  }

  function ThisDayInPriorYears(comparison, station) {
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
        consecutiveBlankYears: 0,
        destroy: destroy
      };

      fetchData();

      self.stationWatchId = station.watch(function(before) {
        if (self.station.get().id !== before.id) {
          if (self.dataRequest) {
            self.dataRequest.abort();
          }
          self.nextYearToFetch = todaysDate.getFullYear() - 1;
          self.consecutiveBlankYears = 0;
          self.comparison.change({ series: [] }, { augmentObject: true });
          fetchData();
        }
      });
    }

    function fetchData() {
      var beginStr =
        self.nextYearToFetch +
        (self.todaysDate.getMonth() + 1 + "").padStart(2, "0") +
        (getDateButFudgeLeapYear(self.todaysDate) + "").padStart(2, "0");
      self.dataRequest = fetch(getBaseDataURL(self.station.get().id) + "&begin_date=" + beginStr + "&range=24", fetched);
    }

    function getDateButFudgeLeapYear(date) {
      if (date.getMonth() === 1 && date.getDate() === 29) {
        return 28;
      }
      return date.getDate();
    }

    function fetched(response) {
      self.dataRequest = null;
      var data = unpackData(response.responseText);

      var forYear = self.nextYearToFetch;
      self.nextYearToFetch = self.nextYearToFetch - 1;

      if (data) {
        for (var i = self.consecutiveBlankYears; i > 0; i--) {
          self.comparison.change(
            {
              series: self.comparison.get().series.concat([{ title: forYear + i, noData: true }])
            },
            { augmentObject: true }
          );
        }
        self.consecutiveBlankYears = 0;
        var seriesItem = { title: forYear, range: Model(getRangeFromData(data)) };
        self.comparison.change({ series: self.comparison.get().series.concat([seriesItem]) }, { augmentObject: true });
      } else {
        if (!self.consecutiveBlankYears) {
          self.consecutiveBlankYears = 1;
        } else {
          self.consecutiveBlankYears++;
        }
      }

      if (!self.consecutiveBlankYears || self.consecutiveBlankYears < 3) {
        fetchData(self.stationId);
      } else {
        self.comparison.change(
          {
            series: self.comparison.get().series.concat([
              {
                title: "No more data",
                noData: true,
                message: "Tried years: " + (forYear + 2) + ", " + (forYear + 1) + " & " + forYear
              }
            ])
          },
          { augmentObject: true }
        );
      }
    }

    function destroy() {
      self.station.remove(self.stationWatchId);
    }
  }

  function fetch(url, whenFetched) {
    var getData = new XMLHttpRequest();
    getData.addEventListener("load", function() {
      whenFetched(this);
    });
    getData.open("GET", url);
    getData.send();
    return getData;
  }

  function unpackData(responseText) {
    var data;
    try {
      var payload = responseText;
      payload = JSON.parse(payload);
      data = payload.data;
    } catch (e) {
      console.log(e);
    }
    return data;
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

  return {
    LatestTemp: LatestTemp,
    TwentyFourHourRange: TwentyFourHourRange,
    DisplayUnits: DisplayUnits,
    SevenDayComparison: SevenDayComparison,
    Stations: Stations,
    ThisDayInPriorYears: ThisDayInPriorYears,
    SelectedStation: SelectedStation,
    SelectedComparison: SelectedComparison
  };
})();
