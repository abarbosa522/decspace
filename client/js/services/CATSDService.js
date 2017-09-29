app.service('CATSDService', function($http, $q) {
  //input data
  var criteria, scales, functions, actions, categories, interaction_effects, reference_actions;

  //criteria pairs of mutual interaction effects
  var mutualSet = [], antagonisticSet = [];

  //assigned actions and corresponding categories
  var assignedActions = {};

  //similarity array
  var similarityValues = [];

  //all the values of delta max
  var deltaMaxValues = {};
  var deltaValues = {};
  
  //values of per-criterion similarity-dissimilarity functions
  var functionsValues = {};
  
  //similiarity and dissimilarity values
  var sValues = [], dPlusValues = [], dMinusValues = [];
  
  this.getResults = function(mod_data) {
    var deferred = $q.defer();

    //initialize data variables
    criteria = angular.copy(mod_data.criteria);
    scales = angular.copy(mod_data.scales);
    functions = angular.copy(mod_data.functions);
    actions = angular.copy(mod_data.actions);
    categories = angular.copy(mod_data.categories);
    interaction_effects = angular.copy(mod_data['interaction effects']);
    reference_actions = angular.copy(mod_data['reference actions']);

    //reset the set variables
    mutualSet = [];
    antagonisticSet = [];
    assignedActions = {};
    similarityValues = [];

    for(category in categories)
      assignedActions[categories[category]['name']] = [];

    assignedActions['Not Assigned'] = [];

    //construct the delta max object containing all the actions and categories
    for(action in actions) {
      deltaMaxValues[actions[action].name] = {};
      deltaValues[actions[action].name] = {};
    }

    //transform the functions' conditions to string
    conditionsToString();

    //invert the values of criteria to minimize
    minimizeCriteria();

    //calculate the sets of the interaction effects
    interactionEffectsSets();

    if(!nonNegativityCondition())
      deferred.resolve(false);

    var result = applyCriterionFunction().then(function(resolve) {
      similarityValues = resolve;
      
      assignActions();
      
      transformOutput();
   
      deferred.resolve([assignedActions, deltaMaxValues, deltaValues, sValues, dMinusValues, dPlusValues, functionsValues]);
    });

    return deferred.promise;
  }

  function conditionsToString() {
    for(branch in functions)
      if(!isNaN(functions[branch].function))
        functions[branch].function = functions[branch].function.toString();
  }

  function minimizeCriteria() {
    for(criterion in criteria) {
      if(criteria[criterion].direction == 'Minimize') {
        for(action in actions)
          actions[action][criteria[criterion].name] = -actions[action][criteria[criterion].name];
        
        for(ref in reference_actions)
          reference_actions[ref][criteria[criterion].name] = -reference_actions[ref][criteria[criterion].name];
      }
    }
  }

  //set M (mutual effect) and set O (antagonistic)
  function interactionEffectsSets() {
    for(effect in interaction_effects) {
      if(interaction_effects[effect].type == 'Mutual-Strengthening Effect' || interaction_effects[effect].type == 'Mutual-Weakening Effect')
        mutualSet.push(interaction_effects[effect]);
      else
        antagonisticSet.push(interaction_effects[effect]);
    }
  }

  //guarantee that the weights of the criteria never become negative 
  //after considering the interaction effects
  function nonNegativityCondition() {
    for(criterion in criteria) {
      for(category in categories) {
        var crit_name = criteria[criterion].name;
        
        var kij = categories[category][crit_name];

        var kjl = 0;
        for(pair in mutualSet)
          if(categories[category].name == mutualSet[pair].category)
            if(mutualSet[pair].criterion1 == crit_name || mutualSet[pair].criterion2 == crit_name)
              if(mutualSet[pair].value < 0)
                kjl += Math.abs(mutualSet[pair].value);

        var kjp = 0;
        for(pair2 in antagonisticSet)
          if(categories[category].name == antagonisticSet[pair2].category)
            if(antagonisticSet[pair2].criterion1 == name)
              kjp += Math.abs(antagonisticSet[pair2].value);

        if((kij - kjl - kjp) < 0)
          return false;
      }
    }
    return true;
  }

  function applyCriterionFunction() {
    var deferred = $q.defer();

    var post_obj = {};
    post_obj.criteria = criteria;
    post_obj.actions = actions;
    post_obj.categories = categories;
    post_obj.reference_actions = reference_actions;
    post_obj.functions = functions;
    post_obj.antagonisticSet = [antagonisticSet];

    $http.post('/expr-eval', post_obj).then(function(res) {
      deferred.resolve(res.data);
    });

    return deferred.promise;
  }

  //when fj(gj(a)) is non-negative, similarity coefficient is sj(a,b)
  function sj(criterion, action, reference_action) {
    var result;

    for(item in similarityValues) {
      if(similarityValues[item]['criterion'] == criterion && similarityValues[item]['action'] == action && similarityValues[item]['reference_action'] == reference_action) {
        result = similarityValues[item]['result'];
        break;
      }
    }

    if(result < 0 || result == undefined)
      result = 0;

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

    if(result > 0 || result == undefined)
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
      if(category.name == mutualSet[pair].category) {
        var f_value1, f_value2;

        for(item in similarityValues) {
          if(similarityValues[item]['criterion'] == mutualSet[pair]['criterion1'] && similarityValues[item]['action'] == action['name'] && similarityValues[item]['reference_action'] == reference_action['name']) {
            f_value1 = similarityValues[item]['result'];
          }
          else if(similarityValues[item]['criterion'] == mutualSet[pair]['criterion2'] && similarityValues[item]['action'] == action['name'] && similarityValues[item]['reference_action'] == reference_action['name']){
            f_value2 = similarityValues[item]['result'];
          }
        }

        if(f_value1 > 0  && f_value2 > 0) {
          var s1 = sj(mutualSet[pair]['criterion1'], action['name'], reference_action['name']);
          var s2 = sj(mutualSet[pair]['criterion2'], action['name'], reference_action['name']);

          kij += z(s1, s2) * mutualSet[pair]['value'];
        }
      }
    }

    var kih = 0;
    for(pair2 in antagonisticSet) {
      if(category.name == antagonisticSet[pair2].category) {
        var f_value3, f_value4;

        for(item in similarityValues) {
          if(similarityValues[item]['criterion'] == antagonisticSet[pair2]['criterion1'] && similarityValues[item]['action'] == action['name'] && similarityValues[item]['reference_action'] == reference_action['name']) {
            f_value3 = similarityValues[item]['result'];
          }
          else if(similarityValues[item]['criterion'] == antagonisticSet[pair2]['criterion2'] && similarityValues[item]['action'] == action['name'] && similarityValues[item]['reference_action'] == reference_action['name']){
            f_value4 = similarityValues[item]['result'];
          }
        }

        if(f_value3 > 0 && f_value4 < 0) {
          var s3 = sj(antagonisticSet[pair2]['criterion1'], action['name'], reference_action['name']);
          var s4 = dj(antagonisticSet[pair2]['criterion2'], action['name'], reference_action['name']);

          kih += z(s3, s4) * antagonisticSet[pair2]['value'];
        }
      }
    }

    return kj + kij - kih;
  }

  //a non-additive similarity function
  function s(action, reference_action, category) {
    var result = 0;

    for(criterion in criteria)
      result += category[criteria[criterion].name] * sj(criteria[criterion].name, action.name, reference_action.name);

    for(pair in mutualSet) {
      if(category.name == mutualSet[pair].category) {
        var f_value1, f_value2;

        for(item in similarityValues) {
          if(similarityValues[item].criterion == mutualSet[pair].criterion1 && similarityValues[item].action == action.name && similarityValues[item].reference_action == reference_action.name)
            f_value1 = similarityValues[item].result;
          else if(similarityValues[item].criterion == mutualSet[pair].criterion2 && similarityValues[item].action == action.name && similarityValues[item].reference_action == reference_action.name)
            f_value2 = similarityValues[item].result;
        }

        if(f_value1 > 0  && f_value2 > 0) {
          var s1 = sj(mutualSet[pair].criterion1, action.name, reference_action.name);
          var s2 = sj(mutualSet[pair].criterion2, action.name, reference_action.name);

          result += z(s1, s2) * mutualSet[pair].value;
        }
      }
    }

    for(pair2 in antagonisticSet) {
      if(category.name == antagonisticSet[pair2].category) {
        var f_value3, f_value4;

        for(item in similarityValues) {
          if(similarityValues[item]['criterion'] == antagonisticSet[pair2]['criterion1'] && similarityValues[item]['action'] == action['name'] && similarityValues[item]['reference_action'] == reference_action['name'])
            f_value3 = similarityValues[item]['result'];
          else if(similarityValues[item]['criterion'] == antagonisticSet[pair2]['criterion2'] && similarityValues[item]['action'] == action['name'] && similarityValues[item]['reference_action'] == reference_action['name'])
            f_value4 = similarityValues[item]['result'];
        }

        if(f_value3 > 0 && f_value4 < 0) {
          var s3 = sj(antagonisticSet[pair2]['criterion1'], action['name'], reference_action['name']);
          var s4 = dj(antagonisticSet[pair2]['criterion2'], action['name'], reference_action['name']);

          result -= z(s3, s4) * antagonisticSet[pair2]['value'];
        }
      }
    }

    var res2 = result/k(action, reference_action, category);
    
    return res2;
  }

  //a non-linear dissimilarity function
  function dPlus(action, reference_action) {
    var result = 1;
    
    for(criterion in criteria)
      if(action[criteria[criterion].name] > reference_action[criteria[criterion].name])
        result *= (1 + dj(criteria[criterion].name, action.name, reference_action.name));

    return result - 1;
  }

  function dMinus(action, reference_action) {
    var result = 1;
    
    for(criterion in criteria)
      if(reference_action[criteria[criterion].name] > action[criteria[criterion].name])
        result *= (1 + dj(criteria[criterion].name, action.name, reference_action.name));
    
    return result - 1;
  }

  //a multiplicative comprehensive similarity function
  function delta(action, reference_action, category) {
    var s_result = s(action, reference_action, category);
    var dPlus_result = 1 + dPlus(action, reference_action);
    var dMinus_result = 1 + dMinus(action, reference_action);

    var result = s_result * dPlus_result * dMinus_result;

    //create and store an object with the action, reference action and value of the delta function
    deltaValues[action.name][reference_action.name] = result;
    
    sValues.push({
      action : action.name,
      reference_action : reference_action.name,
      value: s_result
    });
    
    dMinusValues.push({
      action : action.name,
      reference_action : reference_action.name,
      value: dMinus_result - 1
    });
    
    dPlusValues.push({
      action : action.name,
      reference_action : reference_action.name,
      value: dPlus_result - 1
    });
    
    return result;
  }

  function deltaMax(action, category) {
    var result = 0;

    for(reference_action in reference_actions) {
      if(reference_actions[reference_action].category == category.name) {
        var res = delta(action, reference_actions[reference_action], category);

        if(res > result)
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

        if(result >= categories[category].membership_degree)
          k_set.push(categories[category].name);

        //create and store an object with the action, category and value of the delta max function
        deltaMaxValues[actions[action].name][categories[category].name] = result;
      }

      //if the action was not assigned to any category, assign it to the "Not Assigned" category
      if(k_set.length == 0)
        assignedActions['Not Assigned'].push(actions[action].name);
      else
        for(cat in k_set)
          assignedActions[k_set[cat]].push(actions[action].name);
    }
  }
  
  //transform output to more convenient format
  function transformOutput() {
    //assigned actions
    var assigned_actions = [];
    
    for(action in actions) {
      var action_obj = {'action' : actions[action].name};
      
      for(category in categories) {
        if(assignedActions[categories[category].name].includes(actions[action].name))
          action_obj[categories[category].name] = true;
        else
          action_obj[categories[category].name] = false;
      }
      
      if(assignedActions['Not Assigned'].includes(actions[action].name))
        action_obj['Not Assigned'] = true;
      else
        action_obj['Not Assigned'] = false;
      
      assigned_actions.push(action_obj);
    }
    
    assignedActions = assigned_actions;
    
    //delta maximum values
    var delta_max_values = [];
    
    for(action in actions) {
      var delta_max_obj = {'action' : actions[action].name};
      
      for(category in categories)
        delta_max_obj[categories[category].name] = deltaMaxValues[actions[action].name][categories[category].name];
      
      delta_max_values.push(delta_max_obj);
    }
    
    deltaMaxValues = delta_max_values;
    
    //delta values
    var delta_values = [];
    
    for(action in actions) {
      var delta_obj = {'action' : actions[action].name};
      
      for(reference_action in reference_actions)
        delta_obj[reference_actions[reference_action].name] = deltaValues[actions[action].name][reference_actions[reference_action].name];
    
      delta_values.push(delta_obj);
    }
    
    deltaValues = delta_values;
    
    //functions values
    var functions_values = [];
    
    for(criterion in criteria) {
      var new_crit_obj = {
        criterion : criteria[criterion].name,
        results : []
      };
      
      for(action in actions) {
        var new_action_obj = {
          action : actions[action].name
        };
        
        for(value in similarityValues)
          if(similarityValues[value].criterion == new_crit_obj.criterion && similarityValues[value].action == actions[action].name)
            new_action_obj[similarityValues[value].reference_action] = similarityValues[value].result;
        
        new_crit_obj.results.push(new_action_obj);
      }
      
      functions_values.push(new_crit_obj);
    }
    
    functionsValues = functions_values;
    
    //similarity values
    var s_values = [];
    
    for(action in actions) {
      var new_action_obj = {
        action : actions[action].name,
      };
      
      for(value in sValues)
        if(sValues[value].action == new_action_obj.action)
          new_action_obj[sValues[value].reference_action] = sValues[value].value;
    
      s_values.push(new_action_obj);
    }
    
    sValues = s_values;
    
    //dMinusValues
    var d_minus_values = [];
    
    for(action in actions) {
      var new_action_obj = {
        action : actions[action].name,
      };
      
      for(value in dMinusValues)
        if(dMinusValues[value].action == new_action_obj.action)
          new_action_obj[dMinusValues[value].reference_action] = dMinusValues[value].value;
    
      d_minus_values.push(new_action_obj);
    }
    
    dMinusValues = d_minus_values;
    
    //dPlusValues
    var d_plus_values = [];
    
    for(action in actions) {
      var new_action_obj = {
        action : actions[action].name,
      };
      
      for(value in dPlusValues)
        if(dPlusValues[value].action == new_action_obj.action)
          new_action_obj[dPlusValues[value].reference_action] = dPlusValues[value].value;
    
      d_plus_values.push(new_action_obj);
    }
    
    dPlusValues = d_plus_values;
  }
});
