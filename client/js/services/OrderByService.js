app.service('OrderByService', function() {
  //ascendant or descendant
  var direction;
  //order by this criterion
  var order_criterion;

  this.getResults = function(criteria, actions) {
    //find the criterion to order by and corresponding direction
    for(criterion in criteria)
      if(criteria[criterion]['selected'] == 'true') {
        order_criterion = criteria[criterion]['name'];
        direction = criteria[criterion]['direction'];
      }

    //make a copy of actions
    var results = angular.copy(actions);

    //if the selected criterion is of type number, then transform all its values to numbers
    for(criterion in criteria)
      if(criteria[criterion]['name'] == order_criterion && criteria[criterion]['type'] == 'Number')
        for(result in results)
          results[result][criteria[criterion]['name']] = Number(results[result][criteria[criterion]['name']]);

    //sort the new object by
    results.sort(compareActions);

    return results;
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
