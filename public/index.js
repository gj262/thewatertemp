// Begin FFS IE

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
  /* eslint no-extend-native: 0 */
  String.prototype.padStart = function padStart(targetLength, padString) {
    targetLength = targetLength >> 0; // truncate if number or convert non-number to 0;
    padString = String(typeof padString !== "undefined" ? padString : " ");
    if (this.length > targetLength) {
      return String(this);
    } else {
      targetLength = targetLength - this.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
      }
      return padString.slice(0, targetLength) + String(this);
    }
  };
}

// End FFS IE

(function() {
  var changeUnitsReg;
  var resetTempsReg;

  var latestTemp;
  var twentyFourHoursTempRange;
  var comparison;

  function setInitialStationChoice(stationId, stationName) {
    var select = document.getElementById("choose-station");
    var opt = document.createElement("option");
    opt.value = stationId;
    opt.text = stationName;
    opt.setAttribute("selected", true);
    select.add(opt);
  }

  function stationsFetched(selectedStationId) {
    try {
      var payload = this.responseText;
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
      var select = document.getElementById("choose-station");
      select.remove(0); // remove initial option (if any)
      stations.forEach(function(station) {
        var opt = document.createElement("option");
        opt.value = station.id;
        opt.text = station.name;
        if (selectedStationId === station.id) {
          opt.setAttribute("selected", true);
        }
        select.add(opt);
      });
      addStationChoiceHandler(stations);
    } catch (e) {
      console.log(e);
    }
  }

  function addStationChoiceHandler(stations) {
    var select = document.getElementById("choose-station");
    select.addEventListener("change", function() {
      stationChoosen.bind(this)(stations);
    });
  }

  function stationChoosen(stations) {
    var stationId = stations[this.selectedIndex].id;
    localStorage.setItem("stationId", stationId);
    var stationName = stations[this.selectedIndex].name;
    localStorage.setItem("stationName", stationName);

    updateStationLink(stationId);
    clearStationError();

    resetTempsReg.invoke();

    fetchChoosenStationData(stationId);
  }

  function updateStationLink(stationId) {
    var element = document.getElementById("station-link");
    element.innerHTML = "Station: " + stationId;
    element.setAttribute("href", "https://tidesandcurrents.noaa.gov/stationhome.html?id=" + stationId);
  }

  function setStationError(message) {
    var element = document.getElementById("station-error");
    element.innerHTML = message;
    element.classList.remove("no-error");
  }

  function clearStationError() {
    var element = document.getElementById("station-error");
    element.innerHTML = "";
    element.classList.add("no-error");
  }

  function attachToUnitLinks(stationId) {
    var element = document.getElementById("choose-unit");
    var links = element.querySelectorAll("a");
    links[0].addEventListener("click", updateUnits.bind({}, "us"));
    links[1].addEventListener("click", updateUnits.bind({}, "metric"));
  }

  function updateUnits(newUnits) {
    localStorage.setItem("units", newUnits);
    changeUnitsReg.invoke({ units: newUnits });
  }

  function fetchChoosenStationData(stationId) {
    var getCurrentTemp = new XMLHttpRequest();
    getCurrentTemp.addEventListener("load", function() {
      latestTempFetched.bind(this)(latestTemp);
    });
    getCurrentTemp.open("GET", getBaseDataURL(stationId) + "&date=latest");
    getCurrentTemp.send();

    var get24Hours = new XMLHttpRequest();
    get24Hours.addEventListener("load", function() {
      twentyFourHoursTempRange.displayData(getRangeFromResponse.bind(this)());
    });
    get24Hours.open("GET", getBaseDataURL(stationId) + "&range=24");
    get24Hours.send();

    comparison.fetchData();
  }

  function fetchAllStations(selectedStationId) {
    var getStations = new XMLHttpRequest();
    getStations.addEventListener("load", function() {
      stationsFetched.bind(this)(selectedStationId);
    });
    getStations.open("GET", "http://tidesandcurrents.noaa.gov/mdapi/v0.6/webapi/stations.json?type=watertemp");
    getStations.send();
  }

  function getBaseDataURL(stationId) {
    return (
      "https://tidesandcurrents.noaa.gov/api/datagetter?station=" +
      stationId +
      "&product=water_temperature&format=json&units=english&time_zone=lst_ldt"
    );
  }

  function latestTempFetched(tempDisplayComponent) {
    var value;
    var time;
    try {
      var payload = this.responseText;
      payload = JSON.parse(payload);
      if (payload.error && payload.error.message) {
        setStationError(payload.error.message);
      } else {
        value = parseFloat(payload.data[0].v);
        time = payload.data[0].t;
      }
    } catch (e) {
      console.log(e);
    }
    if (value && time) {
      tempDisplayComponent.updateValue(value);
      tempDisplayComponent.updateCaption(time);
    }
  }

  function getRangeFromResponse() {
    var data;
    try {
      var payload = this.responseText;
      payload = JSON.parse(payload);
      data = payload.data;
    } catch (e) {
      console.log(e);
    }
    return data;
  }

  function TempDisplayComponent(id, value, units, caption) {
    function create(id, value, units, caption) {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      value = value || "--.-";
      caption = caption || "--";

      element.innerHTML =
        "<span class=\"temp-value\">" +
        value +
        "</span><span class=\"temp-units " +
        units +
        "\"></span><span class=\"temp-caption\">" +
        caption +
        "</span>";
      element.classList.add("temp-display");

      var displayComponent = {
        value,
        units,
        caption,
        element,
        valueElement: element.children[0],
        unitsElement: element.children[1],
        captionElement: element.children[2]
      };

      displayComponent.updateValue = updateValue.bind(displayComponent);
      displayComponent.updateCaption = updateCaption.bind(displayComponent);
      displayComponent.getValueForDisplay = getValueForDisplay.bind(displayComponent);

      changeUnitsReg.add(refreshTempWhenUnitsChange.bind(displayComponent));
      resetTempsReg.add(resetTemp.bind(displayComponent));

      return displayComponent;
    }

    return create(id, value, units, caption);

    function updateValue(value) {
      this.value = value;
      this.valueElement.innerHTML = this.getValueForDisplay();
    }

    function refreshTempWhenUnitsChange(payload) {
      this.units = payload.units;
      this.valueElement.innerHTML = this.getValueForDisplay();
      this.unitsElement.classList.remove("us");
      this.unitsElement.classList.remove("metric");
      this.unitsElement.classList.add(this.units);
    }

    function getValueForDisplay() {
      var value = parseFloat(this.value);
      if (value) {
        if (this.units === "metric") {
          value = (value - 32) * 5 / 9;
        }
        return value.toFixed(1);
      } else {
        return this.value;
      }
    }

    function updateCaption(caption) {
      this.captionElement.innerHTML = caption;
    }

    function resetTemp() {
      this.valueElement.innerHTML = "--.-";
      if (!this.caption) {
        this.captionElement.innerHTML = "--";
      }
    }
  }

  function TempRangeComponent(id, units) {
    function create(id, units) {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }
      element.innerHTML = "<div id=\"" + id + "-min\"></div><div id=\"" + id + "-avg\"></div><div id=\"" + id + "-max\"></div>";
      element.classList.add("temp-range");

      var self = {
        min: TempDisplayComponent(id + "-min", null, units, "Min"),
        avg: TempDisplayComponent(id + "-avg", null, units, "Avg"),
        max: TempDisplayComponent(id + "-max", null, units, "Max")
      };

      self.displayData = displayData.bind(self);

      return self;
    }

    return create(id, units);

    function displayData(data) {
      var min;
      var avg;
      var max;
      var sum = 0;
      data.forEach(function(datum) {
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
        avg = sum / data.length;
      }
      if (min) {
        this.min.updateValue(min);
      }
      if (avg) {
        this.avg.updateValue(avg);
      }
      if (max) {
        this.max.updateValue(max);
      }
    }
  }

  function Comparison(id, stationId, units) {
    function create(id, units) {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      var nowMS = Date.now();

      var ranges = [];
      for (var day = 1; day <= 7; day++) {
        var dayMS = nowMS - day * 24 * 60 * 60 * 1000;
        var dayDate = new Date(dayMS);
        var dayOfWeek = dayDate.toLocaleString("en-us", { weekday: "long" });
        var titleElement = document.createElement("h2");
        titleElement.innerHTML = dayOfWeek;
        element.appendChild(titleElement);
        var rangeElement = document.createElement("div");
        rangeElement.id = "comparison-range-" + dayOfWeek;
        element.appendChild(rangeElement);
        ranges.push({
          component: TempRangeComponent(rangeElement.id, units),
          dateStr:
            dayDate.getFullYear() +
            "-" +
            (dayDate.getMonth() + 1 + "").padStart(2, "0") +
            "-" +
            (dayDate.getDate() + "").padStart(2, "0")
        });
      }

      var beginMS = nowMS - 7 * 24 * 60 * 60 * 1000;
      var beginDate = new Date(beginMS);

      var comparison = {
        element,
        stationId,
        units,
        beginDate,
        ranges
      };

      comparison.fetchData = fetchData.bind(comparison);
      comparison.fetched = fetched.bind(comparison);

      return comparison;
    }

    return create(id, units);

    function fetchData() {
      var fetch = new XMLHttpRequest();
      var self = this;
      fetch.addEventListener("load", function() {
        self.fetched(this);
      });
      var beginStr =
        this.beginDate.getFullYear() +
        (this.beginDate.getMonth() + 1 + "").padStart(2, "0") +
        (this.beginDate.getDate() + "").padStart(2, "0");
      fetch.open("GET", getBaseDataURL(this.stationId) + "&begin_date=" + beginStr + "&range=168");
      fetch.send();
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

      this.ranges.forEach(function(range) {
        var rangeData = data.filter(function(datum) {
          return datum.t.indexOf(range.dateStr) === 0;
        });
        range.component.displayData(rangeData);
      });
    }
  }

  function Registry(name) {
    var reg = { watchers: [] };

    reg.add = function(toInvoke) {
      reg.watchers.push(toInvoke);
    };

    reg.invoke = function(payload) {
      reg.watchers.forEach(function(toInvoke) {
        toInvoke(payload);
      });
    };

    return reg;
  }

  document.addEventListener("DOMContentLoaded", function(event) {
    var units = localStorage.getItem("units") || "us";
    var stationId = localStorage.getItem("stationId") || "9414290";
    var stationName = localStorage.getItem("stationName") || "San Francisco, CA";

    changeUnitsReg = Registry("change-units");
    resetTempsReg = Registry("reset-temps");

    attachToUnitLinks();
    updateStationLink(stationId);
    setInitialStationChoice(stationId, stationName);

    latestTemp = TempDisplayComponent("latest-temp", null, units, null);
    twentyFourHoursTempRange = TempRangeComponent("24-hours", units);
    comparison = Comparison("comparison", stationId, units);

    fetchChoosenStationData(stationId);
    fetchAllStations(stationId);
  });
})();
