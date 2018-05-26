(function() {
  var units = "us";

  var stations;
  var latestTemp;
  var twentyFourHoursTempRange;

  function addStationChoiceHandler() {
    var select = document.getElementById("choose-station");
    select.addEventListener("change", stationChoosen);
  }

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
      stations = payload.stations.map(function(station) {
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
    } catch (e) {
      console.log(e);
    }
  }

  function stationChoosen() {
    var stationId = stations[this.selectedIndex].id;
    localStorage.setItem("stationId", stationId);
    var stationName = stations[this.selectedIndex].name;
    localStorage.setItem("stationName", stationName);

    updateStationLink(stationId);
    clearStationError();

    resetTemps();
    getChoosenStationData(stationId);
  }

  function updateStationLink(stationId) {
    var element = document.getElementById("station-link");
    element.innerHTML = "Station: " + stationId;
    element.setAttribute(
      "href",
      "https://tidesandcurrents.noaa.gov/stationhome.html?id=" + stationId
    );
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

  function resetTemps() {
    latestTemp.updateValue("--.-");
    twentyFourHoursTempRange.min.updateValue("--.-");
    twentyFourHoursTempRange.avg.updateValue("--.-");
    twentyFourHoursTempRange.max.updateValue("--.-");
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
    getStations.open(
      "GET",
      "http://tidesandcurrents.noaa.gov/mdapi/v0.6/webapi/stations.json?type=watertemp"
    );
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

    return {
      element,
      updateValue: updateTempValue.bind({}, element),
      updateCaption: updateTempCaption.bind({}, element)
    };
  }

  function updateTempValue(element, value) {
    if (element && element.children[0]) {
      if (parseFloat(value)) {
        if (units === "metric") {
          value = value - 32 * 5 / 9;
        }
        value = value.toFixed(1);
      }
      element.children[0].innerHTML = value;
    }
  }

  function updateTempCaption(element, caption) {
    if (element && element.children[2]) {
      element.children[2].innerHTML = caption;
    }
  }

  function createTempRangeComponent(id) {
    var element = document.getElementById(id);
    if (!element) {
      throw new Error("expected to find " + id);
    }
    element.innerHTML =
      "<div id=\"" +
      id +
      "-min\"></div><div id=\"" +
      id +
      "-avg\"></div><div id=\"" +
      id +
      "-max\"></div>";
    element.classList.add("temp-range");

    return {
      min: createTempDisplayComponent(id + "-min", "Min"),
      avg: createTempDisplayComponent(id + "-avg", "Avg"),
      max: createTempDisplayComponent(id + "-max", "Max")
    };
  }

  document.addEventListener("DOMContentLoaded", function(event) {
    var stationId = localStorage.getItem("stationId") || "9414290";
    var stationName =
      localStorage.getItem("stationName") || "San Francisco, CA";

    updateStationLink(stationId);
    setInitialStationChoice(stationId, stationName);
    addStationChoiceHandler();

    latestTemp = createTempDisplayComponent("latest-temp");
    twentyFourHoursTempRange = createTempRangeComponent("24-hours");

    getChoosenStationData(stationId);
    getAllStations(stationId);
  });
})();
