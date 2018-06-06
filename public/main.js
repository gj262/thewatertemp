/* global Model, 
          LatestTempController, TwentyFourHourRangeController, DisplayUnitsController, 
            StationsController, SelectedStationController, 
          Station, DisplayUnits, TempDisplay, RangeDisplay  */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var latestTemp = Model({});
    var twentyFourHourRange = Model({});
    var selectedStation = Model({
      id: localStorage.getItem("stationId") || "9414290",
      name: localStorage.getItem("stationName") || "San Francisco, CA"
    });
    var displayUnits = Model(localStorage.getItem("units") || "us");
    var stations = Model([]);
    var stationError = Model("");

    var displayUnitsController = DisplayUnitsController(displayUnits);
    LatestTempController(latestTemp, selectedStation, stationError);
    TwentyFourHourRangeController(twentyFourHourRange, selectedStation);
    StationsController(stations);
    var selectedStationController = SelectedStationController(selectedStation);

    Station("station-v2", selectedStation, stationError, stations, selectedStationController.onChange);
    DisplayUnits("choose-unit-v2", displayUnitsController.onChange);
    TempDisplay("latest-temp-v2", latestTemp, displayUnits);
    RangeDisplay("24-hours-v2", twentyFourHourRange, displayUnits);
  });
})();
