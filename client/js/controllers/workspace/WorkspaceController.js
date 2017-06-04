app.controller('WorkspaceController', function($scope, $window, $http, $compile, $q, OrderByService, CATSDService, DelphiService, SRFService) {
  /*** SETUP FUNCTIONS ***/

  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  //check if there is a user logged in
  function requestLogIn() {
    $http.get('/requestlogin').then(function(res) {
      if(typeof res.data.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.data.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').then(function(response) {
          for(account in response.data) {
            if(response.data[account].email == $scope.username) {
              $scope.name = response.data[account].name;
              break;
            }
          }

        //check if the logged user is unregistered
        if($scope.username.includes('unregistered@decspace.com'))
          $scope.unregistered_user = true;
        else
          $scope.unregistered_user = false;
        });
      }
    });
  }

  //log out current user
  $scope.logOut = function() {
    $http.get('/logout').then(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').then(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response.data[proj]['name'];
          //change the date of the last update of the project
          response.data[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response.data[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response.data[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //retrieve the data stored in the database
          $scope.reloadData(false);
          //update the list of executions
          //getExecutions();
        });
      });
    });
  }

  /*** DRAG AND DROP FUNCTIONS ***/

  // target elements with the "draggable" class
  interact('.draggable')
    .draggable({
      // enable inertial throwing
      inertia: true,
      // keep the element within the area of it's parent
      restrict: {
        restriction: "parent",
        endOnly: true,
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
      },
      // enable autoScroll
      autoScroll: true,

      // call this function on every dragmove event
      onmove: dragMoveListener,
      // call this function on every dragend event
      onend: function (event) {
        var textEl = event.target.querySelector('p');

        textEl && (textEl.textContent =
          'moved a distance of '
          + (Math.sqrt(event.dx * event.dx +
                       event.dy * event.dy)|0) + 'px');
      }
  });

  function dragMoveListener (event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

    //update the position of the connecting lines of the dragged module
    updateConnections(target.attributes.id.value);
  }

  /*** BUTTON BAR FUNCTIONS ***/

  //save the current data
  $scope.saveData = function() {
    $http.get('/projects').then(function(response) {
      //save the position of all modules
      for(mod in modules)
        modules[mod]['position'] = $('#' + modules[mod]['id']).offset();

        var id_doc, proj_res;

        //get the current project
        for(proj in response.data) {
          if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
            //insert the created modules into the database
            response.data[proj]['modules'] = modules;
            //insert the created connections into the database
            response.data[proj]['connections'] = connections;
            //get the id of the document
            id_doc = response.data[proj]['_id'];
            //project to store in the db
            proj_res = response.data[proj];
            delete proj_res['_id'];
            break;
          }
        }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).then(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //show save success alert
          showAlert('save-success');
        });
      });
    });
  }

  //reload last save
  $scope.reloadData = function(alertShowing) {
    $http.get('/projects').then(function(response) {
      //remove current modules
      for(mod in modules)
        $('#' + modules[mod]['id']).remove();
      //reset the modules array
      modules = [];

      //remove all existant connections
      for(connection in connections)
        $('#' + connections[connection]['id']).remove();
      //reset the connections array
      connections = [];

      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          if(response.data[proj]['modules'] != undefined)
            modules = response.data[proj]['modules'];

          if(response.data[proj]['connections'] != undefined)
            connections = response.data[proj]['connections'];

          break;
        }
      }

      //add the modules previously stored in the database
      for(mod in modules)
        reloadModule(modules[mod]);
      //add the connections previously stored in the database
      for(connection in connections)
        reloadConnection(connections[connection]);

      if(alertShowing)
        showAlert('reload-success');
    });
  }

  $scope.importData = function() {
    var input_files = document.getElementById('input-files');

    for(i = 0; i < input_files.files.length; i++) {
      var reader = new FileReader();

      //called when readAsText is performed
      reader.onload = (function(file) {
        var file_extension = file.name.split('.').pop();

        var data = [];

        //imported file is a csv file
        if(file_extension == 'csv') {
          return function(e) {
            var rows = e.target.result.split("\n");

            for(row in rows)
              rows[row] = rows[row].trim();

            var columns = rows[0].split(";");

            //remove whitespaces and empty strings
            for(column in columns)
              columns[column] = columns[column].trim();

            for(i = 1; i < rows.length; i++) {
              var cells = rows[i].split(";");
              var element = {};

              //add the unique id
              element['id'] = i;

              for(var j = 0; j < cells.length; j++) {
                if(cells[j].trim() != '' && columns[j].trim() != '') {
                  if(cells[j].trim() == "''")
                    element[columns[j]] = '';
                  else {
                    if(isNaN(cells[j]))
                      element[columns[j]] = cells[j];
                    else
                      element[columns[j]] = Number(cells[j]);
                  }
                }
              }

              if(!angular.equals(element, {}))
                data.push(element);
            }

            $scope.createInputFileModule(file.name, data);
          };
        }
        //imported file is a json file
        else if(file_extension == 'json') {
          return function(e) {
            var rows = e.target.result.split("\n");

            for(row in rows) {
              var element = JSON.parse(rows[row]);
              element['id'] = Number(row) + 1;
              data.push(element);
            }

            $scope.createInputFileModule(file.name, data);
          }
        }
      })(input_files.files[i]);

      //get the data from the file
      reader.readAsText(input_files.files[i]);
    }
  }

  //hide all alerts
  function hideAlerts() {
    $('#save-success').hide();
    $('#reload-success').hide();
    $('#invalid-connection1').hide();
    $('#invalid-connection2').hide();
    $('#invalid-connection3').hide();
    $('#invalid-connection4').hide();
    $('#execution-success').hide();
    $('#execution-error').hide();
  }

  //show certain alert and hide it smoothly
  function showAlert(alert_id) {
    //show alert
    angular.element(document.querySelector('#' + alert_id)).alert();
    //hide alert
    angular.element(document.querySelector('#' + alert_id)).fadeTo(3000, 500).slideUp(500, function(){
      angular.element(document.querySelector('#' + alert_id)).slideUp(500);
    });
  }

  /*** MODULES FUNCTIONS ***/

  //created modules
  var modules = [];

  //add a new module to "modules" and the corresponding data
  function createModuleData(mod) {
    switch(mod) {
      case 'OrderBy':
        var new_mod = {};
        //generate the unique id
        var unique_id = generateUniqueId(modules);
        //store the module id
        new_mod['id'] = 'orderby-' + unique_id;
        //generate and store module name
        new_mod['name_id'] = generateUniqueNameId('OrderBy');
        //store the module type
        new_mod['type'] = 'OrderBy';
        //initialize the input data array
        new_mod['input'] = {
          'criteria' : [],
          'actions' : []
        };
        //initialize the output data array
        new_mod['output'] = [];
        //store the new module into the modules array
        modules.push(new_mod);
        break;

      case 'Sort':
        var new_mod = {};
        //generate the unique id
        var unique_id = generateUniqueId(modules);
        //store the module id
        new_mod['id'] = 'sort-' + unique_id;
        //generate and store module name
        new_mod['name_id'] = generateUniqueNameId('Sort');
        //store the module type
        new_mod['type'] = 'Sort';
        //initialize the input data array
        new_mod['input'] = {
          'objects' : []
        };
        //initialize the output data array
        new_mod['output'] = [];
        //store the new module into the modules array
        modules.push(new_mod);
        break;

      case 'CAT-SD':
        var new_mod = {};
        //generate the unique id
        var unique_id = generateUniqueId(modules);
        //store the module id
        new_mod['id'] = 'cat-sd-' + unique_id;
        //generate and store module name
        new_mod['name_id'] = generateUniqueNameId('CAT-SD');
        //store the module type
        new_mod['type'] = 'CAT-SD';
        //initialize the input data array
        new_mod['input'] = {
          'criteria' : [],
          'interaction effects' : [],
          'actions' : [],
          'categories' : []
        };
        //initialize the output data array
        new_mod['output'] = [];
        //store the new module into the modules array
        modules.push(new_mod);
        break;

      case 'Delphi':
        var new_mod = {};
        //generate the unique id
        var unique_id = generateUniqueId(modules);
        //store the module id
        new_mod['id'] = 'delphi-' + unique_id;
        //generate and store module name
        new_mod['name_id'] = generateUniqueNameId('Delphi');
        //store the module type
        new_mod['type'] = 'Delphi';
        //initialize the input data array
        new_mod['input'] = {
          'subject' : '',
          'emails' : [],
          'questions' : []
        };
        new_mod['current_round'] = 1;
        //initialize the output data array
        new_mod['output'] = [];
        //store the new module into the modules array
        modules.push(new_mod);
        break;

      case 'SRF':
        var new_mod = {};
        //generate the unique id
        var unique_id = generateUniqueId(modules);
        //store the module id
        new_mod['id'] = 'srf-' + unique_id;
        //generate and store module name
        new_mod['name_id'] = generateUniqueNameId('SRF');
        //store the module type
        new_mod['type'] = 'SRF';
        //initialize the input data array
        new_mod['input'] = {
          'criteria' : [],
          'white cards' : [],
          'ranking' : 2,
          'ratio z' : '',
          'decimal places' : '',
          'weight type': ''
        };
        //initialize the output data array
        new_mod['output'] = [];
        //store the new module into the modules array
        modules.push(new_mod);
        break;
    }
  }

  //add a new input file module and corresponding data
  function createInputFileData(name, data) {
    var new_mod = {};
    //generate the unique id
    var unique_id = generateUniqueId(modules);
    new_mod['id'] = 'inputfile-' + unique_id;

    //store the module type
    new_mod['type'] = 'Input File';
    //store the name of the file
    new_mod['name'] = name;
    //store the imported data
    new_mod['output'] = data;
    //store the new module into the modules array
    modules.push(new_mod);
  }

  //delete a certain module
  $scope.deleteModule = function(event) {
    var mod_id = event.target.parentNode.parentNode.attributes.id.value;

    //remove module from the DOM
    $('#' + mod_id).remove();

    //delete the module's data
    var mod_index;
    for(mod in modules)
      if(modules[mod]['id'] == mod_id) {
        mod_index = mod;
        break;
      }

    modules.splice(mod_index, 1);

    //remove all connections of the removed module
    var connections_ids = [];
    var input_mods = [];

    //identify the connections attached to the deleted module
    for(connection in connections)
      if(connections[connection]['output'] == mod_id || connections[connection]['input'] == mod_id) {
        $('#' + connections[connection]['id']).remove();
        connections_ids.push(connections[connection]['id']);
      }

    //delete the identified connections
    for(id in connections_ids)
      for(connect in connections)
        if(connections[connect]['id'] == connections_ids[id]) {
          deleteConnectionData(connections[connect]);
          break;
        }
  }

  //id of the currently open module
  $scope.currentModule = {};

  //select the current module
  $scope.selectCurrentModule = function(event) {
    var parent_id = event.target.parentNode.id;

    for(mod in modules)
      if(modules[mod]['id'] == parent_id)
        $scope.currentModule = modules[mod];

    //reset the select deletion and "new" variables
    switch($scope.currentModule['type']) {
      case 'OrderBy':
        $scope.new_orderby_criterion = {};
        $scope.new_orderby_action = {};
        $scope.deleteIdCriterion = '';
        $scope.deleteIdAction = '';
        break;

      case 'Sort':
        $scope.new_object = {};
        $scope.deleteIdObject = '';
        break;

      case 'CAT-SD':
        $scope.new_cat_criterion = {};
        $scope.new_interaction_effect = {};

        $scope.new_branch = {};
        for(criterion in $scope.currentModule.input.criteria)
          $scope.new_branch[$scope.currentModule.input.criteria[criterion]['id']] = {};

        $scope.new_cat_action = {};
        $scope.new_category = {};

        $scope.new_reference_action = {};
        for(category in $scope.currentModule.input.categories)
          $scope.new_reference_action[$scope.currentModule.input.categories[category]['id']] = {};

        $scope.deleteIdCriterion = '';
        $scope.deleteIdInteractionEffect = '';
        $scope.deleteIdBranch = '';
        $scope.deleteIdAction = '';
        $scope.deleteIdCategory = '';
        $scope.deleteIdReferenceAction = ['', ''];
        break;

      case 'Delphi':
        $scope.new_delphi_email = {};
        $scope.new_delphi_question = {};
        $scope.deleteIdEmail = '';
        $scope.deleteIdQuestion = '';
        break;

      case 'SRF':
        $scope.new_srf_criterion = {};
        $scope.deleteIdCriterion = '';
        break;
    }

    resetErrorClasses($scope.currentModule['type']);
  }

  //find the largest id on a data array and increment it
  function generateUniqueId(data_array) {
    var unique_id = 1;

    for(item in data_array)
      if(Number(data_array[item]['id'].split('-').pop()) >= unique_id)
        unique_id = Number(data_array[item]['id'].split('-').pop()) + 1;

    return unique_id;
  }

  function generateUniqueNameId(method_type) {
    var mod_num = 0;

    for(mod in modules)
      if(modules[mod]['type'] == method_type && modules[mod]['name_id'] > mod_num)
        mod_num = modules[mod]['name_id'];

    return ++mod_num;
  }

  //remove error classes from the forms to add new data
  //add error classes to the added fields, if necessary
  function resetErrorClasses(type) {
    switch(type) {
      case 'OrderBy':
        //Criteria
        $('#new-orderby-criterion-name').removeClass('has-error');
        $('#new-orderby-criterion-type').removeClass('has-error');
        $('#new-orderby-criterion-direction').removeClass('has-error');

        //Actions
        $('#new-orderby-action-name').removeClass('has-error');
        for(criterion in $scope.currentModule.input.criteria)
          $('#new-orderby-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');

        break;

      case 'Sort':
        //Objects
        $('#new-sort-object-name').removeClass('has-error');

        break;

      case 'CAT-SD':
        //Criteria
        $('#new-cat-criterion-name').removeClass('has-error');
        $('#new-cat-criterion-direction').removeClass('has-error');

        //Interaction Effects
        $('#new-cat-interaction-type').removeClass('has-error');
        $('#new-cat-interaction-criterion1').removeClass('has-error');
        $('#new-cat-interaction-criterion2').removeClass('has-error');
        $('#new-cat-interaction-value').removeClass('has-error');
        break;
    }
  }

  /*** METHODS FUNCTIONS ***/

  //available methods
  $scope.methods = ['CAT-SD', 'Delphi', 'OrderBy', 'Sort', 'SRF'];

  //add a new method module
  $scope.createModule = function(mod) {
    switch(mod) {
      case 'OrderBy':
        //get the method's template
        var temp = document.getElementById('orderby-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        var unique_id = generateUniqueId(modules);
        temp_clone.find('#orderby').attr('id', 'orderby-' + unique_id);
        //add the file name to the module
        temp_clone.find('#mod-name').html('OrderBy' + generateUniqueNameId('OrderBy'));
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //define the initial posiiton of the new module
        $('#orderby-' + unique_id).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});
        break;

      case 'Sort':
        //get the method's template
        var temp = document.getElementById('sort-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        var unique_id = generateUniqueId(modules);
        temp_clone.find('#sort').attr('id', 'sort-' + unique_id);
        //add the file name to the module
        temp_clone.find('#mod-name').html('Sort' + generateUniqueNameId('Sort'));
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //define the initial posiiton of the new module
        $('#sort-' + unique_id).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});
        break;

      case 'CAT-SD':
        //get the method's template
        var temp = document.getElementById('cat-sd-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        var unique_id = generateUniqueId(modules);
        temp_clone.find('#cat-sd').attr('id', 'cat-sd-' + unique_id);
        //add the file name to the module
        temp_clone.find('#mod-name').html('CAT-SD' + generateUniqueNameId('CAT-SD'));
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //define the initial posiiton of the new module
        $('#cat-sd-' + unique_id).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});
        break;

      case 'Delphi':
        //get the method's template
        var temp = document.getElementById('delphi-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        var unique_id = generateUniqueId(modules);
        temp_clone.find('#delphi').attr('id', 'delphi-' + unique_id);
        //add the file name to the module
        temp_clone.find('#mod-name').html('Delphi' + generateUniqueNameId('Delphi'));
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //define the initial posiiton of the new module
        $('#delphi-' + unique_id).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});
        break;

      case 'SRF':
        //get the method's template
        var temp = document.getElementById('srf-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        var unique_id = generateUniqueId(modules);
        temp_clone.find('#srf').attr('id', 'srf-' + unique_id);
        //add the file name to the module
        temp_clone.find('#mod-name').html('SRF' + generateUniqueNameId('SRF'));
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //define the initial posiiton of the new module
        $('#srf-' + unique_id).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});
        break;
    }

    //create the data of the new module
    createModuleData(mod, unique_id);
  }

  $scope.createInputFileModule = function(name, data) {
    //get the input file template
    var temp = document.getElementById('inputfile-temp');
    //clone the template
    var temp_clone = $(temp.content).clone();
    //make its id unique
    var unique_id = generateUniqueId(modules);
    temp_clone.find('#inputfile').attr('id', 'inputfile-' + unique_id);
    //add the file name to the module
    temp_clone.find('#filename').html(name);
    //cloned elements need to be manually compiled by the angularJS
    var compiled_temp = $compile(temp_clone)($scope);
    //add the new instance of the template to the document
    compiled_temp.appendTo($('#workspace'));
    //define the initial posiiton of the new input file
    $('#inputfile-' + unique_id).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});

    createInputFileData(name, data, unique_id);
  }

  //add the module mod to the workspace
  function reloadModule(mod) {
    switch(mod['type']) {
      case 'OrderBy':
        //get the method's template
        var temp = document.getElementById('orderby-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#orderby').attr('id', mod['id']);
        //add the module name to the module
        temp_clone.find('#mod-name').html('OrderBy' + mod['name_id']);
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //set position of module
        $('#' + mod['id']).offset(mod['position']);
        break;

      case 'Input File':
        //get the input file template
        var temp = document.getElementById('inputfile-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#inputfile').attr('id', mod['id']);
        //add the file name to the module
        temp_clone.find('#filename').html(mod['name']);
        //cloned elements need to be manually compiled by the angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //set position of module
        $('#' + mod['id']).offset(mod['position']);
        break;

      case 'Sort':
        //get the method's template
        var temp = document.getElementById('sort-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#sort').attr('id', mod['id']);
        //add the module name to the module
        temp_clone.find('#mod-name').html('Sort' + mod['name_id']);
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //set position of module
        $('#' + mod['id']).offset(mod['position']);
        break;

      case 'CAT-SD':
        //get the method's template
        var temp = document.getElementById('cat-sd-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#cat-sd').attr('id', mod['id']);
        //add the module name to the module
        temp_clone.find('#mod-name').html('CAT-SD' + mod['name_id']);
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //set position of module
        $('#' + mod['id']).offset(mod['position']);
        break;

      case 'Delphi':
        //get the method's template
        var temp = document.getElementById('delphi-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#delphi').attr('id', mod['id']);
        //add the module name to the module
        temp_clone.find('#mod-name').html('Delphi' + mod['name_id']);
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //set position of module
        $('#' + mod['id']).offset(mod['position']);
        break;

      case 'SRF':
        //get the method's template
        var temp = document.getElementById('srf-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#srf').attr('id', mod['id']);
        //add the module name to the module
        temp_clone.find('#mod-name').html('SRF' + mod['name_id']);
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //set position of module
        $('#' + mod['id']).offset(mod['position']);
        break;
    }
  }

  /*** DATA DELETION FUNCTIONS ***/

  //selected input to be deleted
  $scope.deleteIdCriterion = '';
  $scope.deleteIdAction = '';
  $scope.deleteIdObject = '';
  $scope.deleteIdInteractionEffect = '';
  $scope.deleteIdBranch = ['', ''];
  $scope.deleteIdCategory = '';
  $scope.deleteIdReferenceAction = ['', ''];
  $scope.deleteIdEmail = '';
  $scope.deleteIdQuestion = '';

  //select a certain input to be deleted
  $scope.deleteInput = function(input, type) {
    switch(type) {
      case 'Criteria':
        $scope.deleteIdCriterion = input.id;
        break;

      case 'Actions':
        $scope.deleteIdAction = input.id;
        break;

      case 'Objects':
        $scope.deleteIdObject = input.id;
        break;

      case 'Interaction Effects':
        $scope.deleteIdInteractionEffect = input.id;
        break;

      case 'Branches':
        $scope.deleteIdBranch = [input[0]['id'], input[1]['id']];
        break;

      case 'Categories':
        $scope.deleteIdCategory = input.id;
        break;

      case 'Reference Actions':
        $scope.deleteIdReferenceAction = [input[0]['id'], input[1]['id']];
        break;

      case 'Emails':
        $scope.deleteIdEmail = input.id;
        break;

      case 'Questions':
        $scope.deleteIdQuestion = input.id;
        break;
    }
  }

  //delete the selected input
  $scope.confirmDeleteInput = function(input, type) {
    switch(type) {
      case 'Criteria':
        $scope.currentModule.input.criteria.splice($scope.currentModule.input.criteria.indexOf(input), 1);
        $scope.deleteIdCriterion = '';
        break;

      case 'Actions':
        $scope.currentModule.input.actions.splice($scope.currentModule.input.actions.indexOf(input), 1);
        $scope.deleteIdAction = '';
        break;

      case 'Objects':
        $scope.currentModule.input.objects.splice($scope.currentModule.input.objects.indexOf(input), 1);
        $scope.deleteIdObject = '';
        break;

      case 'Interaction Effects':
        $scope.currentModule.input['interaction effects'].splice($scope.currentModule.input['interaction effects'].indexOf(input), 1);
        $scope.deleteIdInteractionEffect = '';
        break;

      case 'Branches':
        $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(input[0])].branches.splice($scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(input[0])].branches.indexOf(input[1]), 1);
        $scope.deleteIdBranch = ['', ''];
        break;

      case 'Categories':
        $scope.currentModule.input.categories.splice($scope.currentModule.input.categories.indexOf(input), 1);
        $scope.deleteIdCategory = '';
        break;

      case 'Reference Actions':
        $scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(input[0])].reference_actions.splice($scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(input[0])].reference_actions.indexOf(input[1]), 1);
        $scope.deleteIdReferenceAction = ['', ''];
        break;

      case 'Emails':
        $scope.currentModule.input.emails.splice($scope.currentModule.input.emails.indexOf(input), 1);
        $scope.deleteIdEmail = '';
        break;

      case 'Questions':
        $scope.currentModule.input.questions.splice($scope.currentModule.input.questions.indexOf(input), 1);
        $scope.deleteIdQuestion = '';
        break;
    }
  }

  //cancel the input selection
  $scope.cancelDeleteInput = function(type) {
    switch(type) {
      case 'Criteria':
        $scope.deleteIdCriterion = '';
        break;

      case 'Actions':
        $scope.deleteIdAction = '';
        break;

      case 'Objects':
        $scope.deleteIdObject = '';
        break;

      case 'Interaction Effects':
        $scope.deleteIdInteractionEffect = '';
        break;

      case 'Branches':
        $scope.deleteIdBranch = ['', ''];
        break;

      case 'Categories':
        $scope.deleteIdCategory = '';
        break;

      case 'Reference Actions':
        $scope.deleteIdReferenceAction = ['', ''];
        break;

      case 'Emails':
        $scope.deleteIdEmail = '';
        break;

      case 'Questions':
        $scope.deleteIdQuestion = '';
        break;
    }
  }

  /*** CONNECTOR FUNCTIONS ***/

  //created connections
  var connections = [];
  //controls if a first point has already been clicked
  $scope.drawing_line = false;
  //holds all the information of the first point
  var first_event;

  //draw a line connector between two different points
  $scope.drawConnection = function(event) {
    //first a first point has not been created yet
    if(!$scope.drawing_line) {
      first_event = event;
      $scope.drawing_line = true;
    }
    //if a first point has been created already
    else {
      //"type" of the first point
      var first_type = first_event.target.nextElementSibling.innerHTML.toLowerCase();
      //"type" of the second point
      var second_type = event.target.nextElementSibling.innerHTML.toLowerCase();
      //id of the module of the first point
      var first_module_id = first_event.target.parentElement.attributes.id.value;
      //id of the module of the second point
      var second_module_id = event.target.parentElement.attributes.id.value;
      //id of the first point
      var first_point_id = first_event.target.attributes.id.value;
      //id of the second point
      var second_point_id = event.target.attributes.id.value;

      //unsuccessful connection - both points are of the same type or neither of them is of type "output"
      if(first_type == second_type || (first_type != 'output' && second_type != 'output')) {
        showAlert('invalid-connection1');
      }
      //unsuccessful connection -  both points belong to the same module
      else if(first_module_id == second_module_id) {
        showAlert('invalid-connection2');
      }
      //unsuccessful connection - connection already exists
      else if(connectionExists(first_module_id, second_module_id, first_type, second_type)) {
        showAlert('invalid-connection3');
      }
      //unsuccessful connection - input point is already connected
      else if(inputConnected(first_module_id, second_module_id, first_type, second_type)) {
        showAlert('invalid-connection4');
      }
      //successful connection
      else {
        //convert the coordinates of the first point to SVG coordinates
        var first_coords = transformCoordinates($(first_event.target).offset().left, $(first_event.target).offset().top - window.scrollY);
        //convert the coordinates of the second point to SVG coordinates
        var second_coords = transformCoordinates($(event.target).offset().left, $(event.target).offset().top - window.scrollY);
        //create a new SVG line
        var new_line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        //set the coordinates of the connector
        new_line.setAttribute('x1', first_coords[0]);
        new_line.setAttribute('y1', first_coords[1]);
        new_line.setAttribute('x2', second_coords[0]);
        new_line.setAttribute('y2', second_coords[1]);

        //get the id of the connector
        var unique_id = generateUniqueId(connections);
        //set the id of the connector
        new_line.setAttribute('id', 'line-' + unique_id);

        //set a click event
        new_line.setAttribute('ng-click', 'deleteConnection($event)');

        //compile the new line
        var compiled_line = $compile(new_line)($scope);
        //append the compile line to the svg area
        $('#svg').append(compiled_line);

        //create a new connection to be added to the connections array
        var new_connection = {};
        new_connection['id'] = 'line-' + unique_id;

        var input, input_point, input_type, output, output_type;

        if(first_type == 'output') {
          input = second_module_id;
          input_point = second_point_id;
          input_type = second_type;
          output = first_module_id;
          output_point = first_point_id;
          new_connection['point_mapping'] = {
            'output' : 'first_point',
            'input' : 'second_point'
          }
        }
        else {
          input = first_module_id;
          input_point = first_point_id;
          input_type = first_type;
          output = second_module_id;
          output_point = second_point_id;
          new_connection['point_mapping'] = {
            'output' : 'second_point',
            'input' : 'first_point'
          }
        }

        new_connection['input'] = input;
        new_connection['input_point'] = input_point;
        new_connection['input_type'] = input_type;
        new_connection['output'] = output;
        new_connection['output_point'] = output_point;

        connections.push(new_connection);

        //transfer data between output and input
        for(mod in modules)
          //verify if the output module already contains the results
          if(modules[mod]['id'] == output && modules[mod]['output'] != undefined) {
            for(modl in modules) {
              if(modules[modl]['id'] == input) {
                //SPECIAL CASES
                //CAT-SD - SCALES
                if(modules[modl]['type'] == 'CAT-SD' && input_type == 'scales') {
                  for(scale in modules[mod]['output'])
                    for(criterion in modules[modl]['input']['criteria'])
                      if(modules[modl]['input']['criteria'][criterion]['name'] == modules[mod]['output'][scale]['criterion'])
                        modules[modl]['input']['criteria'][criterion]['scale'] = modules[mod]['output'][scale];
                }
                //CAT-SD - FUNCTIONS/BRANCHES
                else if(modules[modl]['type'] == 'CAT-SD' && input_type == 'functions') {
                  for(branch in modules[mod]['output'])
                    for(criterion in modules[modl]['input']['criteria'])
                      if(modules[modl]['input']['criteria'][criterion]['name'] == modules[mod]['output'][branch]['criterion']) {
                        if(modules[modl]['input']['criteria'][criterion]['branches'] == undefined)
                          modules[modl]['input']['criteria'][criterion]['branches'] = [];

                        modules[modl]['input']['criteria'][criterion]['branches'].push(modules[mod]['output'][branch]);
                      }
                }
                //CAT-SD - REFERENCE ACTIONS
                else if(modules[modl]['type'] == 'CAT-SD' && input_type == 'reference actions') {
                  for(action in modules[mod]['output'])
                    for(category in modules[modl]['input']['categories'])
                      if(modules[modl]['input']['categories'][category]['name'] == modules[mod]['output'][action]['category']) {
                        if(modules[modl]['input']['categories'][category].reference_actions == undefined)
                          modules[modl]['input']['categories'][category].reference_actions = [];

                        modules[modl]['input']['categories'][category].reference_actions.push(modules[mod]['output'][action]);
                      }

                  for(category in modules[modl]['input']['categories'])
                    for(reference_action in modules[modl]['input']['categories'][category]['reference_actions'])
                      modules[modl]['input']['categories'][category]['reference_actions'][reference_action]['name'] = 'b' + (Number(category) + 1) + (Number(reference_action) + 1);
                }
                //DELPHI - SUBJECT
                else if(modules[modl]['type'] == 'Delphi' && input_type == 'subject')
                  modules[modl]['input']['subject'] = modules[mod]['output'][0]['subject'];
                //SRF - RANKING
                else if(modules[modl]['type'] == 'SRF' && input_type == 'ranking')
                  modules[modl]['input']['ranking'] = modules[mod]['output'][0]['ranking'];
                //SRF - RATIO Z
                else if(modules[modl]['type'] == 'SRF' && input_type == 'ratio z')
                  modules[modl]['input']['ratio z'] = modules[mod]['output'][0]['ratio-z'];
                //SRF - DECIMAL PLACES
                else if(modules[modl]['type'] == 'SRF' && input_type == 'decimal places')
                  modules[modl]['input']['decimal places'] = modules[mod]['output'][0]['decimal-places'].toString();
                //SRF - WEIGHT TYPE
                else if(modules[modl]['type'] == 'SRF' && input_type == 'weight type')
                  modules[modl]['input']['weight type'] = modules[mod]['output'][0]['weight-type'];
                //NORMAL CASE
                else
                  modules[modl]['input'][input_type.toLowerCase()] = angular.copy(modules[mod]['output']);

                break;
              }
            }
          }
      }
      //reset the drawing process
      $scope.drawing_line = false;
    }
  }

  //convert screen coordinates to svg coordinates
  function transformCoordinates(x, y) {
    var pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    pt = pt.matrixTransform(svg.getScreenCTM().inverse());

    return [pt.x, pt.y];
  }

  //verify if a connection already exists
  function connectionExists(first_id, second_id, first_type, second_type) {
    for(connection in connections)
      if((connections[connection]['input'] == first_id && connections[connection]['output'] == second_id && connections[connection]['input_type'] == first_type)
      || (connections[connection]['input'] == second_id && connections[connection]['output'] == first_id && connections[connection]['input_type'] == second_type))
        return true;

    return false;
  }

  //verify if input point is already connected
  function inputConnected(first_id, second_id, first_type, second_type) {
    var input_point, input_type;
    if(first_type != 'output') {
      input_point = first_id;
      input_type = first_type;
    }
    else {
      input_point = second_id;
      input_type = second_type;
    }

    for(connection in connections)
      if(connections[connection]['input'] == input_point && connections[connection]['input_type'] == input_type)
        return true;

    return false;
  }

  //update the position of a certain point
  function updateConnections(id) {
    for(connection in connections) {
      if(connections[connection]['input'] == id) {
        var x_coord = $('#' + id).find('#' + connections[connection]['input_point']).offset().left;
        var y_coord = $('#' + id).find('#' + connections[connection]['input_point']).offset().top - window.scrollY;
        var new_coords = transformCoordinates(x_coord, y_coord);
        var line = $('#' + connections[connection]['id']);

        if(connections[connection]['point_mapping']['input'] == 'first_point') {
          line.attr('x1', new_coords[0]);
          line.attr('y1', new_coords[1]);
        }
        else {
          line.attr('x2', new_coords[0]);
          line.attr('y2', new_coords[1]);
        }
      }
      else if(connections[connection]['output'] == id) {
        var x_coord = $('#' + id).find('#' + connections[connection]['output_point']).offset().left;
        var y_coord = $('#' + id).find('#' + connections[connection]['output_point']).offset().top - window.scrollY;
        var new_coords = transformCoordinates(x_coord, y_coord);
        var line = $('#' + connections[connection]['id']);

        if(connections[connection]['point_mapping']['output'] == 'first_point') {
          line.attr('x1', new_coords[0]);
          line.attr('y1', new_coords[1]);
        }
        else {
          line.attr('x2', new_coords[0]);
          line.attr('y2', new_coords[1]);
        }
      }
    }
  }

  //add a previosuly created module mod to the workspace
  function reloadConnection(connection) {
    var input_x = $('#' + connection['input']).find('#' + connection['input_point']).offset().left;
    var input_y = $('#' + connection['input']).find('#' + connection['input_point']).offset().top - window.scrollY;
    var trans_input = transformCoordinates(input_x, input_y);

    var output_x = $('#' + connection['output']).find('#' + connection['output_point']).offset().left;
    var output_y = $('#' + connection['output']).find('#' + connection['output_point']).offset().top - window.scrollY;
    var trans_output = transformCoordinates(output_x, output_y);

    //create a new SVG line
    var new_line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    //set the coordinates of the line
    if(connection['point_mapping']['output'] == 'first_point') {
      new_line.setAttribute('x1', trans_output[0]);
      new_line.setAttribute('y1', trans_output[1]);
      new_line.setAttribute('x2', trans_input[0]);
      new_line.setAttribute('y2', trans_input[1]);
    }
    else {
      new_line.setAttribute('x1', trans_input[0]);
      new_line.setAttribute('y1', trans_input[1]);
      new_line.setAttribute('x2', trans_output[0]);
      new_line.setAttribute('y2', trans_output[1]);
    }
    //set the id of the line
    new_line.setAttribute('id', connection['id']);
    //set a click event
    new_line.setAttribute('ng-click', 'deleteConnection($event)')
    //compile the new line
    var compiled_line = $compile(new_line)($scope);
    //append the compile line to the svg area
    $('#svg').append(compiled_line);
  }

  //deletes a connection - triggered by clicking it
  $scope.deleteConnection = function(event) {
    var connection_id;

    //find the index of the clicked connector
    for(connection in connections)
      if(connections[connection].id == event.target.attributes.id.value) {
        connection_id = connection
        break;
      }

    //reset the data transfered from one module to another
    deleteConnectionData(connections[connection_id]);

    //remove the connector from the connections array
    connections.splice(connection_id, 1);

    //remove the connection from the screen
    $(event.target).remove();
  }

  //deletes a certain connection
  function deleteConnectionData(connection) {
    //reset the data transfered from one module to another
    for(mod in modules)
      if(modules[mod].id == connection.input) {
        //SPECIAL CASES
        //CAT-SD SCALES
        if(modules[mod].type == 'CAT-SD' && connection.input_type == 'scales') {
          for(criterion in modules[mod].input.criteria)
            modules[mod].input.criteria[criterion].scale = [];
        }
        //CAT-SD - FUNCTIONS/BRANCHES
        else if(modules[mod].type == 'CAT-SD' && connection.input_type == 'functions') {
          for(criterion in modules[mod].input.criteria)
            modules[mod].input.criteria[criterion].branches = [];
        }
        //CAT-SD - REFERENCE ACTIONS
        else if(modules[mod].type == 'CAT-SD' && connection.input_type == 'reference actions') {
          for(category in modules[mod].input.categories)
            modules[mod].input.categories[category].reference_actions = [];
        }
        //SRF - RANKING
        else if(modules[mod].type == 'SRF' && connection.input_type == 'ranking')
          modules[mod].input.ranking = 2;
        //SRF - RATIO Z
        else if(modules[mod].type == 'SRF' && connection.input_type == 'ratio z')
          modules[mod].input['ratio z'] = '';
        //SRF - DECIMAL PLACES
        else if(modules[mod].type == 'SRF' && connection.input_type == 'decimal places')
          modules[mod].input['decimal places'] = '';
        //SRF - WEIGHT TYPE
        else if(modules[mod].type == 'SRF' && connection.input_type == 'weight type')
          modules[mod].input['weight type'] = '';
        else
          modules[mod].input[connection.input_type.toLowerCase()] = [];

        break;
      }
  }

  /*** WORKFLOW EXECUTION ***/

  //execute the workflow
  $scope.executeWorkflow = function() {
    //show loading sign
    $scope.isLoading = true;

    var total_results = 0;

    //verify if every module is eligible to receive data
    if(checkModulesData()) {
      //count the number of executed modules
      var mod_exec = 0;

      while(mod_exec < modules.length) {
        mod_exec = 0;

        for(mod in modules) {
          if(modules[mod]['output'].length > 0)
            mod_exec++;
          else {
            //transfer data between the connections of the current module
            transferData(modules[mod]);

            //check if current module received all necessary data
            //or another module needs to executed first
            if(checkModData(modules[mod])) {
              //try to execute method
              if(executeMethod(modules[mod]))
                mod_exec++;
            }
          }
        }
      }
      //create new execution
      newExecution();
      //show the successful execution alert
      showAlert('execution-success');
    }
    else
      showAlert('execution-error');

    //hide loading sign
    $scope.isLoading = false;
  }

  //verify if all modules have manually input data or a connection
  function checkModulesData() {
    //keep the number of modules that have data, for each input point of each module
    var modules_data = 0;

    for(mod in modules) {
      //input files do not have input points, therefore they do not need to be checked
      if(modules[mod]['type'] != 'Input File') {
        var input_data = 0;
        //check connections for each input point of the current module
        for(input in modules[mod]['input']) {
          if(modules[mod]['input'][input].length > 0) {
            input_data++;
          }
          //SPECIAL CASE - DELPHI EMAILS
          else if(modules[mod].type == 'Delphi' && input == 'emails') {
            input_data++;
          }
          else {
            for(connection in connections)
              if(connections[connection]['input'] == modules[mod]['id'] && connections[connection]['input_type'] == input) {
                input_data++;
                break;
              }
          }
        }
        //check if all input points of the current module have a connection or already have input data
        if(input_data == Object.keys(modules[mod]['input']).length)
          modules_data++;
      }
      else
        modules_data++;
    }
    return modules_data == modules.length;
  }

  //check if a certain module has already received all necessary data
  function checkModData(mod) {
    for(input in mod.input) {
      //SPECIAL CASE - DELPHI EMAILS
      if(mod.type == 'Delphi' && input == 'emails')
        continue;
      else if(mod.input[input].length == 0)
        return false;
    }

    return true;
  }

  //transfer the data to a certain module, according to its connections
  function transferData(mod) {
    for(input in mod['input'])
      //if no input is defined in the module, then a connection must have been created to this point
      if(mod['input'][input].length == 0)
        for(connection in connections)
          if(connections[connection]['input'] == mod['id'] && connections[connection]['input_type'] == input)
            //find the module connected to the input point and get its output data
            for(modl in modules) {
              if(modules[modl]['id'] == connections[connection]['output'] && modules[modl]['output'].length > 0)
                mod['input'][input] = modules[modl]['output'];
            }
  }

  //execute the method correspondent to the mod module
  function executeMethod(mod) {
    var method_executed = false;

    switch(mod['type']) {
      case 'OrderBy':
        mod.output = OrderByService.getResults(mod.input.criteria, mod.input.actions);
        method_executed = true;
        break;

      case 'Sort':
        mod.output = mod.input.objects;
        method_executed = true;
        break;

      case 'CAT-SD':
        var results = CATSDService.getResults(mod.input.criteria, mod.input['interaction effects'], mod.input.actions, mod.input.categories);

        results.then(function(resolve) {
          mod.output = resolve;
        });

        method_executed = true;
        break;

      case 'Delphi':
        var results = DelphiService.startRound($scope.username, proj_id, mod.input.subject, mod.input.emails, mod.input.questions, mod.current_round);

        results.then(function(resolve) {
          mod.round_id = resolve.id;
        });

        method_executed = true;
        break;

      case 'SRF':
        mod.output = SRFService.getResults(mod.input.criteria, mod.input['white cards'], mod.input.ranking, mod.input['ratio z'], mod.input['decimal places'], mod.input['weight type']);
        break;
    }

    return method_executed;
  }

  function resetOutputFields() {
    for(mod in modules)
      if(modules[mod]['type'] != 'Input File')
        modules[mod]['output'] = [];
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
  hideAlerts();
});
