/* global Model, Controller, View */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var latestTemp = Model({});
    var twentyFourHourRange = Model({});
    var selectedStation = Model({});
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

    var selectedStationController = Controller.SelectedStation(selectedStation);
    var displayUnitsController = Controller.DisplayUnits(displayUnits);
    Controller.LatestTemp(latestTemp, selectedStation, stationError);
    Controller.TwentyFourHourRange(twentyFourHourRange, selectedStation);
    Controller.Stations(stations);
    var selectedComparisonController = Controller.SelectedComparison(selectedComparison, selectedStation);

    View.Menu("menu-toggle", "menu");
    View.ChooseStation("choose-station", selectedStation, stations, selectedStationController.onChange);
    View.StationHomeLink("station-home-link", selectedStation);
    View.StationError("station-error", stationError);
    View.DisplayUnits("choose-unit", displayUnitsController.onChange);
    View.Temperature("latest-temp", latestTemp, displayUnits);
    View.Range("24-hours", twentyFourHourRange, displayUnits);
    View.ChooseComparison("choose-comparison", selectedComparison, comparisons, selectedComparisonController.onChange);
    View.Comparison("comparison", selectedComparison, displayUnits);
  });
})();
