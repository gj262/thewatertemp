/* global Model, 
          LatestTempController, TwentyFourHourRangeController, DisplayUnitsController, 
            StationsController, SelectedStationController, SevenDayComparisonController,
            ThisDayInPriorYearsController,
          Station, DisplayUnits, TempDisplay, RangeDisplay, ComparisonDisplay  */
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
    var sevenDayComparison = Model({ title: "For the last seven days", series: [] });
    var thisDayInPriorYearsComparison = Model({ title: "This day in prior years", series: [] });

    var displayUnitsController = DisplayUnitsController(displayUnits);
    LatestTempController(latestTemp, selectedStation, stationError);
    TwentyFourHourRangeController(twentyFourHourRange, selectedStation);
    StationsController(stations);
    var selectedStationController = SelectedStationController(selectedStation);
    SevenDayComparisonController(sevenDayComparison, selectedStation);
    ThisDayInPriorYearsController(thisDayInPriorYearsComparison, selectedStation);

    Station("station", selectedStation, stationError, stations, selectedStationController.onChange);
    DisplayUnits("choose-unit", displayUnitsController.onChange);
    TempDisplay("latest-temp", latestTemp, displayUnits);
    RangeDisplay("24-hours", twentyFourHourRange, displayUnits);
    ComparisonDisplay("comparison", thisDayInPriorYearsComparison, displayUnits);
  });
})();
