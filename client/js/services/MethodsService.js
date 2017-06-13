app.service('MethodsService', function() {

  var methods = ['CAT-SD', 'Inquiry', 'OrderBy', 'Sort', 'SRF'];

  this.getMethods = function() {
    return methods;
  }

});
