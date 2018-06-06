/* global Model, LatestTempController, TempDisplay */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var latestTemp = Model({});
    var selectedStation = Model({
      id: localStorage.getItem("stationId") || "9414290",
      name: localStorage.getItem("stationName") || "San Francisco, CA"
    });

    LatestTempController(latestTemp, selectedStation);

    TempDisplay("latest-temp-v2", latestTemp);
  });
})();
