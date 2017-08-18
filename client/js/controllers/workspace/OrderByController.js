app.controller('OrderByController', function($scope) {

  /*** DATA INPUT FUNCTIONS ***/

  //add a new criterion
  $scope.addOrderByCriterion = function() {
    var can_add_criterion = true;

    //if a name has not been assigned to the new criterion - add error class
    if($scope.new_orderby_criterion.name == undefined || $scope.new_orderby_criterion.name == '') {
      $('#new-orderby-criterion-name').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-orderby-criterion-name').removeClass('has-error');

    //if a type has not been assigned to the new criterion - add error class
    if($scope.new_orderby_criterion.type == undefined || $scope.new_orderby_criterion.type == '') {
      $('#new-orderby-criterion-type').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-orderby-criterion-type').removeClass('has-error');

    //if a direction has not been assigned to the new criterion - add error class
    if($scope.new_orderby_criterion.direction == undefined || $scope.new_orderby_criterion.direction == '') {
      $('#new-orderby-criterion-direction').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-orderby-criterion-direction').removeClass('has-error');

    //check if the new criterion can be added, i.e. no error class was added
    if(can_add_criterion) {
      //assign an unique id to the new criterion
      if($scope.currentModule.input.criteria.length == 0)
        $scope.new_orderby_criterion.id = 1;
      else
        $scope.new_orderby_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1].id + 1;

      //the criterion is not selected by default
      $scope.new_orderby_criterion.selected = 'false';

      //add the new criterion to the criteria
      $scope.currentModule.input.criteria.push(angular.copy($scope.new_orderby_criterion));

      //reset the criterion input fields
      $scope.new_orderby_criterion.name = '';
      $scope.new_orderby_criterion.type = '';
      $scope.new_orderby_criterion.direction = '';

      //remove all error classes - just be sure
      $('#new-orderby-criterion-name').removeClass('has-error');
      $('#new-orderby-criterion-type').removeClass('has-error');
      $('#new-orderby-criterion-direction').removeClass('has-error');
    }
  }

  $scope.blurOrderByCriterionName = function(criterion) {
    if(criterion.name == '')
      $('#orderby-criterion-' + criterion.id + '-name').addClass('has-error');
    else
      $('#orderby-criterion-' + criterion.id + '-name').removeClass('has-error');
  }

  //select the criterion that defines the order
  $scope.selectOrderByCriterion = function(criterion) {
    if($scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)]['selected'] == 'true')
      $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)]['selected'] = 'false';
    else {
      //make sure no other criterion is selected
      for(crit in $scope.currentModule.input.criteria)
        $scope.currentModule.input.criteria[crit]['selected'] = 'false';
      
      //select the clicked criterion
      $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)]['selected'] = 'true';
    }
  }
  
  //copy a criterion
  $scope.copyOrderByCriterion = function(criterion) {
    //make a copy of the selected criterion
    var new_criterion = angular.copy(criterion);
    //give it a new id
    new_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1].id + 1;
    //copied criterion should not be selected, even if the selected criterion is selected
    new_criterion.selected = 'false';
    //insert the new criterion into the criteria array
    $scope.currentModule.input.criteria.push(new_criterion);
  }
  
  //add a new action
  $scope.addOrderByAction = function() {
    var can_add_action = true;

    //if a name has not been assigned to the new action - add error class
    if($scope.new_orderby_action.name == undefined || $scope.new_orderby_action.name == '') {
      $('#new-orderby-action-name').addClass('has-error');
      can_add_action = false;
    }
    else
      $('#new-orderby-action-name').removeClass('has-error');

    //if a criterion value has not been assigned to the new action - add error class
    for(criterion in $scope.currentModule.input.criteria) {
      if($scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] == "") {
        $('#new-orderby-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        can_add_action = false;
      }
      else
        $('#new-orderby-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }

    if(can_add_action) {
      if($scope.currentModule.input.actions.length == 0)
        $scope.new_orderby_action.id = 1;
      else
        $scope.new_orderby_action.id = $scope.currentModule.input.actions[$scope.currentModule.input.actions.length - 1]['id'] + 1;

      $scope.currentModule.input.actions.push(angular.copy($scope.new_orderby_action));

      //reset the new action input fields and remove the error classes - just in case
      $scope.new_orderby_action.name = '';
      $('#new-orderby-action-name').removeClass('has-error');

      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-orderby-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurOrderByActionName = function(action) {
    if(action.name == '')
      $('#orderby-action-' + action.id + '-name').addClass('has-error');
    else
      $('#orderby-action-' + action.id + '-name').removeClasss('has-error');
  }

  $scope.blurOrderByActionCriterion = function(action, criterion) {
    if(action[criterion.name] == '')
      $('#orderby-action-' + action.id + '-criterion-' + criterion.id).addClass('has-error');
    else
      $('#orderby-action-' + action.id + '-criterion-' + criterion.id).removeClass('has-error');
  }
  
  //copy an action
  $scope.copyOrderByAction = function(action) {
    //make a copy of the selected action
    var new_action = angular.copy(action);
    //give it a new id
    new_action.id = $scope.currentModule.input.actions[$scope.currentModule.input.actions.length - 1].id + 1;
    //insert the new action into the actions array
    $scope.currentModule.input.actions.push(new_action);
  }
});
