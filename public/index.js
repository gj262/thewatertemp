(function() {
  var units;
  var changeUnitsReg;
  var resetTempsReg;

  var latestTemp;
  var twentyFourHoursTempRange;

  function setInitialStationChoice(stationId, stationName) {
    var select = document.getElementById("choose-station");
    var opt = document.createElement("option");
    opt.value = stationId;
    opt.text = stationName;
    opt.setAttribute("selected", true);
    select.add(opt);
  }

  function gotStations(selectedStationId) {
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

    getChoosenStationData(stationId);
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
    units = newUnits;
    localStorage.setItem("units", newUnits);
    changeUnitsReg.invoke({ units: newUnits });
  }

  function getChoosenStationData(stationId) {
    var getCurrentTemp = new XMLHttpRequest();
    getCurrentTemp.addEventListener("load", function() {
      gotCurrentTemp.bind(this)(latestTemp);
    });
    getCurrentTemp.open("GET", getBaseDataURL(stationId) + "&date=latest");
    getCurrentTemp.send();

    var get24Hours = new XMLHttpRequest();
    get24Hours.addEventListener("load", function() {
      gotTempRange.bind(this)(twentyFourHoursTempRange);
    });
    get24Hours.open("GET", getBaseDataURL(stationId) + "&range=24");
    get24Hours.send();
  }

  function getAllStations(selectedStationId) {
    var getStations = new XMLHttpRequest();
    getStations.addEventListener("load", function() {
      gotStations.bind(this)(selectedStationId);
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

  function gotCurrentTemp(tempDisplayComponent) {
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

  function gotTempRange(rangeComponent) {
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
      rangeComponent.min.updateValue(min);
    }
    if (avg) {
      rangeComponent.avg.updateValue(avg);
    }
    if (max) {
      rangeComponent.max.updateValue(max);
    }
  }

  function createTempDisplayComponent(id, caption) {
    var element = document.getElementById(id);
    if (!element) {
      throw new Error("expected to find " + id);
    }
    element.innerHTML =
      "<span class=\"temp-value\">--.-</span><span class=\"temp-units " +
      units +
      "\"></span><span class=\"temp-caption\">" +
      (caption || "--") +
      "</span>";
    element.classList.add("temp-display");

    var displayComponent = {
      caption,
      element,
      valueElement: element.children[0],
      unitsElement: element.children[1],
      captionElement: element.children[2]
    };

    displayComponent.updateValue = updateTempValue.bind(displayComponent);
    displayComponent.updateCaption = updateTempCaption.bind(displayComponent);

    changeUnitsReg.add(refreshTempWhenUnitsChange.bind(displayComponent));
    resetTempsReg.add(resetTemp.bind(displayComponent));

    return displayComponent;
  }

  function updateTempValue(value) {
    if (parseFloat(value)) {
      this.valueElement.dataset.value = value;
      value = getValueForDisplay(value, units);
    }
    this.valueElement.innerHTML = value;
  }

  function refreshTempWhenUnitsChange(payload) {
    var value = parseFloat(this.valueElement.dataset.value);
    if (value) {
      this.valueElement.innerHTML = getValueForDisplay(value, payload.units);
    }
    this.unitsElement.classList.remove("us");
    this.unitsElement.classList.remove("metric");
    this.unitsElement.classList.add(payload.units);
  }

  function getValueForDisplay(value, units) {
    if (units === "metric") {
      value = (value - 32) * 5 / 9;
    }
    return value.toFixed(1);
  }

  function updateTempCaption(caption) {
    this.captionElement.innerHTML = caption;
  }

  function resetTemp() {
    this.valueElement.innerHTML = "--.-";
    if (!this.caption) {
      this.captionElement.innerHTML = "--";
    }
  }

  function createTempRangeComponent(id) {
    var element = document.getElementById(id);
    if (!element) {
      throw new Error("expected to find " + id);
    }
    element.innerHTML = "<div id=\"" + id + "-min\"></div><div id=\"" + id + "-avg\"></div><div id=\"" + id + "-max\"></div>";
    element.classList.add("temp-range");

    return {
      min: createTempDisplayComponent(id + "-min", "Min"),
      avg: createTempDisplayComponent(id + "-avg", "Avg"),
      max: createTempDisplayComponent(id + "-max", "Max")
    };
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
    units = localStorage.getItem("units") || "us";
    var stationId = localStorage.getItem("stationId") || "9414290";
    var stationName = localStorage.getItem("stationName") || "San Francisco, CA";

    changeUnitsReg = Registry("change-units");
    resetTempsReg = Registry("reset-temps");

    attachToUnitLinks();
    updateStationLink(stationId);
    setInitialStationChoice(stationId, stationName);

    latestTemp = createTempDisplayComponent("latest-temp");
    twentyFourHoursTempRange = createTempRangeComponent("24-hours");

    getChoosenStationData(stationId);
    getAllStations(stationId);
  });
})();
