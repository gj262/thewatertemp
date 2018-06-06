(function() {
  var unitsReg;
  var resetTempsReg;
  var stationChangeReg;

  var latestTemp;
  var twentyFourHoursTempRange;
  var comparison;
  var comparisons = [];

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
    stationChangeReg.invoke();

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

  function attachToUnitLinks() {
    var element = document.getElementById("choose-unit");
    var links = element.querySelectorAll("a");
    links[0].addEventListener("click", updateUnits.bind({}, "us"));
    links[1].addEventListener("click", updateUnits.bind({}, "metric"));
  }

  function updateUnits(newUnits) {
    localStorage.setItem("units", newUnits);
    unitsReg.invoke({ units: newUnits });
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

    comparison.fetchData(stationId);
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

  function TempDisplayComponent(id, value, caption) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      value = value || "--.-";
      caption = caption || "--";

      var units = unitsReg.getValue().units;

      element.innerHTML =
        "<span class=\"temp-value\">" +
        value +
        "</span><span class=\"temp-units " +
        units +
        "\"></span><span class=\"temp-caption\">" +
        caption +
        "</span>";
      element.classList.add("temp-display");

      self = {
        value,
        units,
        caption,
        element,
        valueElement: element.children[0],
        unitsElement: element.children[1],
        captionElement: element.children[2]
      };

      self.updateValue = updateValue.bind(self);
      self.updateCaption = updateCaption.bind(self);
      self.getValueForDisplay = getValueForDisplay.bind(self);
      self.destroy = destroy.bind(self);

      self.unitsRegId = unitsReg.add(refreshTempWhenUnitsChange.bind(self));
      self.resetTempsRegId = resetTempsReg.add(resetTemp.bind(self));
    }

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

    function destroy() {
      unitsReg.remove(this.unitsRegId);
      resetTempsReg.remove(this.resetTempsRegId);
    }
  }

  function TempRangeComponent(id) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }
      element.innerHTML = "<div id=\"" + id + "-min\"></div><div id=\"" + id + "-avg\"></div><div id=\"" + id + "-max\"></div>";
      element.classList.add("temp-range");

      self = {
        min: TempDisplayComponent(id + "-min", null, "Min"),
        avg: TempDisplayComponent(id + "-avg", null, "Avg"),
        max: TempDisplayComponent(id + "-max", null, "Max")
      };

      self.displayData = displayData.bind(self);
      self.destroy = destroy.bind(self);
    }

    function displayData(data) {
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

    function destroy() {
      if (this.min) {
        this.min.destroy();
      }
      if (this.avg) {
        this.avg.destroy();
      }
      if (this.max) {
        this.max.destroy();
      }
    }
  }

  function createSection(parentElement, title, bodyId) {
    var titleElement = document.createElement("h2");
    titleElement.innerHTML = title;
    parentElement.appendChild(titleElement);

    var bodyElement = document.createElement("div");
    bodyElement.id = bodyId;
    parentElement.appendChild(bodyElement);

    return bodyElement;
  }

  function ForTheLastSevenDays(id) {
    var self;
    create();
    return self;

    function create() {
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
        var rangeElement = createSection(element, dayOfWeek, "comparison-range-" + dayOfWeek);
        ranges.push({
          component: TempRangeComponent(rangeElement.id),
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

      self = {
        element,
        beginDate,
        ranges
      };

      self.fetchData = fetchData.bind(self);
      self.fetched = fetched.bind(self);
      self.destroy = destroy.bind(self);
    }

    function fetchData(stationId) {
      var fetch = new XMLHttpRequest();
      fetch.addEventListener("load", function() {
        self.fetched(this);
      });
      var beginStr =
        this.beginDate.getFullYear() +
        (this.beginDate.getMonth() + 1 + "").padStart(2, "0") +
        (this.beginDate.getDate() + "").padStart(2, "0");
      fetch.open("GET", getBaseDataURL(stationId) + "&begin_date=" + beginStr + "&range=168");
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

    function destroy() {
      this.ranges.forEach(function(range) {
        range.component.destroy();
      });
      this.element.innerHTML = "";
    }
  }
  comparisons.push({ comparison: ForTheLastSevenDays, title: "For the last seven days", name: "the-last-seven-days" });

  function ThisDayInPriorYears(id) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      var todaysDate = new Date();

      self = {
        element,
        todaysDate,
        nextYearToFetch: todaysDate.getFullYear() - 1,
        rangeComponents: []
      };

      self.fetchData = fetchData.bind(self);
      self.fetched = fetched.bind(self);
      self.destroy = destroy.bind(self);

      stationChangeReg.add(stationChanged.bind(self));
    }

    function fetchData(stationId) {
      var fetch = new XMLHttpRequest();
      fetch.addEventListener("load", function() {
        self.fetched(this);
      });
      var beginStr =
        this.nextYearToFetch +
        (this.todaysDate.getMonth() + 1 + "").padStart(2, "0") +
        (getDateButFudgeLeapYear(this.todaysDate) + "").padStart(2, "0");
      fetch.open("GET", getBaseDataURL(stationId) + "&begin_date=" + beginStr + "&range=24");
      fetch.send();
      this.stationId = stationId;
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

      var forYear = this.nextYearToFetch;
      this.nextYearToFetch = this.nextYearToFetch - 1;

      var rangeElement = createSection(this.element, forYear, "comparison-range-" + forYear);
      if (data) {
        var component = TempRangeComponent(rangeElement.id);
        component.displayData(data);
        this.consecutiveBlankYears = 0;
        this.rangeComponents.push(component);
      } else {
        rangeElement.innerHTML = "<p>No data for this date.</p>";
        if (!this.consecutiveBlankYears) {
          this.consecutiveBlankYears = 1;
        } else {
          this.consecutiveBlankYears++;
        }
      }

      if (!this.consecutiveBlankYears || this.consecutiveBlankYears < 3) {
        this.fetchData(this.stationId);
      }
    }

    function stationChanged() {
      this.destroy();
      this.rangeComponents = [];
      this.nextYearToFetch = this.todaysDate.getFullYear() - 1;
    }

    function destroy() {
      this.rangeComponents.forEach(function(rangeComponent) {
        rangeComponent.destroy();
      });
      this.element.innerHTML = "";
    }
  }
  comparisons.push({ comparison: ThisDayInPriorYears, title: "This day in prior years", name: "today-in-prior-years" });

  function renderComparisonChoice(comparisons, selectedName, stationId) {
    var select = document.getElementById("choose-comparison");
    comparisons.forEach(function(comparison) {
      var opt = document.createElement("option");
      opt.value = comparison.name;
      opt.text = comparison.title;
      if (selectedName === comparison.name) {
        opt.setAttribute("selected", true);
      }
      select.add(opt);
    });
    select.addEventListener("change", function() {
      comparisonChoosen.bind(this)(comparisons, stationId);
    });
  }

  function comparisonChoosen(comparisons, stationId) {
    var comparisonName = comparisons[this.selectedIndex].name;
    localStorage.setItem("comparisonName", comparisonName);

    comparison.destroy();
    var selectedComparison = getSelectedComparison(comparisons, comparisonName);
    comparison = selectedComparison.comparison("comparison");
    comparison.fetchData(stationId);
  }

  function getSelectedComparison(comparisons, comparisonName) {
    return comparisons.find(function(comparison) {
      return comparison.name === comparisonName;
    });
  }

  function Registry(name, initial) {
    var reg = { id: 0, watchers: [], value: initial };

    reg.add = function(toInvoke) {
      reg.watchers.push({ id: ++reg.id, toInvoke });
      return reg.id;
    };

    reg.remove = function(id) {
      reg.watchers = reg.watchers.filter(function(watcher) {
        return watcher.id !== id;
      });
      return reg.id;
    };

    reg.invoke = function(payload) {
      reg.value = payload;
      reg.watchers.forEach(function(watcher) {
        watcher.toInvoke(payload);
      });
    };

    reg.getValue = function() {
      return reg.value;
    };

    return reg;
  }

  document.addEventListener("DOMContentLoaded", function(event) {
    var units = localStorage.getItem("units") || "us";
    var stationId = localStorage.getItem("stationId") || "9414290";
    var stationName = localStorage.getItem("stationName") || "San Francisco, CA";
    var comparisonName = localStorage.getItem("comparisonName") || comparisons[0].name;

    unitsReg = Registry("units", { units });
    resetTempsReg = Registry("reset-temps");
    stationChangeReg = Registry("station-change");

    attachToUnitLinks();
    updateStationLink(stationId);
    setInitialStationChoice(stationId, stationName);
    renderComparisonChoice(comparisons, comparisonName, stationId);
    var selectedComparison = getSelectedComparison(comparisons, comparisonName);

    latestTemp = TempDisplayComponent("latest-temp", null, null);
    twentyFourHoursTempRange = TempRangeComponent("24-hours");
    comparison = selectedComparison.comparison("comparison");

    fetchChoosenStationData(stationId);
    fetchAllStations(stationId);
  });
})();
