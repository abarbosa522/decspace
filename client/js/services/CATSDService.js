app.service('CATSDService', function($http, $q) {
  //input data
  var criteria, interaction_effects, actions, categories;

  //criteria pairs of mutual interaction effects
  var mutualSet = [], antagonisticSet = [];

  //assigned actions and corresponding categories
  var assignedActions = {};

  //similarity array
  var similarityValues = [];

  this.getResults = function(crt, inter_eff, acts, cats) {
    var deferred = $q.defer();

    //initialize data variables
    criteria = angular.copy(crt);
    interaction_effects = angular.copy(inter_eff);
    actions = angular.copy(acts);
    categories = angular.copy(cats);

    //reset the set variables
    mutualSet = [];
    antagonisticSet = [];
    assignedActions = {};
    similarityValues = [];

    for(category in categories) {
      assignedActions[categories[category]['name']] = [];
    }
    assignedActions['Cq+1'] = [];

    //invert the values of criteria to minimize
    minimizeCriteria();

    //calculate the sets of the interaction effects
    interactionEffectsSets();

    if(!nonNegativityCondition()) {
      deferred.resolve(false);
    }

    var result = applyCriterionFunction();

    result.then(function(resolve) {
      similarityValues = resolve;
      //console.log(similarityValues);
      assignActions();

      deferred.resolve(assignedActions);
    });

    return deferred.promise;
  }

  function minimizeCriteria() {
    for(criterion in criteria) {
      if(criteria[criterion]['direction'] == 'Minimize') {
        for(action in actions)
          actions[action][criteria[criterion]['name']] = - actions[action][criteria[criterion]['name']];

        for(category in categories) {
          for(reference_action in categories[category]['reference_actions']) {
            categories[category]['reference_actions'][reference_action][criteria[criterion]['name']] = - categories[category]['reference_actions'][reference_action][criteria[criterion]['name']];
          }
        }
      }
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

  function applyCriterionFunction() {
    var deferred = $q.defer();

    $http.get('/expr-eval', {params: {'criteria':criteria, 'actions':actions, 'categories':categories, 'antagonisticSet':[antagonisticSet]}}).success(function(res) {
      deferred.resolve(res);
    });

    return deferred.promise;
  }

  //when fj(gj(a)) is non-negative, similarity coefficient is sj(a,b)
  function sj(criterion, action, reference_action) {
    var result;

    for(item in similarityValues) {
      if(similarityValues[item]['criterion'] == criterion && similarityValues[item]['action'] == action && similarityValues[item]['reference_action'] == reference_action) {
        result = similarityValues[item]['result'];
        //console.log('here');
        break;
      }
    }

    if(result < 0)
      result = 0;

    /*console.log(criterion, action, reference_action);
    console.log(result);*/

    return result;
  }

  //when fj(gj(a)) is non-negative, similarity coefficient is dj(a,b)
  function dj(criterion, action, reference_action) {
    var result;

    for(item in similarityValues) {
      if(similarityValues[item]['criterion'] == criterion && similarityValues[item]['action'] == action && similarityValues[item]['reference_action'] == reference_action) {
        result = similarityValues[item]['result'];
        break;
      }
    }
    /*console.log(criterion, action, reference_action);
    console.log(result);*/
    if(result > 0)
      result = 0;

    return result;
  }

  //z : [0,1]*[0,1]->[0,1] is a real-valued function
  function z(x, y) {
    return x * y;
  }

  function k(action, reference_action, category) {
    var result = 0;

    var kj = 0;
    for(criterion in criteria) {
      kj += category[criteria[criterion]['name']];
    }

    var kij = 0;
    for(pair in mutualSet) {
      //console.log(action['name']);
      var s1 = sj(mutualSet[pair]['criterion1'], action['name'], reference_action['name']);
      var s2 = sj(mutualSet[pair]['criterion2'], action['name'], reference_action['name']);
      kij += z(s1, s2) * mutualSet[pair]['value'];
    }

    var kih = 0;
    for(pair2 in antagonisticSet) {
      //console.log(antagonisticSet[pair2]['criterion2']);
      var s3 = sj(antagonisticSet[pair2]['criterion1'], action['name'], reference_action['name']);
      //console.log('s3: ' + s3);
      var s4 = sj(antagonisticSet[pair2]['criterion2'], reference_action['name'], action['name']);
      /*console.log('s4: ' + s4);
      console.log('k: ' + antagonisticSet[pair2]['value'])
      console.log(action[antagonisticSet[pair2]['criterion2']]  > reference_action[antagonisticSet[pair2]['criterion2']])*/
      kih += z(s3, s4) * antagonisticSet[pair2]['value'];
    }

    /*console.log(action['name'] + ' ' + reference_action['name']);
    console.log(result);*/
    /*console.log(action['name'], reference_action['name']);
    console.log('kj: ' + kj + ', kij: ' + kij + ', kih: ' + kih);*/

    return kj + kij + kih;
  }

  //a non-additive similarity function
  function s(action, reference_action, category) {
    var result = 0;

    for(criterion in criteria)
      result += category[criteria[criterion]['name']] * sj(criteria[criterion]['name'], action['name'], reference_action['name']);

    for(pair in mutualSet) {
      var s1 = sj(mutualSet[pair]['criterion1'], action['name'], reference_action['name']);
      var s2 = sj(mutualSet[pair]['criterion2'], action['name'], reference_action['name']);
      /*console.log('s1 and s2');
      console.log(s1);
      console.log(s2);
      console.log(mutualSet[pair]['value'])*/
      result += z(s1, s2) * mutualSet[pair]['value'];
      //console.log(s1 * s2 * mutualSet[pair]['value']);
    }

    for(pair2 in antagonisticSet) {
      var s3 = sj(antagonisticSet[pair2]['criterion1'], action['name'], reference_action['name']);
      var s4 = sj(antagonisticSet[pair2]['criterion2'], reference_action['name'], action['name']);
      result += z(s3, s4) * mutualSet[pair]['value'];
    }

    var res2 = result/k(action, reference_action, category);
    /*console.log(action['name']);
    console.log(reference_action['name']);
    console.log(res2);*/
    return res2;
  }

  //a non-linear dissimilarity function
  function dPlus(action, reference_action) {
    var result = 1;
    for(criterion in criteria) {
      if(action[criteria[criterion]['name']] > reference_action[criteria[criterion]['name']]) {
        result *= (1 + dj(criteria[criterion]['name'], action['name'], reference_action['name']));
        //console.log(action['name'] + ' ' + reference_action['name'] + ' ' + criteria[criterion]['name']);
        //console.log(action[criteria[criterion]['name']], reference_action[criteria[criterion]['name']]);

        //console.log(dj(criteria[criterion]['name'], action['name'], reference_action['name']));
      }
    }
    /*console.log(action['name'] + ' ' + reference_action['name']);
    console.log(result - 1);*/
    return result - 1;
  }

  function dMinus(action, reference_action) {
    var result = 1;
    for(criterion in criteria) {
      if(reference_action[criteria[criterion]['name']] > action[criteria[criterion]['name']]) {
        result *= (1 + dj(criteria[criterion]['name'], action['name'], reference_action['name']));
      }
    }
    /*console.log(action['name'] + ' ' + reference_action['name']);
    console.log(result - 1);*/
    return result - 1;
  }

  //a multiplicative comprehensive similarity function
  function delta(action, reference_action, category) {
    /*console.log(action['name'] + ' ' + reference_action['name'] + ' ' + category['name']);
    console.log(s(action, reference_action, category));*/
    return s(action, reference_action, category) * (1 - dPlus(action, reference_action)) * (1 - dMinus(action, reference_action));
  }

  function deltaMax(action, category) {
    var result;
    for(reference_action in category['reference_actions']) {
      var res = delta(action, category['reference_actions'][reference_action], category);
      /*console.log(action['name'] + ' ' + category['reference_actions'][reference_action]['name']);
      console.log(res);*/
      if(Number(reference_action) == 0) {
        result = res;
      }
      else if(res > result) {
        result = res;
      }
    }
    return result;
  }

  //similarity assignment procedure
  function assignActions() {
    for(action in actions) {
      //set K - categories to assign action to
      var k_set = [];
      //compare action with set B of category
      for(category in categories) {
        var result = deltaMax(actions[action], categories[category]);
        /*console.log(actions[action]['name'] + ' ' + categories[category]['name']);
        console.log(result);*/
        if(result >= categories[category]['membership_degree'])
          k_set.push(categories[category]['name']);
      }

      if(k_set.length == 0) {
        assignedActions['Cq+1'].push(actions[action]['name']);
      }
      else {
        for(cat in k_set) {
          assignedActions[k_set[cat]].push(actions[action]['name']);
        }
      }
    }
  }
});
