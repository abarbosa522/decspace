app.service('CATSDService', function($http) {

  //input data
  var criteria, interaction_effects, actions, categories;

  //criteria pairs of mutual interaction effects
  var mutualSet = [], antagonisticSet = [];

  this.getResults = function(crt, inter_eff, acts, cats) {
    criteria = crt;
    interaction_effects = inter_eff;
    actions = acts;
    categories = cats;

    interactionEffectsSets();

    if(!nonNegativityCondition()) {
      return false;
    }
  }

  //set M (mutual effect) and set O (antagonistic)
  function interactionEffectsSets() {
    for(effect in interaction_effects) {
      if(interaction_effects[effect]['type'] == 'Mutual-Strengthening Effect' || interaction_effects[effect]['type'] == 'Mutual-Weakening Effect') {
        mutualSet.push(interaction_effects[effect]);
      }
      else {
        antagonisticSet.push(interaction_effects[effect]);
      }
    }
  }

  //guarantee that the weights of the criteria never become negative after considering the interaction effects
  function nonNegativityCondition() {
    for(criterion in criteria) {
      for(category in categories) {
        var name = criteria[criterion]['name'];

        var kij = categories[category][name];

        var kjl = 0;
        for(pair in mutualSet) {
          if(mutualSet[pair]['criterion1'] == name || mutualSet[pair]['criterion2'] == name) {
            if(mutualSet[pair]['value'] < 0)
              kjl += Math.abs(mutualSet[pair]['value']);
          }
        }

        var kjp = 0;
        for(pair2 in antagonisticSet) {
          if(antagonisticSet[pair2]['criterion1'] == name) {
            kjp += Math.abs(antagonisticSet[pair2]['value']);
          }
        }

        if((kij - kjl - kjp) < 0)
          return false;
      }
    }
    return true;
  }

  function applyCriterionFunction(criterion, action, reference_action) {
    //arguments used in the functions
    var x = action[criterion['name']];
    var y = reference_action[criterion['name']];

    //different counter duo to http asynchronous calls
    var branch_counter = 0;

    for(branch in criterion['branches']) {
      var expr = {};
      expr.x = x;
      expr.y = y;
      expr.function = criterion['branches'][branch]['condition'];

      if((expr.function.indexOf('=') != -1) && (expr.function.indexOf('<=') == -1) && (expr.function.indexOf('=>') == -1) && (expr.function.indexOf('!=') == -1)) {
        var a = criterion['branches'][branch]['condition'];
        var b = '=';
        var position = criterion['branches'][branch]['condition'].indexOf('=');
        expr.function = [a.slice(0, position), b, a.slice(position)].join('');
      }
      //console.log(expr);
      $http.post('/expr-eval', expr).success(function(res) {
        if(res) {
          var new_expr = {};
          new_expr.x = x;
          new_expr.y = y;
          new_expr.function = criterion['branches'][branch_counter]['function'];
          $http.post('/expr-eval', new_expr).success(function(res2) {
            return res2;
          });
        }
        branch_counter++;
      });
    }
  }

  //when fj(gj(a)) is non-negative, similarity coefficient is sj(a,b)
  function sj(criterion, action, reference_action) {
    var result = applyCriterionFunction(criterion, action, reference_action);

    if(result >= 0)
      return result
    else
      return 0;
  }

  //when fj(gj(a)) is non-negative, similarity coefficient is dj(a,b)
  function dj(criterion, action, reference_action) {
    var result = applyCriterionFunction(criterion, action, reference_action);

    if(result <= 0)
      return result
    else
      return 0;
  }

  //z : [0,1]*[0,1]->[0,1] is a real-valued function
  function z(x, y) {
    return x * y;
  }

  function k(action, reference_action, category) {
    var result = 0;
    for(criterion in criteria)
      result += categories[category][criterion['name']];

    for(pair in mutualSet) {
      var s1 = sj(mutualSet[pair]['criterion1'], action, reference_action);
      var s2 = sj(mutualSet[pair]['criterion2'], action, reference_action);
      result += z(s1, s2) * mutualSet[pair]['value'];
    }

    for(pair2 in antagonisticSet) {
      var s3 = sj(antagonisticSet[pair2]['criterion1'], action, reference_action);
      var s4 = sj(antagonisticSet[pair2]['criterion2'], reference_action, action);
      result += z(s3, s4) * antagonisticSet[pair2]['value'];
    }

    return result;
  }

  function s(action, reference_action, category) {
    var result = 0;
    for(criterion in criteria)
      result += categories[category][criterion['name']] * sj(criterion, action, reference_action);

    for(pair in mutualSet) {
      var s1 = sj(mutualSet[pair]['criterion1'], action, reference_action);
      var s2 = sj(mutualSet[pair]['criterion2'], action, reference_action);
      result += z(s1, s2) * mutualSet[pair]['value'];
    }

    for(pair2 in antagonisticSet) {
      var s3 = sj(antagonisticSet[pair2]['criterion1'], action, reference_action);
      var s4 = sj(antagonisticSet[pair2]['criterion2'], reference_action, action);
      result += z(s3, s4) * mutualSet[pair]['value'];
    }

    return result/k(action, reference_action, category);
  }

  function dPlus(action, reference_action, category) {
    var result = 0;
    for(criterion in criteria) {
      
    }
  }
});
