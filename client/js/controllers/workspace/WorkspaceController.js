app.controller('WorkspaceController', function($scope, $window, $http, $compile, OrderByService, CATSDService, DelphiService, SRFService) {
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
      $http.delete('/projects/' + id_doc).then(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).then(function() {
          //retrieve the data stored in the database
          $scope.reloadData();
          //update the list of executions
          getExecutions();
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
  $scope.reloadData = function() {
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
    new_mod['type'] = 'InputFile';
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
          deleteConnection(connect);
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

    removeErrorClasses($scope.currentModule['type']);
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

  //remove error classes from the input fields
  function removeErrorClasses(type) {
    switch(type) {
      case 'OrderBy':
        //Added Data
        //Criteria


        //New Data
        //Criteria
        $('#orderby-criteria-name').removeClass('has-error');
        $('#orderby-criteria-type').removeClass('has-error');
        $('#orderby-criteria-direction').removeClass('has-error');

        //Actions
        $('#orderby-actions-name').removeClass('has-error');

        for(criterion in $scope.currentModule.input.criteria)
          $('#orderby-actions-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');

        break;

      case 'Sort':
        //Objects
        $('#sort-objects-name').removeClass('has-error');

        break;

      case 'CAT-SD':
        //Criteria
        $('#cat-criteria-name').removeClass('has-error');
        $('#cat-criteria-direction').removeClass('has-error');
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

      case 'InputFile':
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

  /*** DATA INPUT FUNCTIONS - ORDERBY METHOD ***/

  //add a new criterion
  $scope.addOrderByCriterion = function() {
    //if there is an input field not assigned
    if($scope.new_orderby_criterion.name == undefined || $scope.new_orderby_criterion.name == '' || $scope.new_orderby_criterion.type == undefined || $scope.new_orderby_criterion.type == '' || $scope.new_orderby_criterion.direction == undefined || $scope.new_orderby_criterion.direction == '') {
      //if a name has not been assigned - add error class
      if($scope.new_orderby_criterion.name == undefined || $scope.new_orderby_criterion.name == '')
        $('#orderby-criteria-name').addClass('has-error');
      else
        $('#orderby-criteria-name').removeClass('has-error');

      //if a type has not been assigned - add error class
      if($scope.new_orderby_criterion.type == undefined || $scope.new_orderby_criterion.type == '')
        $('#orderby-criteria-type').addClass('has-error');
      else
        $('#orderby-criteria-type').removeClass('has-error');

      //if a direction has not been assigned - add error class
      if($scope.new_orderby_criterion.direction == undefined || $scope.new_orderby_criterion.direction == '')
        $('#orderby-criteria-direction').addClass('has-error');
      else
        $('#orderby-criteria-direction').removeClass('has-error');
    }
    else {
      //assign an unique id to the new criterion
      if($scope.currentModule.input.criteria.length == 0)
        $scope.new_orderby_criterion.id = 1;
      else
        $scope.new_orderby_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1]['id'] + 1;

      //the criterion is not selected by default
      $scope.new_orderby_criterion.selected = false;

      //add the new criterion to the
      $scope.currentModule.input.criteria.push(angular.copy($scope.new_orderby_criterion));

      //reset the criterion input fields
      $scope.new_orderby_criterion.name = '';
      $scope.new_orderby_criterion.type = '';
      $scope.new_orderby_criterion.direction = '';

      //remove all error classes - just be sure
      $('#orderby-criteria-name').removeClass('has-error');
      $('#orderby-criteria-type').removeClass('has-error');
      $('#orderby-criteria-direction').removeClass('has-error');
    }
  }

  //select the criterion that defines the order
  $scope.selectOrderByCriterion = function(criterion) {
    if($scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)]['selected'] == 'true')
      $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)]['selected'] = 'false';
    else {
      //make sure no other criterion is selected
      for(crit in $scope.currentModule.input.criteria)
        $scope.currentModule.input.criteria[crit]['selected'] = 'false';
      //select the clicked criterion
      $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)]['selected'] = 'true';
    }
  }

  //add a new action
  $scope.addOrderByAction = function() {
    var unassigned_field = false;

    //check if there is an unassigned input field
    for(criterion in $scope.currentModule.input.criteria)
      if($scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] == "")
        unassigned_field = true;

    if($scope.new_orderby_action.name == undefined || $scope.new_orderby_action.name == '' || unassigned_field) {
      //if a name has not been assigned - add error class
      if($scope.new_orderby_action.name == undefined || $scope.new_orderby_action.name == '')
        $('#orderby-action-name').addClass('has-error');
      else
        $('#orderby-action-name').removeClass('has-error');

      //if the criterion field has not been assigned - add error class
      for(criterion in $scope.currentModule.input.criteria) {
        if($scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] == "")
          $('#orderby-action-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        else
          $('#orderby-action-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
    else {
      if($scope.currentModule.input.actions.length == 0)
        $scope.new_orderby_action.id = 1;
      else
        $scope.new_orderby_action.id = $scope.currentModule.input.actions[$scope.currentModule.input.actions.length - 1]['id'] + 1;

      $scope.currentModule.input.actions.push(angular.copy($scope.new_orderby_action));

      //reset the new action input fields and remove the error classes - just in case
      $scope.new_orderby_action.name = '';
      $('#orderby-action-name').removeClass('has-error');

      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_orderby_action[$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#orderby-action-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  /*** DATA INPUT FUNCTIONS - SORT METHOD ***/

  $scope.addSortObject = function() {
    //if a name has not been assigned - add error class
    if($scope.new_object.name == undefined || $scope.new_object.name == '')
      $('#sort-objects-name').addClass('has-error');
    else {
      $('#sort-objects-name').removeClass('has-error');

      if($scope.currentModule.input.objects.length == 0)
        $scope.new_object.id = 1;
      else
        $scope.new_object.id = $scope.currentModule.input.objects[$scope.currentModule.input.objects.length - 1]['id'] + 1;

      $scope.currentModule.input.objects.push(angular.copy($scope.new_object));

      //reset the new object input field and remove the error class - just in case
      $scope.new_object.name = '';
      $('#sort-object-name').removeClass('has-error');
    }
  }

  $scope.onDropComplete = function(index, obj, evt) {
    var otherObj = $scope.currentModule.input.objects[index];
    var otherIndex = $scope.currentModule.input.objects.indexOf(obj);
    $scope.currentModule.input.objects[index] = obj;
    $scope.currentModule.input.objects[otherIndex] = otherObj;
  }

  /*** DATA INPUT FUNCTIONS - CAT-SD METHOD ***/

  //add a new criterion
  $scope.addCATCriterion = function() {
    //if there is an input field not assigned
    if($scope.new_cat_criterion.name == undefined || $scope.new_cat_criterion.name == '' || $scope.new_cat_criterion.direction == undefined) {
      //if a name has not been assigned - add error class
      if($scope.new_cat_criterion.name == undefined || $scope.new_cat_criterion.name == '')
        $('#new-cat-criterion-name').addClass('has-error');
      else
        $('#new-cat-criterion-name').removeClass('has-error');

      //if a direction has not been assigned - add error class
      if($scope.new_cat_criterion.direction == undefined || $scope.new_cat_criterion.direction == '')
        $('#new-cat-criterion-direction').addClass('has-error');
      else
        $('#new-cat-criterion-direction').removeClass('has-error');
    }
    else {
      //assign an unique id to the new criterion
      if($scope.currentModule.input.criteria.length == 0)
        $scope.new_cat_criterion.id = 1;
      else
        $scope.new_cat_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1]['id'] + 1;

      //add the new criterion to the
      $scope.currentModule.input.criteria.push(angular.copy($scope.new_cat_criterion));

      //reset the criterion input fields
      $scope.new_cat_criterion.name = '';
      $scope.new_cat_criterion.direction = '';

      //remove all error classes - just be sure
      $('#new-cat-criterion-name').removeClass('has-error');
      $('#new-cat-criterion-direction').removeClass('has-error');
    }
  }

  $scope.blurCATCriterionName = function(criterion) {
    if(criterion.name == '')
      $('#cat-criterion-' + criterion.id + '-name').addClass('has-error');
    else
      $('#cat-criterion-' + criterion.id + '-name').removeClass('has-error');
  }

  $scope.addCATInteractionEffect = function() {
    //if there is an input field not assigned
    if($scope.new_interaction_effect.type == undefined || $scope.new_interaction_effect.criterion1 == undefined || $scope.new_interaction_effect.criterion2 == undefined || $scope.new_interaction_effect.value == undefined || $scope.new_interaction_effect.value == '') {
      //if a type has not been assigned - add error class
      if($scope.new_interaction_effect.type == undefined)
        $('#new-cat-interaction-type').addClass('has-error');
      else
        $('#new-cat-interaction-type').removeClass('has-error');

      //if a criterion1 has not been assigned - add error class
      if($scope.new_interaction_effect.criterion1 == undefined)
        $('#new-cat-interaction-criterion1').addClass('has-error');
      else
        $('#new-cat-interaction-criterion1').removeClass('has-error');

      //if a criterion2 has not been assigned - add error class
      if($scope.new_interaction_effect.criterion2 == undefined)
        $('#new-cat-interaction-criterion2').addClass('has-error');
      else
        $('#new-cat-interaction-criterion2').removeClass('has-error');

      //if a value has not been assigned - add error class
      if(($scope.new_interaction_effect.value == undefined || $scope.new_interaction_effect.value == '')
      || (($scope.new_interaction_effect.type == 'Mutual-Strengthening Effect' && $scope.new_interaction_effect.value <= 0)
      || (($scope.new_interaction_effect.type == 'Mutual-Weakening Effect' || $scope.new_interaction_effect.type == 'Antagonistic Effect') && $scope.new_interaction_effect.value >= 0)))
        $('#new-cat-interaction-value').addClass('has-error');
      else
        $('#new-cat-interaction-value').removeClass('has-error');
    }
    else {
      if($scope.currentModule.input['interaction effects'].length == 0)
        $scope.new_interaction_effect.id = 1;
      else
        $scope.new_interaction_effect.id = $scope.currentModule.input['interaction effects'][$scope.currentModule.input['interaction effects'].length - 1].id + 1;

      $scope.currentModule.input['interaction effects'].push(angular.copy($scope.new_interaction_effect));

      //reset the input fields
      $scope.new_interaction_effect.type = '';
      $scope.new_interaction_effect.criterion1 = '';
      $scope.new_interaction_effect.criterion2 = '';
      $scope.new_interaction_effect.value = '';

      //remove all error classes
      $('#new-cat-interaction-type').removeClass('has-error');
      $('#new-cat-interaction-criterion1').removeClass('has-error');
      $('#new-cat-interaction-criterion2').removeClass('has-error');
      $('#new-cat-interaction-value').removeClass('has-error');
    }
  }

  $scope.blurCATInteractionValue = function(interaction) {
    if(interaction.value == '' || ((interaction.type == 'Mutual-Strengthening Effect' && interaction.value <= 0)
    || ((interaction.type == 'Mutual-Weakening Effect' || interaction.type == 'Antagonistic Effect') && interaction.value >= 0)))
      $('#cat-interaction-' + interaction.id + '-value').addClass('has-error');
    else
      $('#cat-interaction-' + interaction.id + '-value').removeClass('has-error');
  }

  $scope.blurCATScaleMin = function(criterion) {
    if(criterion.scale.min == undefined)
      $('#cat-scale-' + criterion.id + '-min').addClass('has-error');
    else if(criterion.scale.min >= criterion.scale.max && criterion.scale.min != undefined && criterion.scale.max != undefined) {
      $('#cat-scale-' + criterion.id + '-min').addClass('has-error');
      $('#cat-scale-' + criterion.id + '-max').addClass('has-error');
    }
    else {
      $('#cat-scale-' + criterion.id + '-min').removeClass('has-error');
      $('#cat-scale-' + criterion.id + '-max').removeClass('has-error');
    }
  }

  $scope.blurCATScaleMax = function(criterion) {
    if(criterion.scale.max == undefined)
      $('#cat-scale-' + criterion.id + '-max').addClass('has-error');
    else if(criterion.scale.min >= criterion.scale.max && criterion.scale.min != undefined && criterion.scale.max != undefined) {
      $('#cat-scale-' + criterion.id + '-min').addClass('has-error');
      $('#cat-scale-' + criterion.id + '-max').addClass('has-error');
    }
    else {
      $('#cat-scale-' + criterion.id + '-min').removeClass('has-error');
      $('#cat-scale-' + criterion.id + '-max').removeClass('has-error');
    }
  }

  $scope.blurCATScaleCategories = function(criterion) {
    if(criterion.scale.num_categories < 2 || criterion.scale.num_categories == undefined)
      $('#cat-scale-' + criterion.id + '-categories').addClass('has-error');
    else
      $('#cat-scale-' + criterion.id + '-categories').removeClass('has-error');
  }

  $scope.addCATBranch = function(criterion) {
    //if there is an input field not assigned
    if($scope.new_branch[criterion.id].function == undefined || $scope.new_branch[criterion.id].function == '' || $scope.new_branch[criterion.id].condition == undefined || $scope.new_branch[criterion.id].function == '') {
      //if a function has not been assigned - add error class
      if($scope.new_branch[criterion.id].function == undefined || $scope.new_branch[criterion.id].function == '')
        $('#cat-branch-function-' + criterion.id).addClass('has-error');
      else
        $('#cat-branch-function-' + criterion.id).removeClass('has-error');

      //if a condition has not been assigned - add error class
      if($scope.new_branch[criterion.id].condition == undefined || $scope.new_branch[criterion.id].condition == '')
        $('#cat-branch-condition-' + criterion.id).addClass('has-error');
      else
        $('#cat-branch-condition-' + criterion.id).removeClass('has-error');
    }
    else {
      if($scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)].branches == undefined) {
        //initialize the branches array
        $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)].branches = [];
        $scope.new_branch[criterion.id].id = 1;
      }
      else if($scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)].branches.length == 0)
        $scope.new_branch[criterion.id].id = 1;
      else
        $scope.new_branch[criterion.id].id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)].branches[$scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)].branches.length - 1].id + 1;

      $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.indexOf(criterion)].branches.push(angular.copy($scope.new_branch[criterion.id]));

      //reset input fields
      $scope.new_branch[criterion.id].function = '';
      $scope.new_branch[criterion.id].condition = '';

      //remove all error classes
      $('#cat-branch-function-' + criterion.id).removeClass('has-error');
      $('#cat-branch-condition-' + criterion.id).removeClass('has-error');
    }
  }

  $scope.addCATAction = function() {
    var unassigned_field = false;

    //check if there is an unassigned criteria field
    //or that the value inserted in that field is between the criterion's scale minimum and maximum values
    for(criterion in $scope.currentModule.input.criteria) {
      if(($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] == "")
      || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Numerical' && ($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] < $scope.currentModule.input.criteria[criterion]['scale']['min'] || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['max']))
      || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Categorical' && ($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['num_categories'] || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] < 1))) {
        unassigned_field = true;
        break;
      }
    }

    if($scope.new_cat_action.name == undefined || $scope.new_cat_action.name == '' || unassigned_field) {
      //if a name has not been assigned - add error class
      if($scope.new_cat_action.name == undefined || $scope.new_cat_action.name == '')
        $('#new-cat-action-name').addClass('has-error');
      else
        $('#new-cat-action-name').removeClass('has-error');

      //if the criterion field has not been assigned - add error class
      for(criterion in $scope.currentModule.input.criteria) {
        if(($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] == "")
        || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Numerical' && ($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] < $scope.currentModule.input.criteria[criterion]['scale']['min'] || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['max']))
        || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Categorical' && ($scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['num_categories'] || $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] < 1)))
          $('#new-cat-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        else
          $('#new-cat-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
    else {
      if($scope.currentModule.input.actions.length == 0)
        $scope.new_cat_action.id = 1;
      else
        $scope.new_cat_action.id = $scope.currentModule.input.actions[$scope.currentModule.input.actions.length - 1]['id'] + 1;

      $scope.currentModule.input.actions.push(angular.copy($scope.new_cat_action));

      //reset the new action input fields and remove the error classes - just in case
      $scope.new_cat_action.name = '';
      $('#new-cat-action-name').removeClass('has-error');

      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_cat_action[$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-cat-action-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurCATActionName = function(action) {
    if(action.name == '')
      $('#cat-action-' + action.id + '-name').addClass('has-error');
    else
      $('#cat-action-' + action.id + '-name').removeClass('has-error');
  }

  $scope.blurCATActionCriterion = function(action, criterion_name) {
    for(criterion in $scope.currentModule.input.criteria)
      if($scope.currentModule.input.criteria[criterion]['name'] == criterion_name) {
        if(($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Numerical' && (action[criterion_name] < $scope.currentModule.input.criteria[criterion]['scale']['min'] || action[criterion_name] > $scope.currentModule.input.criteria[criterion]['scale']['max']))
        || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Categorical' && (action[criterion_name] > $scope.currentModule.input.criteria[criterion]['scale']['num_categories'] || action[criterion_name] < 1)))
          $('#cat-action-' + action.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        else
          $('#cat-action-' + action.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');

        break;
      }
  }

  $scope.addCATCategory = function() {
    var unassigned_field = false;

    //check if there is an unassigned input field
    for(criterion in $scope.currentModule.input.criteria)
      if($scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] == "" || $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] < 0)
        unassigned_field = true;

    if($scope.new_category.name == undefined || $scope.new_category.name == '' || $scope.new_category.membership_degree == undefined || $scope.new_category.membership_degree == '' || $scope.new_category.membership_degree < 0.5 || $scope.new_category.membership_degree > 1 || unassigned_field) {
      //if a name has not been assigned - add error class
      if($scope.new_category.name == undefined || $scope.new_category.name == '')
        $('#new-cat-category-name').addClass('has-error');
      else
        $('#new-cat-category-name').removeClass('has-error');

      //if a membership degree has not been assigned - add error class
      if($scope.new_category.membership_degree == undefined || $scope.new_category.membership_degree == '' || $scope.new_category.membership_degree < 0.5 || $scope.new_category.membership_degree > 1)
        $('#new-cat-category-membership-degree').addClass('has-error');
      else
        $('#new-cat-category-membership-degree').removeClass('has-error');

      //if the criterion field has not been assigned - add error class
      for(criterion in $scope.currentModule.input.criteria) {
        if($scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] == "" || $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] < 0)
          $('#new-cat-category-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        else
          $('#new-cat-category-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
    else {
      if($scope.currentModule.input.categories.length == 0)
        $scope.new_category.id = 1;
      else
        $scope.new_category.id = $scope.currentModule.input.categories[$scope.currentModule.input.categories.length - 1].id + 1;

      $scope.new_category.reference_actions = [];
      $scope.currentModule.input.categories.push(angular.copy($scope.new_category));

      //reset the input fields
      $scope.new_category.name = '';
      $('#new-cat-category-name').removeClass('has-error');

      $scope.new_category.membership_degree = '';
      $('#new-cat-category-membership-degree').removeClass('has-error');

      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_category[$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-cat-category-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurCATCategoryName = function(category) {
    if(category.name == '')
      $('#cat-category-' + category.id + '-name').addClass('has-error');
    else
      $('#cat-category-' + category.id + '-name').removeClass('has-error');
  }

  $scope.blurCATCategoryMembership = function(category) {
    if(category.membership_degree == '' || category.membership_degree < 0.5 || category.membership_degree > 1)
      $('#cat-category-' + category.id + '-membership-degree').addClass('has-error');
    else
      $('#cat-category-' + category.id + '-membership-degree').removeClass('has-error');
  }

  $scope.blurCATCategoryCriterion = function(category, criterion) {
    if(category[criterion.name] == undefined || category[criterion.name] < 0)
      $('#cat-category-' + category.id + '-criterion-' + criterion.id).addClass('has-error');
    else
      $('#cat-category-' + category.id + '-criterion-' + criterion.id).removeClass('has-error');
  }

  $scope.addCATReferenceAction = function(category, index) {
    var unassigned_field = false;

    //check if there is an unassigned input field
    for(criterion in $scope.currentModule.input.criteria)
      if(($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] == "")
      || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Numerical' && ($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] < $scope.currentModule.input.criteria[criterion]['scale']['min'] || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['max']))
      || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Categorical' && ($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['num_categories'] || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] < 1)))
        unassigned_field = true;

    if(unassigned_field) {
      //if the criterion field has not been assigned - add error class
      for(criterion in $scope.currentModule.input.criteria) {
        if(($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] == undefined || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] == "")
        || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Numerical' && ($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] < $scope.currentModule.input.criteria[criterion]['scale']['min'] || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['max']))
        || ($scope.currentModule.input.criteria[criterion]['scale']['type'] == 'Categorical' && ($scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] > $scope.currentModule.input.criteria[criterion]['scale']['num_categories'] || $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] < 1)))
          $('#new-cat-ref-' + category.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).addClass('has-error');
        else
          $('#new-cat-ref-' + category.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
    else {
      if($scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(category)].reference_actions == undefined) {
        $scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(category)].reference_actions = [];
        $scope.new_reference_action[category.id].id = 1;
      }
      else if($scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(category)].reference_actions.length == 0)
        $scope.new_reference_action[category.id].id = 1;
      else
        $scope.new_reference_action[category.id].id = $scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(category)].reference_actions[$scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(category)].reference_actions.length - 1].id + 1;

      $scope.new_reference_action[category.id].name = 'b' + (index + 1) + ($scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(category)].reference_actions.length + 1);

      $scope.currentModule.input.categories[$scope.currentModule.input.categories.indexOf(category)].reference_actions.push(angular.copy($scope.new_reference_action[category.id]));

      //reset the input fields
      $scope.new_reference_action[category.id].name = '';
      for(criterion in $scope.currentModule.input.criteria) {
        $scope.new_reference_action[category.id][$scope.currentModule.input.criteria[criterion]['name']] = '';
        $('#new-cat-ref-' + category.id + '-criterion-' + $scope.currentModule.input.criteria[criterion]['id']).removeClass('has-error');
      }
    }
  }

  $scope.blurCATReferenceAction = function(ref, category, criterion) {
    if((ref[criterion.name] == undefined || ref[criterion.name] == "")
    || (criterion['scale']['type'] == 'Numerical' && (ref[criterion.name] < criterion['scale']['min'] || ref[criterion.name] > criterion['scale']['max']))
    || (criterion['scale']['type'] == 'Categorical' && (ref[criterion.name] > criterion['scale']['num_categories'] || ref[criterion.name] < 1)))
      $('#cat-ref-' + category.id + '-criterion-' + criterion['id']).addClass('has-error');
    else
      $('#cat-ref-' + category.id + '-criterion-' + criterion['id']).removeClass('has-error');
  }

  /*** DATA INPUT FUNCTIONS - DELPHI METHOD ***/

  $scope.blurDelphiSubject = function() {
    if($scope.currentModule.input.subject == undefined || $scope.currentModule.input.subject == '')
      $('#delphi-subject').addClass('has-error');
    else
      $('#delphi-subject').removeClass('has-error');
  }

  $scope.addDelphiEmail = function() {
    //if there is an input field not assigned
    if($scope.new_delphi_email.address == undefined || $scope.new_delphi_email.address == '')
      $('#new-delphi-email').addClass('has-error');
    else {
      //assign an unique id to the new email
      if($scope.currentModule.input.emails.length == 0)
        $scope.new_delphi_email.id = 1;
      else
        $scope.new_delphi_email.id = $scope.currentModule.input.emails[$scope.currentModule.input.emails.length - 1]['id'] + 1;

      $scope.currentModule.input.emails.push(angular.copy($scope.new_delphi_email));

      $scope.new_delphi_email.address = '';

      //remove all error classes - just be sure
      $('#new-delphi-email').removeClass('has-error');
    }
  }

  $scope.blurDelphiEmail = function(email) {
    if(email.address == undefined || email.address == '')
      $('#delphi-email-' + email.id).addClass('has-error');
    else
      $('#delphi-email-' + email.id).removeClass('has-error');
  }

  $scope.addDelphiQuestion = function() {
    //if there is an input field not assigned
    if($scope.new_delphi_question.title == undefined || $scope.new_delphi_question.title == '' || $scope.new_delphi_question.description == undefined || $scope.new_delphi_question.description == '') {
      if($scope.new_delphi_question.title == undefined || $scope.new_delphi_question.title == '')
        $('#new-delphi-question-title').addClass('has-error');
      else
        $('#new-delphi-question-title').removeClass('has-error');

      if($scope.new_delphi_question.description == undefined || $scope.new_delphi_question.description == '')
        $('#new-delphi-question-description').addClass('has-error');
      else
        $('#new-delphi-question-description').removeClass('has-error');
    }
    else {
      //assign an unique id to the new email
      if($scope.currentModule.input.questions.length == 0)
        $scope.new_delphi_question.id = 1;
      else
        $scope.new_delphi_question.id = $scope.currentModule.input.questions[$scope.currentModule.input.questions.length - 1]['id'] + 1;

      $scope.currentModule.input.questions.push(angular.copy($scope.new_delphi_question));

      $scope.new_delphi_question.title = '';
      $scope.new_delphi_question.description = '';

      //remove all error classes - just be sure
      $('#new-delphi-question-title').removeClass('has-error');
      $('#new-delphi-question-description').removeClass('has-error');
    }
  }

  $scope.blurDelphiQuestionTitle = function(question) {
    if(question.title == undefined || question.title == '')
      $('#delphi-question-title-' + question.id).addClass('has-error');
    else
      $('#delphi-question-title-' + question.id).removeClass('has-error');
  }

  $scope.blurDelphiQuestionDescription = function(question) {
    if(question.description == undefined || question.description == '')
      $('#delphi-question-description-' + question.id).addClass('has-error');
    else
      $('#delphi-question-description-' + question.id).removeClass('has-error');
  }

  /*** DATA INPUT FUNCTIONS - SRF METHOD ***/

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
    if($scope.currentModule.input['ratio z'] == '' || $scope.currentModule.input['ratio z'] == undefined)
      $('#srf-ratio-z').addClass('has-error');
    else
      $('#srf-ratio-z').removeClass('has-error');
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
                else if(modules[modl]['type'] == 'SRF' && input_type == 'decimal places') {
                  modules[modl]['input']['decimal places'] = modules[mod]['output'][0]['decimal-places'].toString();
                }
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
      if(connections[connection]['id'] == event.target.attributes.id.value) {
        connection_id = connection
        break;
      }

    //reset the data transfered from one module to another
    for(mod in modules)
      if(modules[mod]['id'] == connections[connection_id]['input']) {
        modules[mod]['input'][connections[connection_id]['input_type'].toLowerCase()] = [];
        break;
      }

    //remove the connector from the connections array
    connections.splice(connection_id, 1);

    //remove the connection from the screen
    $(event.target).remove();
  }

  //deletes a certain connection
  function deleteConnection(connection) {
    //reset the data transfered from one module to another
    for(mod in modules)
      if(modules[mod]['id'] == connections[connection]['input']) {
        modules[mod]['input'][connections[connection]['input_type'].toLowerCase()] = [];
        break;
      }

    //remove the connector from the connections array
    connections.splice(connection, 1);

    //remove the connection from the screen
    //does not need to be performed??
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
            //try to execute method
            if(executeMethod(modules[mod]))
              mod_exec++;
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
      if(modules[mod]['type'] != 'InputFile') {
        var input_data = 0;
        //check connections for each input point of the current module
        for(input in modules[mod]['input']) {
          if(modules[mod]['input'][input].length > 0)
            input_data++;
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

  //transfer the data to a certain module, according to its connections
  function transferData(mod) {
    for(input in mod['input'])
      //if no input is defined in the module, then a connection must have been created to this point
      if(mod['input'][input].length == 0)
        for(connection in connections)
          if(connections[connection]['input'] == mod['id'] && connections[connection]['input_type'] == input)
            //find the module connected to the input point and get its output data
            for(modl in modules)
              if(modules[modl]['id'] == connections[connection]['output'] && modules[modl]['output'].length > 0)
                mod['input'][input] = modules[modl]['output'];
  }

  //execute the method correspondent to the mod module
  function executeMethod(mod) {
    var method_executed = false;

    switch(mod['type']) {
      case 'OrderBy':
        mod['output'] = OrderByService.getResults(mod['input']['criteria'], mod['input']['actions']);
        method_executed = true;
        break;

      case 'Sort':
        mod['output'] = mod['order'];
        method_executed = true;
        break;

      case 'CAT-SD':
        var results = CATSDService.getResults(mod['input']['criteria'], mod['input']['interaction effects'], mod['input']['actions'], mod['input']['categories']);

        results.then(function(resolve) {
          mod['output'] = resolve;
        });

        method_executed = true;
        break;

      case 'Delphi':
        var results = DelphiService.startRound($scope.username, proj_id, mod['input']['subject'], mod['input']['emails'], mod['input']['questions'], mod['current_round']);

        results.then(function(resolve) {
          mod['round_id'] = resolve['id'];
        });

        mod['current_round']++;
        method_executed = true;
        break;

      case 'SRF':
        mod['output'] = SRFService.getResults(mod['input']['criteria'], mod['input']['white cards'], mod['input']['ranking'], mod['input']['ratio z'], mod['input']['ratio z'], mod['input']['decimal places'], mod['input']['weight type']);
        break;
    }

    return method_executed;
  }

  function resetOutputFields() {
    for(mod in modules)
      if(modules[mod]['type'] != 'InputFile')
        modules[mod]['output'] = [];
  }

  /*** EXECUTIONS AND RESULTS ***/

  $scope.executions = [];

  //get the executions of the current project
  function getExecutions() {
    $http.get('/projects').then(function(response) {
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the actions previously added
          $scope.executions = response.data[proj]['executions'];
          break;
        }
      }
    });
  }

  //create new execution
  function newExecution() {
    //get created projects
    $http.get('/projects').then(function(response) {
      //create the new execution object
      var new_exec = {};

      //proj_res - new project document; id_doc - id of the old project document
      var proj_res, id_doc;

      for(proj in response.data) {
        if(response.data[proj]['username'] == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //get the largest execution_id
          var exec_id;

          if(response.data[proj]['executions'].length == 0)
            exec_id = 1;
          else
            exec_id = response.data[proj]['executions'][response.data[proj]['executions'].length - 1]['exec_id'] + 1;

          //define the date of the execution
          var current_date = new Date();
          var exec_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();
          var exec_time = + current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

          new_exec['exec_id'] = exec_id;
          new_exec['date'] = exec_date;
          new_exec['time'] = exec_time;
          new_exec['modules'] = modules;
          new_exec['connections'] = connections;

          //insert execution into database
          response.data[proj]['executions'].push(new_exec);
          //get the id of the document, so that it can be removed from the db
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
          //reload executions
          getExecutions();
          //reset output fields
          resetOutputFields();
        });
      });
    });
  }

  //execution selected to be deleted
  $scope.exec_delete = '';

  $scope.deleteExecution = function(exec) {
    $scope.exec_delete = exec;
    $('#delete-execution-modal').modal();
  }

  //delete a certain execution
  $scope.confirmDeleteExecution = function() {
    //get all created projects
    $http.get('/projects').then(function(response) {
      //proj_res - new project document; id_doc - id of the old project document
      var proj_res, id_doc;

      //find the current project
      for(proj in response.data) {
        if(response.data[proj]['username'] == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //remove execution from the executions array
          response.data[proj]['executions'].splice($scope.executions.indexOf($scope.exec_delete), 1);
          //get the id of the document, so that it can be removed from the db
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
          //reload executions
          getExecutions();
          //reset selected execution to be deleted
          $scope.exec_delete = '';
        });
      });
    });
  }

  //open modal to confirm the deletion of all executions of the current project
  $scope.deleteAllExecutions = function() {
    if($scope.executions.length > 0)
      $('#delete-all-executions-modal').modal();
  }

  //confirm the deletion of all executions of the current project
  $scope.confirmDeleteAllExecutions = function() {
    //get all created projects
    $http.get('/projects').then(function(response) {
      //proj_res - new project document; id_doc - id of the old project document
      var proj_res, id_doc;

      //find the current project
      for(proj in response.data) {
        if(response.data[proj]['username'] == $scope.username && response.data[proj]['project_id'] == proj_id) {
          //remove execution from the executions array
          response.data[proj]['executions'] = [];
          //get the id of the document, so that it can be removed from the db
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
          //reload executions
          getExecutions();
        });
      });
    });
  }

  //currently selected execution
  $scope.current_exec = '';
  //execution selected to be compared
  $scope.compare_exec = '';

  $scope.checkCompareExecution = function() {
    if($scope.compare_exec == '')
      return [$scope.current_exec];
    else
      return [$scope.current_exec, $scope.compare_exec];
  }

  //define exec as the currently selected execution
  $scope.selectExecution = function(exec) {
    $scope.current_exec = exec;
    $scope.compare_exec = '';
  }

  $scope.selectCompareExecution = function(exec) {
    $scope.compare_exec = exec;
  }

  $scope.current_exec_page = 0;

  var exec_limit = 4;

  $scope.incrementExecutionPage = function() {
    if($scope.showIncrementPage())
      $scope.current_exec_page = $scope.current_exec_page + exec_limit;
  }

  $scope.showIncrementPage = function() {
    return $scope.current_exec_page + exec_limit < $scope.executions.length;
  }

  $scope.decrementExecutionPage = function() {
    if($scope.showDecrementPage())
      $scope.current_exec_page = $scope.current_exec_page - exec_limit;
  }

  $scope.showDecrementPage = function() {
    return $scope.current_exec_page > 0;
  }

  $scope.checkPage = function(index) {
    return $scope.current_exec_page <= index && index < exec_limit + $scope.current_exec_page;
  }

  $scope.aggregateModuleResults = function(execution) {
    for(mod in execution.modules)
      if(execution.modules[mod]['type'] == 'Delphi') {
        var results = DelphiService.aggregateResults(execution.modules[mod]['round_id']);

        results.then(function(resolve) {
          execution.modules[mod]['output']['questions'] = resolve[0];
          execution.modules[mod]['output']['emails'] = resolve[1];
          execution.modules[mod]['output']['suggestions'] = resolve[2];
          execution.modules[mod]['output']['link'] = resolve[3];
        });
      }
  }

  //order a data array by a certain attribute in a certain direction
  $scope.changeOrder = function(attr, dir, data) {
    data.sort(sortData(attr, dir));
  }

  //sort an array by order and direction
  function sortData(attribute, direction) {
    return function(a, b) {
      if(direction == 'ascendant') {
        if(a[attribute] < b[attribute])
          return -1;
        if(a[attribute] > b[attribute])
          return 1;
        return 0;
      }
      else {
        if(a[attribute] < b[attribute])
          return 1;
        if(a[attribute] > b[attribute])
          return -1;
        return 0;
      }
    }
  }

  /*** DRAG AND DROP FUNCTIONS  - SRF ***/
  //white card available to be dragged
  $scope.white_card = {
    'white_card' : true,
    'id' : 0
  };

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
    else if(data['white_card'] == undefined && noWhiteCards(index))
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

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
  hideAlerts();
});
