/* global Model */

/* exported View */
var View = (function() {
  function Temperature(id, temp, displayUnits) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      var caption = temp.get().caption || "--";

      element.innerHTML =
        "<span class=\"temp-value\">" +
        getValueForDisplay(temp, displayUnits) +
        "</span><span class=\"temp-units " +
        displayUnits.get() +
        "\"></span><span class=\"temp-caption\">" +
        caption +
        "</span>";
      element.classList.add("temp-display");

      self = {
        temp: temp,
        displayUnits: displayUnits,
        element: element,
        valueElement: element.children[0],
        unitsElement: element.children[1],
        captionElement: element.children[2]
      };

      temp.watch(updateTemp);
      displayUnits.watch(updateUnits);
    }

    function updateTemp(before) {
      if (self.temp.get().value !== before.value) {
        self.valueElement.innerHTML = getValueForDisplay(self.temp, self.displayUnits);
      }
      if (self.temp.get().caption !== before.caption) {
        self.captionElement.innerHTML = self.temp.get().caption || "--";
      }
    }

    function updateUnits(before) {
      if (self.displayUnits.get() !== before) {
        self.unitsElement.classList.remove("us");
        self.unitsElement.classList.remove("metric");
        self.unitsElement.classList.add(self.displayUnits.get());
        self.valueElement.innerHTML = getValueForDisplay(self.temp, self.displayUnits);
      }
    }

    function getValueForDisplay(temp, displayUnits) {
      var value = parseFloat(temp.get().value);
      if (value) {
        if (displayUnits.get() === "metric") {
          value = ((value - 32) * 5) / 9;
        }
        return value.toFixed(1);
      } else {
        return "--.-";
      }
    }
  }

  function Range(id, range, displayUnits) {
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
        range: range,
        min: Model({ value: range.get().min, caption: "Min" }),
        max: Model({ value: range.get().max, caption: "Max" }),
        avg: Model({ value: range.get().avg, caption: "Avg" }),
        displayUnits: displayUnits,
        element: element
      };

      Temperature(id + "-min", self.min, self.displayUnits);
      Temperature(id + "-max", self.max, self.displayUnits);
      Temperature(id + "-avg", self.avg, self.displayUnits);

      range.watch(onUpdate);
    }

    function onUpdate(before) {
      if (self.range.get().min !== before.min) {
        self.min.change({ value: self.range.get().min, caption: "Min" });
      }
      if (self.range.get().max !== before.max) {
        self.max.change({ value: self.range.get().max, caption: "Max" });
      }
      if (self.range.get().avg !== before.avg) {
        self.avg.change({ value: self.range.get().avg, caption: "Avg" });
      }
    }
  }

  function Comparison(id, comparison, displayUnits) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      self = {
        comparison: comparison,
        displayUnits: displayUnits,
        element: element
      };

      comparison.watch(render);

      render();
    }

    function render(before) {
      // note: item updates which would be handled by range updates.
      if (before && before.name !== self.comparison.get().name) {
        self.element.innerHTML = "";
      }
      while (self.comparison.get().series.length < self.element.children.length) {
        self.element.removeChild(self.element.lastChild);
      }
      self.comparison.get().series.forEach(function(item) {
        var id = getIdForItem(item);
        var element = document.getElementById(id);
        if (!element) {
          element = document.createElement("div");
          element.id = id;
          element.innerHTML = "<h2>" + item.title + "</h2>" + "<div id=\"" + id + "-range\"></div>";
          self.element.appendChild(element);
          if (item.range) {
            Range(id + "-range", item.range, self.displayUnits);
          } else {
            element.children[1].innerHTML = "<p>No data for this date.</p>";
          }
        }
      });
    }

    function getIdForItem(item) {
      return self.comparison.get().name + "" + "-" + (item.title + "").toLowerCase().replace(/\s/g, "-");
    }
  }

  function DisplayUnits(id, onChange) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }
      var links = element.querySelectorAll("a");
      links[0].addEventListener("click", onChange.bind({}, "us"));
      links[1].addEventListener("click", onChange.bind({}, "metric"));
    }
  }

  function Station(id, selectedStation, stationError, stations, onChangeStation) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      element.innerHTML =
        "<select id=\"choose-station\" name=\"station\"></select>" +
        "<a id=\"station-link\" class=\"station-link\" href=\"#\" " +
        "   title=\"Go to this stations home page\" target=\"_blank\"></a>" +
        "<p id=\"station-error\" class=\"station-error no-error\"></p>";

      self = {
        selectedStation: selectedStation,
        stationError: stationError,
        stations: stations,
        element: element,
        selectElement: element.children[0],
        homeLinkElement: element.children[1],
        stationErrorElement: element.children[2]
      };

      setInitialStationChoice();
      self.selectElement.addEventListener("change", function() {
        onChangeStation(self.stations.get()[this.selectedIndex]);
      });
      setStationHomeLink();
      setStationErrorMessage();

      stations.watch(stationsUpdated);
      selectedStation.watch(selectedStationUpdated);
      stationError.watch(setStationErrorMessage);
    }

    function setInitialStationChoice() {
      var opt = document.createElement("option");
      opt.value = self.selectedStation.get().id;
      opt.text = self.selectedStation.get().name;
      opt.setAttribute("selected", true);
      self.selectElement.add(opt);
    }

    function stationsUpdated() {
      self.selectElement.innerHTML = "";
      self.stations.get().forEach(function(station) {
        var opt = document.createElement("option");
        opt.value = station.id;
        opt.text = station.name;
        if (self.selectedStation.get().id === station.id) {
          opt.setAttribute("selected", true);
        }
        self.selectElement.add(opt);
      });
    }

    function setStationHomeLink() {
      self.homeLinkElement.innerHTML = "Station: " + self.selectedStation.get().id;
      self.homeLinkElement.setAttribute(
        "href",
        "https://tidesandcurrents.noaa.gov/stationhome.html?id=" + self.selectedStation.get().id
      );
    }

    function setStationErrorMessage() {
      var element = self.stationErrorElement;
      var error = self.stationError.get();
      if (error) {
        element.innerHTML = error;
        element.classList.remove("no-error");
      } else {
        element.innerHTML = "";
        element.classList.add("no-error");
      }
    }

    function selectedStationUpdated(before) {
      if (self.selectedStation.get().id !== before.id) {
        setStationHomeLink();
        // if station selection could come from any other source then here we would have to update the choice...
      }
    }
  }

  function ChooseComparison(id, selectedComparison, comparisons, onChangeComparison) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      self = {
        selectedComparison: selectedComparison,
        comparisons: comparisons,
        element: element
      };

      self.comparisons.forEach(function(comparison) {
        var opt = document.createElement("option");
        opt.value = comparison.name;
        opt.text = comparison.title;
        if (self.selectedComparison.get().name === comparison.name) {
          opt.setAttribute("selected", true);
        }
        self.element.add(opt);
      });

      self.element.addEventListener("change", function() {
        onChangeComparison(self.comparisons[this.selectedIndex]);
      });
    }
  }

  return {
    Station: Station,
    DisplayUnits: DisplayUnits,
    Temperature: Temperature,
    Range: Range,
    ChooseComparison: ChooseComparison,
    Comparison: Comparison
  };
})();
