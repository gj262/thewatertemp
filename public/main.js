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
    var sevenDayComparison = {
      title: "For the last seven days",
      name: "last-7-days",
      series: [],
      Controller: Controller.SevenDayComparison
    };
    var thisDayInPriorYearsComparison = {
      title: "This day in prior years",
      name: "day-in-prior-years",
      series: [],
      Controller: Controller.ThisDayInPriorYears
    };
    var comparisons = [sevenDayComparison, thisDayInPriorYearsComparison];
    var selectedComparison = Model(
      comparisons.find(function(comparison) {
        return comparison.name === localStorage.getItem("comparisonName");
      }) || comparisons[0]
    );

    var displayUnitsController = Controller.DisplayUnits(displayUnits);
    Controller.LatestTemp(latestTemp, selectedStation, stationError);
    Controller.TwentyFourHourRange(twentyFourHourRange, selectedStation);
    Controller.Stations(stations);
    var selectedStationController = Controller.SelectedStation(selectedStation);
    var selectedComparisonController = Controller.SelectedComparison(selectedComparison, selectedStation);

    View.Station("station", selectedStation, stationError, stations, selectedStationController.onChange);
    View.DisplayUnits("choose-unit", displayUnitsController.onChange);
    View.Temperature("latest-temp", latestTemp, displayUnits);
    View.Range("24-hours", twentyFourHourRange, displayUnits);
    View.ChooseComparison("choose-comparison", selectedComparison, comparisons, selectedComparisonController.onChange);
    View.Comparison("comparison", selectedComparison, displayUnits);
  });
})();
