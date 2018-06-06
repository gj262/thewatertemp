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
    if (this.temp.get().value !== before.value) {
      this.valueElement.innerHTML = getValueForDisplay(this.temp, this.displayUnits);
    }
    if (this.temp.get().caption !== before.caption) {
      this.captionElement.innerHTML = this.temp.get().caption || "--";
    }
  }

  function updateUnits(before) {
    if (this.displayUnits.get() !== before) {
      this.unitsElement.classList.remove("us");
      this.unitsElement.classList.remove("metric");
      this.unitsElement.classList.add(this.displayUnits.get());
      this.valueElement.innerHTML = getValueForDisplay(this.temp, this.displayUnits);
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
