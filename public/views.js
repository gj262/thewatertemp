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

      var caption = getCaptionForDisplay(temp);

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
      if (self.temp.get().caption !== before.caption || self.temp.get().loading !== before.loading) {
        self.captionElement.innerHTML = getCaptionForDisplay(self.temp);
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

    function getCaptionForDisplay(temp) {
      return temp.get().loading ? "Loading..." : temp.get().caption || "--";
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
            element.children[1].innerHTML =
              "<span>" + (item.message ? item.message : "There is no data available for this date.") + "</span>";
          }
        }
      });
    }

    function getIdForItem(item) {
      return self.comparison.get().name + "" + "-" + (item.title + "").toLowerCase().replace(/\s/g, "-");
    }
  }

  function Menu(openerId, bodyId, toggleOrOpen, onClose) {
    var self;
    create();
    return self;

    function create() {
      var openerElement = document.getElementById(openerId);
      if (!openerElement) {
        throw new Error("expected to find " + openerId);
      }
      var bodyElement = document.getElementById(bodyId);
      if (!bodyElement) {
        throw new Error("expected to find " + bodyId);
      }

      self = {
        open: false,
        bodyElement: bodyElement,
        openerElement: openerElement,
        removeAllItems: removeAllItems,
        addItem: addItem
      };

      openerElement.addEventListener("click", toggleOrOpen ? toggle : open);
      document.addEventListener("click", closeIfOpenOnExternalClick);
    }

    function removeAllItems() {
      self.bodyElement.innerHTML = "";
    }

    function addItem(innerHTML, selected, onClick) {
      var item = document.createElement("li");
      item.innerHTML = innerHTML;
      item.classList.add("item");
      item.addEventListener("click", itemClicked.bind({}, item, onClick));
      if (selected) {
        item.classList.add("selected");
      }
      self.bodyElement.appendChild(item);
      if (selected) {
        self.selectedItem = item;
        self.bodyElement.scrollTop = self.selectedItem.offsetTop - self.bodyElement.clientHeight / 2;
      }
      return item;
    }

    function itemClicked(item, onClick) {
      if (self.selectedItem) {
        self.selectedItem.classList.remove("selected");
      }
      item.classList.add("selected");
      self.selectedItem = item;
      if (onClick) {
        onClick();
      }
      close();
    }

    function open() {
      self.bodyElement.classList.remove("hidden");
      if (self.selectedItem) {
        self.bodyElement.scrollTop = self.selectedItem.offsetTop - self.bodyElement.clientHeight / 2;
      }
      self.open = true;
    }

    function close() {
      self.bodyElement.classList.add("hidden");
      self.open = false;
      if (onClose) {
        onClose();
      }
    }

    function toggle() {
      if (self.open) {
        close();
      } else {
        open();
      }
    }

    function closeIfOpenOnExternalClick(event) {
      if (!self.open) {
        return;
      }
      var element = event.target;
      while (element) {
        if (element === self.bodyElement || element === self.openerElement) {
          return;
        }
        element = element.parentElement;
      }
      close();
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

  function ChooseStation(id, selectedStation, stations, onChangeStation) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      self = {
        selectedStation: selectedStation,
        stations: stations,
        element: element,
        menu: Menu(id, "station-menu", false, onClose)
      };

      selectedStation.watch(selectedStationUpdated);
      stations.watch(stationsUpdated);
      element.addEventListener("input", onInput);

      self.element.value = self.selectedStation.get().name || "Loading...";
    }

    function selectedStationUpdated(before) {
      if (self.selectedStation.get().name !== before.name) {
        self.element.value = self.selectedStation.get().name;
      }
    }

    function stationsUpdated() {
      updateMenu();
    }

    function updateMenu() {
      self.menu.removeAllItems();
      self.stations.get().forEach(function(station) {
        self.menu.addItem(station.name, self.selectedStation.get().name === station.name, onChangeStation.bind({}, station));
      });
    }

    function onInput() {
      self.menu.removeAllItems();
      var value = self.element.value || "";
      value = value.toLowerCase();
      self.stations.get().forEach(function(station) {
        if (station.name.toLowerCase().indexOf(value) !== -1) {
          self.menu.addItem(station.name, self.selectedStation.get().name === station.name, onChangeStation.bind({}, station));
        }
      });
    }

    function onClose() {
      self.element.value = self.selectedStation.get().name;
      updateMenu();
    }
  }

  function StationHomeLink(id, selectedStation) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      self = {
        selectedStation: selectedStation,
        element: element
      };

      setStationHomeLink();
      selectedStation.watch(selectedStationUpdated);
    }

    function setStationHomeLink() {
      self.element.innerHTML = "Station: " + self.selectedStation.get().id;
      self.element.setAttribute("href", "https://tidesandcurrents.noaa.gov/stationhome.html?id=" + self.selectedStation.get().id);
    }

    function selectedStationUpdated(before) {
      if (self.selectedStation.get().id !== before.id) {
        setStationHomeLink();
      }
    }
  }

  function StationError(id, stationError) {
    var self;
    create();
    return self;

    function create() {
      var element = document.getElementById(id);
      if (!element) {
        throw new Error("expected to find " + id);
      }

      self = {
        stationError: stationError,
        element: element
      };

      setStationErrorMessage();
      stationError.watch(setStationErrorMessage);
    }

    function setStationErrorMessage() {
      var element = self.element;
      var error = self.stationError.get();
      if (error) {
        element.innerHTML = error;
        element.classList.remove("no-error");
      } else {
        element.innerHTML = "";
        element.classList.add("no-error");
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
      selectedComparison.watch(selectedComparisonUpdated);
    }

    function selectedComparisonUpdated(before) {
      if (self.selectedComparison.get().name !== before.name) {
        for (var i = 0; i < self.element.children.length; i++) {
          var opt = self.element.children[i];
          if (opt.value === self.selectedComparison.get().name) {
            opt.setAttribute("selected", true);
            self.element.selectedIndex = i;
          } else {
            opt.removeAttribute("selected");
          }
        }
      }
    }
  }

  return {
    Menu: Menu,
    ChooseStation: ChooseStation,
    StationHomeLink: StationHomeLink,
    StationError: StationError,
    DisplayUnits: DisplayUnits,
    Temperature: Temperature,
    Range: Range,
    ChooseComparison: ChooseComparison,
    Comparison: Comparison
  };
})();
