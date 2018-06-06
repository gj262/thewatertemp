/* global Model, 
          LatestTempController, DisplayUnitsController, StationsController, SelectedStationController, 
          Station, DisplayUnits, TempDisplay  */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var latestTemp = Model({});
    var selectedStation = Model({
      id: localStorage.getItem("stationId") || "9414290",
      name: localStorage.getItem("stationName") || "San Francisco, CA"
    });
    var displayUnits = Model(localStorage.getItem("units") || "us");
    var stations = Model([]);

    var displayUnitsController = DisplayUnitsController(displayUnits);
    LatestTempController(latestTemp, selectedStation);
    StationsController(stations);
    var selectedStationController = SelectedStationController(selectedStation);

    Station("station-v2", selectedStation, stations, selectedStationController.onChange);
    DisplayUnits("choose-unit-v2", displayUnitsController.onChange);
    TempDisplay("latest-temp-v2", latestTemp, displayUnits);
  });
})();
