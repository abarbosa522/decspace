app.service('MethodsService', function() {

  var methods = ['CAT-SD', 'Inquiry', 'OrderBy', 'Sort', 'SRF', 'AdditiveAggregation'];

  this.getMethods = function() {
    return methods;
  }

});
