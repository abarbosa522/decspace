app.service('MethodsService', function() {

  var methods = ['CAT-SD', 'Delphi', 'OrderBy', 'Sort', 'SRF'];

  this.getMethods = function() {
    return methods;
  }

});
