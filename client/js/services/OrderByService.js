app.service('OrderByService', function() {
  //ascendant or descendant
  var direction;
  //order by this criterion
  var order_criterion;

  this.getResults = function(criteria, actions, selected_criterion) {
    order_criterion = selected_criterion;

    for(criterion in criteria) {
      if(criteria[criterion]['name'] == selected_criterion) {
        direction = criteria[criterion]['direction'];
      }
    }

    //make a copy of actions
    var results = (JSON.parse(JSON.stringify(actions)));

    //sort the new object by
    results.sort(compareActions);

    return results
  }

  function compareActions(a, b) {
    if(direction == 'Ascendant') {
      if(a[order_criterion] < b[order_criterion])
        return -1;
      if(a[order_criterion] > b[order_criterion])
        return 1;
      return 0;
    }
    else {
      if(a[order_criterion] < b[order_criterion])
        return 1;
      if(a[order_criterion] > b[order_criterion])
        return -1;
      return 0;
    }
  }
});
