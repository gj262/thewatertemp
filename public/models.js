/* exported Model */
function Model(initialValue) {
  var model = { id: 0, watchers: [], value: initialValue };

  model.watch = function(toInvoke) {
    model.watchers.push({ id: ++model.id, toInvoke: toInvoke });
    return model.id;
  };

  model.remove = function(id) {
    model.watchers = model.watchers.filter(function(watcher) {
      return watcher.id !== id;
    });
    return model.id;
  };

  model.change = function(payload) {
    var before = model.value;
    model.value = payload;
    model.watchers.forEach(function(watcher) {
      watcher.toInvoke(before);
    });
  };

  model.get = function() {
    return model.value;
  };

  return model;
}
