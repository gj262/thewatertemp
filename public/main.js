/* global Model, Controller, View */
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

    var displayUnitsController = Controller.DisplayUnits(displayUnits);
    Controller.LatestTemp(latestTemp, selectedStation, stationError);
    Controller.TwentyFourHourRange(twentyFourHourRange, selectedStation);
    Controller.Stations(stations);
    var selectedStationController = Controller.SelectedStation(selectedStation);
    Controller.SevenDayComparison(sevenDayComparison, selectedStation);
    Controller.ThisDayInPriorYears(thisDayInPriorYearsComparison, selectedStation);

    View.Station("station", selectedStation, stationError, stations, selectedStationController.onChange);
    View.DisplayUnits("choose-unit", displayUnitsController.onChange);
    View.Temperature("latest-temp", latestTemp, displayUnits);
    View.Range("24-hours", twentyFourHourRange, displayUnits);
    View.Comparison("comparison", thisDayInPriorYearsComparison, displayUnits);
  });
})();
