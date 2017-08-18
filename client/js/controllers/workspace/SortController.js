app.controller('SortController', function($scope) {

  /*** DATA INPUT FUNCTIONS ***/

  $scope.addSortObject = function() {
    //if a name has not been assigned to the new object - add error class
    if($scope.new_object.name == undefined || $scope.new_object.name == '')
      $('#new-sort-object-name').addClass('has-error');
    else {
      $('#new-sort-object-name').removeClass('has-error');

      if($scope.currentModule.input.objects.length == 0)
        $scope.new_object.id = 1;
      else
        $scope.new_object.id = $scope.currentModule.input.objects[$scope.currentModule.input.objects.length - 1]['id'] + 1;

      $scope.currentModule.input.objects.push(angular.copy($scope.new_object));

      //reset the new object input field and remove the error class - just in case
      $scope.new_object.name = '';
      $('#new-sort-object-name').removeClass('has-error');
    }
  }

  $scope.blurSortObjectName = function(object) {
    if(object.name == '')
      $('#sort-object-' + object.id).addClass('has-error');
    else
      $('#sort-object-' + object.id).removeClass('has-error');
  }
  
  $scope.copySortObject = function(object) {
    //make a copy of the selected object
    var new_object = angular.copy(object);
    //give it a new id
    new_object.id = $scope.currentModule.input.objects[$scope.currentModule.input.objects.length - 1].id + 1;
    //insert the new object into the objects array
    $scope.currentModule.input.objects.push(new_object);
  }
  
  $scope.onDropComplete = function(index, obj, evt) {
    var otherObj = $scope.currentModule.input.objects[index];
    var otherIndex = $scope.currentModule.input.objects.indexOf(obj);
    $scope.currentModule.input.objects[index] = obj;
    $scope.currentModule.input.objects[otherIndex] = otherObj;
  }
});
