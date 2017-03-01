var app = angular.module('decspace', []);

//MathJax Directive
app.directive('mathJaxBind', function() {
  var refresh = function(element) {
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
  };
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.mathJaxBind, function(newValue, oldValue) {
        if(typeof newValue == 'undefined') {
          element.text('``');
        }
        else {
          element.text('`' + newValue + '`');
        }
        refresh(element[0]);
      });
    }
  };
});
