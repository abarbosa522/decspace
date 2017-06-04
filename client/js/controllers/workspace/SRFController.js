app.controller('SRFController', function($scope) {
  
  //white card available to be dragged
  $scope.white_card = {
    'white_card' : true,
    'id' : 0
  };

  /*** DATA INPUT FUNCTIONS ***/

  //add a new criterion
  $scope.addSRFCriterion = function() {
    //if there is an input field not assigned
    if($scope.new_srf_criterion.name == undefined || $scope.new_srf_criterion.name == '') {
      $('#new-srf-criterion-name').addClass('has-error');
    }
    else {
      //assign an unique id to the new criterion
      if($scope.currentModule.input.criteria.length == 0)
        $scope.new_srf_criterion.id = 1;
      else
        $scope.new_srf_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1]['id'] + 1;

      //criterion starts unassigned to any rank
      $scope.new_srf_criterion.position = -1;

      //add the new criterion to the
      $scope.currentModule.input.criteria.push(angular.copy($scope.new_srf_criterion));

      //reset the criterion input fields
      $scope.new_srf_criterion.name = '';

      //remove all error classes - just be sure
      $('#new-srf-criterion-name').removeClass('has-error');
    }
  }

  $scope.blurSRFCriterionName = function(criterion) {
    if(criterion.name == '')
      $('#srf-criterion-' + criterion.id + '-name').addClass('has-error');
    else
      $('#srf-criterion-' + criterion.id + '-name').removeClass('has-error');
  }

  $scope.blurSRFRatioZ = function() {
    if($scope.currentModule.input['ratio z'] == '' || $scope.currentModule.input['ratio z'] == undefined || $scope.currentModule.input['ratio z'] < 1)
      $('#srf-ratio-z').addClass('has-error');
    else
      $('#srf-ratio-z').removeClass('has-error');
  }

  $scope.blurSRFDecimalPlaces = function() {
    if($scope.currentModule.input['decimal places'] == undefined || $scope.currentModule.input['decimal places'] == '')
      $('#srf-decimal-places').addClass('has-error');
    else
      $('#srf-decimal-places').removeClass('has-error');
  }

  $scope.blurSRFWeightType = function() {
    if($scope.currentModule.input['weight type'] == undefined || $scope.currentModule.input['weight type'] == '')
      $('#srf-weight-type').addClass('has-error');
    else
      $('#srf-weight-type').removeClass('has-error');
  }

  /*** DRAG AND DROP FUNCTIONS ***/

  //change a card's ranking position
  $scope.rankingDrop = function(data, index) {
    //if the white card on the original drop was dragged
    if(data['white_card'] && data['id'] == 0 && noCriteriaCards(index)) {
      var new_white_card = {
        'position' : index,
        'id' : $scope.currentModule.input["white cards"].length + 1,
        'white_card' : true
      };

      $scope.$apply($scope.currentModule.input["white cards"].push(new_white_card));
    }
    //if a criteria card was dragged
    else if((data['white_card'] == undefined && noWhiteCards(index)) || (data['white_card'] && noCriteriaCards(index)))
      data['position'] = index;
  }

  //put a criteria card back into the original drop
  $scope.originalCriteriaDrop = function(data) {
    if(data['white_card'] == undefined)
      data['position'] = -1;
  }

  //put a white card back into the original drop
  $scope.originalWhiteDrop = function(data) {
    if(data['white_card'] && data['id'] != 0) {
      data['position'] = -1;
      $scope.$apply($scope.currentModule.input["white cards"]);
    }
  }

  //check if there are any white cards in the index ranking
  function noCriteriaCards(index) {
    for(criterion in $scope.currentModule.input.criteria)
      if($scope.currentModule.input.criteria[criterion]['position'] == index)
        return false;

    return true;
  }

  //check if there are any criteria cards in the index ranking
  function noWhiteCards(index) {
    for(white in $scope.currentModule.input["white cards"])
      if($scope.currentModule.input["white cards"][white]['position'] == index)
        return false;

    return true;
  }

  //create an array the size of $scope.ranking so that it can be used by ng-repeat
  $scope.rangeRepeater = function(count) {
    return new Array(count);
  };

  //increment the number of rankings
  $scope.addRanking = function(index) {
    for(criterion in $scope.currentModule.input.criteria)
      if($scope.currentModule.input.criteria[criterion]['position'] > index)
        $scope.currentModule.input.criteria[criterion]['position']++;

    for(white_card in $scope.currentModule.input["white cards"])
      if($scope.currentModule.input["white cards"][white_card]['position'] > index)
        $scope.currentModule.input["white cards"][white_card]['position']++;

    $scope.currentModule.input.ranking++;
  }

  $scope.removeRanking = function(index) {
    //don't allow less than 2 rankings
    if($scope.currentModule.input.ranking > 2) {

      for(criterion in $scope.currentModule.input.criteria) {
        if($scope.currentModule.input.criteria[criterion]['position'] > index)
          $scope.currentModule.input.criteria[criterion]['position']--;
        else if($scope.currentModule.input.criteria[criterion]['position'] == index)
          $scope.currentModule.input.criteria[criterion]['position'] = -1;
      }

      for(white_card in $scope.currentModule.input["white cards"]) {
        if($scope.currentModule.input["white cards"][white_card]['position'] > index)
          $scope.currentModule.input["white cards"][white_card]['position']--;
        else if($scope.currentModule.input["white cards"][white_card]['position'] == index)
          $scope.currentModule.input["white cards"][white_card]['position'] = -1;
      }

      $scope.currentModule.input.ranking--;
    }
  }
});
