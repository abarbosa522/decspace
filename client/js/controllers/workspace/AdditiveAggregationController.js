app.controller('AdditiveAggregationController', function($scope) {

  /*** DATA INPUT FUNCTIONS ***/

  //add a new criterion
  $scope.addAdditiveAggregationCriterion = function() {
    var can_add_criterion = true;

    //if a name has not been assigned to the new criterion - add error class
    if($scope.new_additiveaggregation_criterion.name == undefined || $scope.new_additiveaggregation_criterion.name == '') {
      $('#new-additiveaggregation-criterion-name').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-additiveaggregation-criterion-name').removeClass('has-error');

    //if a weight has not been assigned to the new criterion - add error class
    if($scope.new_additiveaggregation_criterion.weight == undefined || $scope.new_additiveaggregation_criterion.weight == '') {
      $('#new-additiveaggregation-criterion-weight').addClass('has-error');
      can_add_criterion = false;
    }
    else
      $('#new-additiveaggregation-criterion-weight').removeClass('has-error');



    //check if the new criterion can be added, i.e. no error class was added
    if(can_add_criterion) {
      //assign an unique id to the new criterion
      if($scope.currentModule.input.criteria.length == 0)
        $scope.new_additiveaggregation_criterion.id = 1;
      else
        $scope.new_additiveaggregation_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1].id + 1;


      //add the new criterion to the criteria
      $scope.currentModule.input.criteria.push(angular.copy($scope.new_additiveaggregation_criterion));

      //reset the criterion input fields
      $scope.new_additiveaggregation_criterion.name = '';
      $scope.new_additiveaggregation_criterion.weight = '';

      //remove all error classes - just be sure
      $('#new-additiveaggregation-criterion-name').removeClass('has-error');
      $('#new-additiveaggregation-criterion-weight').removeClass('has-error');
    }
  }

  $scope.blurAdditiveAggregationCriterionName = function(criterion) {
    if(criterion.name == '')
      $('#additiveaggregation-criterion-' + criterion.id + '-name').addClass('has-error');
    else
      $('#additiveaggregation-criterion-' + criterion.id + '-name').removeClass('has-error');
  }

  
  //copy a criterion
  $scope.copyAdditiveAggregationCriterion = function(criterion) {
    //make a copy of the selected criterion
    var new_criterion = angular.copy(criterion);
    //give it a new id
    new_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1].id + 1;
    //insert the new criterion into the criteria array
    $scope.currentModule.input.criteria.push(new_criterion);
  }
  
  //add a new option
  $scope.addAdditiveAggregationOption = function() {
    var can_add_option = true;

    //if a name has not been assigned to the new option - add error class
    if($scope.new_additiveaggregation_option.name == undefined || $scope.new_additiveaggregation_option.name == '') {
      $('#new-additiveaggregation-option-name').addClass('has-error');
      can_add_option = false;
    }
    else
      $('#new-additiveaggregation-option-name').removeClass('has-error');

    //if a criterion value has not been assigned to the new option - add error class
    for(criterion in $scope.currentModule.input.criteria) {
      if($scope.new_additiveaggregation_option[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_additiveaggregation_option[$scope.currentModule.input.criteria[criterion]['name']] == "") {
        $('#new-additiveaggregation-option-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        can_add_option = false;
      }
      else
        $('#new-additiveaggregation-option-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }

    if(can_add_option) {
      if($scope.currentModule.input.options.length == 0)
        $scope.new_additiveaggregation_option.id = 1;
      else
        $scope.new_additiveaggregation_option.id = $scope.currentModule.input.options[$scope.currentModule.input.options.length - 1]['id'] + 1;

      $scope.currentModule.input.options.push(angular.copy($scope.new_additiveaggregation_option));

      //reset the new option input fields and remove the error classes - just in case
      $scope.new_additiveaggregation_option.name = '';
      $('#new-additiveaggregation-option-name').removeClass('has-error');

      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_additiveaggregation_option[$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-additiveaggregation-option-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurAdditiveAggregationOptionName = function(option) {
    if(option.name == '')
      $('#additiveaggregation-option-' + option.id + '-name').addClass('has-error');
    else
      $('#additiveaggregation-option-' + option.id + '-name').removeClasss('has-error');
  }

  $scope.bluradditiveaggregationOptionCriterion = function(option, criterion) {
    if(option[criterion.name] == '')
      $('#additiveaggregation-option-' + option.id + '-criterion-' + criterion.id).addClass('has-error');
    else
      $('#additiveaggregation-option-' + option.id + '-criterion-' + criterion.id).removeClass('has-error');
  }
  
  //copy an option
  $scope.copyAdditiveAggregationOption = function(option) {
    //make a copy of the selected option
    var new_option = angular.copy(option);
    //give it a new id
    new_option.id = $scope.currentModule.input.options[$scope.currentModule.input.options.length - 1].id + 1;
    //insert the new option into the options array
    $scope.currentModule.input.options.push(new_option);
  }
});
