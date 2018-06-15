/* global Model, View */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    View.Temperature("a-temp", Model({ value: 66.6, caption: "A Temp" }), Model("us"));
    View.Temperature("a-null-temp", Model({}), Model("us"));
    View.Temperature("a-loading-temp", Model({ loading: true }), Model("us"));
  });
})();
