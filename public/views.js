/* exported TempDisplay */
function TempDisplay(id, temp, displayUnits) {
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

    temp.watch(updateTemp.bind(self));
    displayUnits.watch(updateUnits.bind(self));
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
        value = (value - 32) * 5 / 9;
      }
      return value.toFixed(1);
    } else {
      return "--.-";
    }
  }
}

/* exported DisplayUnits */
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

/* exported Station */
function Station(id, selectedStation, stations) {
  var self;
  create();
  return self;

  function create() {
    var element = document.getElementById(id);
    if (!element) {
      throw new Error("expected to find " + id);
    }

    element.innerHTML =
      "<select id=\"choose-station-v2\" name=\"station\"></select>" +
      "<a id=\"station-link-v2\" class=\"station-link\" href=\"#\"></a>" +
      "<p id=\"station-error-v2\" class=\"station-error no-error\"></p>";

    self = {
      selectedStation: selectedStation,
      stations: stations,
      element: element,
      selectElement: element.children[0]
    };

    setInitialStation.bind(self)();

    stations.watch(stationsUpdated.bind(self));
  }

  function setInitialStation() {
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
}
