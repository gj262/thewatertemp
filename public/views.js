/* exported TempDisplay */
function TempDisplay(id, temp) {
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
      getValueForDisplay(temp) +
      "</span><span class=\"temp-units " +
      "metric" + // fix-v2
      "\"></span><span class=\"temp-caption\">" +
      caption +
      "</span>";
    element.classList.add("temp-display");

    self = {
      temp: temp,
      element: element,
      valueElement: element.children[0],
      unitsElement: element.children[1],
      captionElement: element.children[2]
    };

    temp.watch(update.bind(self));
  }

  function update() {
    this.valueElement.innerHTML = getValueForDisplay(this.temp);
    this.captionElement.innerHTML = this.temp.get().caption || "--";
  }

  function getValueForDisplay(temp) {
    var value = parseFloat(temp.get().value);
    if (value) {
      // if (this.units === "metric") {
      //   value = (value - 32) * 5 / 9;
      // }
      return value.toFixed(1);
    } else {
      return "--.-";
    }
  }
}
