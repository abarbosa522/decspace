app.controller('WorkspaceController', function($scope, $window, $http, $compile, $q, OrderByService, CATSDService, InquiryService, SRFService, MethodsService, SortDataService) {
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
      if(!$scope.username.includes('unregistered@decspace.com')) {
        //mark the user as logged off
        $http.get('/accounts').then(function(response) {
          var previous_proj, new_proj;

          for(account in response.data)
            if(response.data[account].email == $scope.username) {
              //delete the id of the account
              delete response.data[account]['_id'];
              //store the current account
              previous_proj = angular.copy(response.data[account]);

              response.data[account].logged_in = false;

              new_proj = response.data[account];
              break;
            }

          $http.put('/accounts', [previous_proj, new_proj]).then(function() {
            $window.location.href = '../../index.html';
          });
        });
      }
      else
        $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').then(function(response) {
      var previous_proj, new_proj;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response.data) {
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          delete response.data[proj]['_id'];
          previous_proj = angular.copy(response.data[proj]);

          //get the name of the project
          $scope.project_name = response.data[proj]['name'];
          //change the date of the last update of the project
          response.data[proj]['last_update'] = last_update;

          //project to store in the db and remove the id of the document
          new_proj = response.data[proj];
          break;
        }
      }

      //update the previous project to the new project
      $http.put('/accounts', [previous_proj, new_proj]).then(function() {
        //retrieve the data stored in the database
        $scope.reloadData(false, '');
        //update the list of executions
        getArchive();
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
      //save the position of the module
      onend: function(event) {
        for(mod in modules)
          if(modules[mod].id == event.target.id)
            modules[mod].position = $('#' + event.target.id).offset();
      }
  });

  function dragMoveListener(event) {
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
  $scope.saveData = function(callback) {

    $http.get('/projects').then(function(response) {
        var previous_proj, new_proj;

        //get the current project
        for(proj in response.data) {
          if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
            delete response.data[proj]['_id'];

            //save the previous project
            previous_proj = angular.copy(response.data[proj]);

            var new_workflow = {};
            new_workflow.modules = modules;
            new_workflow.connections = connections;

            //get current date
            var current_date = new Date();
            var save_date = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();
            var save_time = current_date.getHours() + ':' + current_date.getMinutes() + ':' + current_date.getSeconds();

            new_workflow.date = save_date;
            new_workflow.time = save_time;

            new_workflow.comment = $scope.save_comment;

            var largest_id = 0;

            for(workflow in response.data[proj].archive)
              if(response.data[proj].archive[workflow].id > largest_id)
                largest_id = response.data[proj].archive[workflow].id;

            largest_id++;

            new_workflow.id = largest_id;

            response.data[proj].archive.push(new_workflow);

            //project to store in the db
            new_proj = response.data[proj];
            break;
          }
        }

      //update database project
      $http.put('/projects', [previous_proj, new_proj]).then(function() {
        //show save success alert
        showAlert('save-success');
        //refresh archive
        getArchive();
        //reset comment variable
        $scope.comment = '';

        if(callback != undefined)
          callback();
      });
    });
  }

  //reload workflow
  //if workflow == '', then reload last saved workflow
  $scope.reloadData = function(alertShowing, workflow) {
    $http.get('/projects').then(function(response) {
      //remove current modules and connections
      resetCurrentData();

      //reload last saved workflow
      if(workflow == '') {
        for(proj in response.data)
          if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
            if(response.data[proj].archive.length > 0) {
              modules = response.data[proj].archive[response.data[proj].archive.length - 1].modules;
              connections = response.data[proj].archive[response.data[proj].archive.length - 1].connections;
            }
            break;
          }
      }
      else {
        for(proj in response.data)
          if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
            for(workf in response.data[proj].archive)
              if(response.data[proj].archive[workf].id == workflow) {
                modules = response.data[proj].archive[workf].modules;
                connections = response.data[proj].archive[workf].connections;
                break;
              }
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

            removeEmptyData(data, columns);

            $scope.createInputFileModule(file.name, data);
          };
        }
        //imported file is a json file
        else if(file_extension == 'json') {
          return function(e) {
            var rows = e.target.result.split("\n");

            for(row in rows)
              if(rows[row] != '') {
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

  //delete data rows that are empty or not completely filled
  function removeEmptyData(data, fields) {
    //fields does not include the 'id' attribute
    for(data_row in data)
      if(Object.keys(data[data_row]).length != (fields.length + 1))
        data.splice(data_row, 1);

    return data;
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
        //store the initial position
        new_mod['position'] = {top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10};
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
        //store the initial position
        new_mod['position'] = {top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10};
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
          'scales' : [],
          'functions' : [],
          'actions' : [],
          'categories' : [],
          'interaction effects' : [],
          'reference actions' : []
        };
        //initialize the output data array
        new_mod['output'] = [];
        //store the initial position
        new_mod['position'] = {top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10};
        //store the new module into the modules array
        modules.push(new_mod);
        break;

      case 'Inquiry':
        var new_mod = {};
        //generate the unique id
        var unique_id = generateUniqueId(modules);
        //store the module id
        new_mod['id'] = 'inquiry-' + unique_id;
        //generate and store module name
        new_mod['name_id'] = generateUniqueNameId('Inquiry');
        //store the module type
        new_mod['type'] = 'Inquiry';
        //initialize the input data array
        new_mod['input'] = {
          'subject' : '',
          'description' : '',
          'emails' : [],
          'questions' : [],
          'open_answer_questions' : [],
          'current_round' : 0,
          'suggestions' : {
            'toggle' : false,
            'question' : '',
            'title' : ''
          },
          'personalized_email' : false,
          'email' : {
            'subject' : '',
            'text' : ''
          },
          'color_scheme' : {
            'most_important' : '#00ff00',
            'neutral' : '#d0d0d0',
            'least_important' : '#ff0000'
          },
          'glossary' : [],
          'scale' : ''
        };
        //initialize the output data array
        new_mod['output'] = [];
        //store the initial position
        new_mod['position'] = {top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10};
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
        //store the initial position
        new_mod['position'] = {top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10};
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
    //store the initial position
    new_mod['position'] = {top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10};
    //store the new module into the modules array
    modules.push(new_mod);
  }

  //add a new output file module and corresponding data
  function createOutputFileData(name, output_data, pos, parent_type, input_data) {
    var new_mod = {};
    //generate the unique id
    var unique_id = generateUniqueId(modules);
    new_mod.id = 'outputfile-' + unique_id;

    //store the module type
    new_mod.type = 'Output File';
    //
    new_mod.parent_type = parent_type;
    //store the name of the file
    new_mod.name = name;

    //store the imported data
    if(new_mod.parent_type != 'Inquiry')
      new_mod.output = output_data;
    else
      new_mod.output = {};

    new_mod.input = angular.copy(input_data);

    new_mod.input.round_id = angular.copy(input_data.round_id);
    //store the position
    new_mod.position = pos;

    //SPECIAL CASE - INQUIRY
    if(new_mod.parent_type == 'Inquiry') {
      new_mod.log = {};
      new_mod.log.status = 'running';
      new_mod.input.round_id = angular.copy(input_data.round_id);
    }

    //store the new module into the modules array
    modules.push(new_mod);
  }

  $scope.module_delete = '';
  $scope.module_delete_name = '';

  //select a module to be deleted
  $scope.selectDeleteModule = function(event) {
    $scope.module_delete = event;

    for(mod in modules)
      if(modules[mod].id == $scope.module_delete.target.parentNode.parentNode.attributes.id.value) {
        if(modules[mod].type == 'Input File' || modules[mod].type == 'Output File')
          $scope.module_delete_name = modules[mod].name;
        else
          $scope.module_delete_name = modules[mod].type + modules[mod].name_id;
      }

    $('#delete-module-modal').modal();
  }

  //delete a certain module
  $scope.deleteModule = function() {
    var mod_id = $scope.module_delete.target.parentNode.parentNode.attributes.id.value;

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
          //remove connection from the list of connections
          connections.splice(connect, 1);
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
        $scope.deleteIdReferenceAction = '';
        break;

      case 'Inquiry':
        $scope.new_inquiry_email = {};
        $scope.new_inquiry_question = {};
        $scope.new_inquiry_open_answer_question = {};
        $scope.new_inquiry_glossary = {};

        $scope.new_inquiry_choice = {};
        for(question in $scope.currentModule.input.open_answer_questions)
          if(question.type == 'Multiple Choice')
            $scope.new_inquiry_choice[$scope.currentModule.input.open_answer_questions[question].id] = {};

        $scope.deleteIdEmail = '';
        $scope.deleteIdQuestion = '';
        $scope.deleteIdOpenAnswerQuestion = '';
        $scope.deleteIdGlossaryConcept = '';
        $scope.deleteIdChoice = '';
        break;

      case 'SRF':
        $scope.new_srf_criterion = {};
        $scope.deleteIdCriterion = '';
        break;
    }

    resetErrorClasses($scope.currentModule['type']);

    if($scope.currentModule.parent_type == 'Inquiry' && $scope.currentModule.log.status == 'running')
      aggregateInquiryResults();
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
  $scope.methods = MethodsService.getMethods();

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

      case 'Inquiry':
        //get the method's template
        var temp = document.getElementById('inquiry-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        var unique_id = generateUniqueId(modules);
        temp_clone.find('#inquiry').attr('id', 'inquiry-' + unique_id);
        //add the file name to the module
        temp_clone.find('#mod-name').html('Inquiry' + generateUniqueNameId('Inquiry'));
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //define the initial posiiton of the new module
        $('#inquiry-' + unique_id).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});
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

      case 'Inquiry':
        //get the method's template
        var temp = document.getElementById('inquiry-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#inquiry').attr('id', mod['id']);
        //add the module name to the module
        temp_clone.find('#mod-name').html('Inquiry' + mod['name_id']);
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

      case 'Output File':
        //get the output file template
        var temp = document.getElementById('outputfile-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#outputfile').attr('id', mod['id']);
        //add the file name to the module
        temp_clone.find('#filename').html(mod['name']);
        //cloned elements need to be manually compiled by the angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //set position of module
        $('#' + mod['id']).offset(mod['position']);
        break;
    }
  }

  function createOutputFileModule(name, pos) {
    //get the input file template
    var temp = document.getElementById('outputfile-temp');
    //clone the template
    var temp_clone = $(temp.content).clone();
    //make its id unique
    var unique_id = generateUniqueId(modules);
    temp_clone.find('#outputfile').attr('id', 'outputfile-' + unique_id);
    //add the file name to the module
    temp_clone.find('#filename').html(name);
    //cloned elements need to be manually compiled by the angularJS
    var compiled_temp = $compile(temp_clone)($scope);
    //add the new instance of the template to the document
    compiled_temp.appendTo($('#workspace'));
    //define the initial posiiton of the new input file
    $('#outputfile-' + unique_id).offset(pos);
  }

  /*** DATA DELETION FUNCTIONS ***/

  //selected input to be deleted
  $scope.deleteIdCriterion = '';
  $scope.deleteIdAction = '';
  $scope.deleteIdObject = '';
  $scope.deleteIdInteractionEffect = '';
  $scope.deleteIdBranch = '';
  $scope.deleteIdCategory = '';
  $scope.deleteIdReferenceAction = '';
  $scope.deleteIdEmail = '';
  $scope.deleteIdQuestion = '';
  $scope.deleteIdOpenAnswerQuestion = '';
  $scope.deleteIdGlossaryConcept = '';
  $scope.deleteIdChoice = ['', ''];

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
        $scope.deleteIdBranch = input.id;
        break;

      case 'Categories':
        $scope.deleteIdCategory = input.id;
        break;

      case 'Reference Actions':
        $scope.deleteIdReferenceAction = input.id;
        break;

      case 'Emails':
        $scope.deleteIdEmail = input.id;
        break;

      case 'Questions':
        $scope.deleteIdQuestion = input.id;
        break;

      case 'Open Answer Questions':
        $scope.deleteIdOpenAnswerQuestion = input.id;
        break;

      case 'Glossary':
        $scope.deleteIdGlossaryConcept = input.id;
        break;

      case 'Choice':
        $scope.deleteIdChoice = [input[0].id, input[1].id];
        break;
    }
  }

  //delete the selected input
  $scope.confirmDeleteInput = function(input, type) {
    switch(type) {
      case 'Criteria':
        $scope.currentModule.input.criteria.splice($scope.currentModule.input.criteria.indexOf(input), 1);
        $scope.deleteIdCriterion = '';
        
        //if the current module is of type CAT-SD - remove the correspondant scale
        if($scope.currentModule.type == 'CAT-SD')
          for(scale in $scope.currentModule.input.scales)
            if($scope.currentModule.input.scales[scale].criterion == input.name) {
              $scope.currentModule.input.scales.splice(scale, 1);
              break;
            }
        
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
        $scope.currentModule.input.functions.splice($scope.currentModule.input.functions.indexOf(input), 1);
        $scope.deleteIdBranch = '';
        break;

      case 'Categories':
        $scope.currentModule.input.categories.splice($scope.currentModule.input.categories.indexOf(input), 1);
        $scope.deleteIdCategory = '';
        break;

      case 'Reference Actions':
        $scope.currentModule.input['reference actions'].splice($scope.currentModule.input['reference actions'].indexOf(input), 1);
        $scope.deleteIdReferenceAction = '';
        break;

      case 'Emails':
        $scope.currentModule.input.emails.splice($scope.currentModule.input.emails.indexOf(input), 1);
        $scope.deleteIdEmail = '';
        break;

      case 'Questions':
        $scope.currentModule.input.questions.splice($scope.currentModule.input.questions.indexOf(input), 1);
        $scope.deleteIdQuestion = '';
        break;

      case 'Open Answer Questions':
        $scope.currentModule.input.open_answer_questions.splice($scope.currentModule.input.open_answer_questions.indexOf(input), 1);
        $scope.deleteIdOpenAnswerQuestion = '';
        break;

      case 'Glossary':
        $scope.currentModule.input.glossary.splice($scope.currentModule.input.glossary.indexOf(input), 1);
        $scope.deleteIdGlossaryConcept = '';
        break;

      case 'Choice':
        $scope.currentModule.input.open_answer_questions[$scope.currentModule.input.open_answer_questions.indexOf(input[0])].choices.splice($scope.currentModule.input.open_answer_questions[$scope.currentModule.input.open_answer_questions.indexOf(input[0])].choices.indexOf(input[1]), 1);
        $scope.deleteIdChoice = ['', ''];
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
        $scope.deleteIdBranch = '';
        break;

      case 'Categories':
        $scope.deleteIdCategory = '';
        break;

      case 'Reference Actions':
        $scope.deleteIdReferenceAction = '';
        break;

      case 'Emails':
        $scope.deleteIdEmail = '';
        break;

      case 'Questions':
        $scope.deleteIdQuestion = '';
        break;

      case 'Open Answer Questions':
        $scope.deleteIdOpenAnswerQuestion = '';
        break;

      case 'Glossary':
        $scope.deleteIdGlossaryConcept = '';
        break;

      case 'Choice':
        $scope.deleteIdChoice = ['', ''];
        break;
    }
  }

  /*** CONNECTOR FUNCTIONS ***/

  //created connections
  var connections = [];
  //controls if a first point has already been clicked
  $scope.drawing_line = false;
  var first_event;
  //"type", module id and id of the first point
  var first_type, first_module_id, first_point_id;
  //"type", module id and id of the second point
  var second_type, second_module_id, second_point_id;

  //draw a line connector between two different points
  $scope.drawConnection = function(event, type) {
    //first a first point has not been created yet
    if(!$scope.drawing_line) {
      first_event = event;
      first_type = type;
      first_module_id = event.target.parentElement.attributes.id.value;
      first_point_id = event.target.attributes.id.value;
      $scope.drawing_line = true;
    }
    //if a first point has been created already
    else {
      second_type = type;
      second_module_id = event.target.parentElement.attributes.id.value;
      second_point_id = event.target.attributes.id.value;

      //unsuccessful connection - both points are of the same type or neither of them is of type "output"
      if(first_type == second_type || (first_type != 'output' && second_type != 'output'))
        showAlert('invalid-connection1');
      //unsuccessful connection -  both points belong to the same module
      else if(first_module_id == second_module_id)
        showAlert('invalid-connection2');
      //unsuccessful connection - connection already exists
      else if(connectionExists(first_module_id, second_module_id, first_type, second_type))
        showAlert('invalid-connection3');
      //unsuccessful connection - input point is already connected
      else if(inputConnected(first_module_id, second_module_id, first_type, second_type))
        showAlert('invalid-connection4');
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
                //INQUIRY - SUBJECT
                if(modules[modl]['type'] == 'Inquiry' && input_type == 'subject')
                  modules[modl]['input']['subject'] = modules[mod]['output'][0]['subject'];
                //INQUIRY - SUGGESTIONS TOGGLE
                else if(modules[modl]['type'] == 'Inquiry' && input_type == 'suggestions toggle')
                  modules[modl]['input']['suggestions toggle'] = modules[mod]['output'][0]['suggestions toggle'];
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

                //SPECIAL CASE - CAT-SD CRITERIA
                //when criteria is added, its scales have to be added as well
                if(modules[modl]['type'] == 'CAT-SD' && input_type == 'criteria')
                  for(criterion in modules[modl].input.criteria)
                    modules[modl].input.scales.push({
                      'id' : modules[modl].input.criteria[criterion].id,
                      'criterion' : modules[modl].input.criteria[criterion].name,
                      'type' : '',
                      'min' : '',
                      'max' : '',
                      'num_categories' : ''
                    });

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
        //INQUIRY - SUBJECT
        if(modules[mod].type == 'Inquiry' && connection.input_type == 'subject')
          modules[mod].input.subject = '';
        //INQUIRY - SUGGESTIONS TOGGLE
        else if(modules[mod].type == 'Inquiry' && connection.input_type == 'suggestions toggle')
          modules[mod].input['suggestions toggle'] = false;
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
      //copy current list of modules
      var mod_aux = angular.copy(modules);
      var execution_complete = false;

      while(!execution_complete) {
        mod_aux = executeModules(mod_aux);
        execution_complete = verifyModules(mod_aux);
      }
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
      if(modules[mod]['type'] != 'Input File' && modules[mod]['type'] != 'Output File') {

        var input_data = 0;
        //check connections for each input point of the current module
        for(input in modules[mod]['input']) {
          if(modules[mod]['input'][input].length > 0)
            input_data++;
          //SPECIAL CASE - INQUIRY (EMAILS, CURRENT ROUND, ROUND ID, PERSONALIZED EMAIL, EMAIL, COLOR SCHEME, SUGGESTIONS)
          else if(modules[mod].type == 'Inquiry' && (input == 'emails' || input == 'current_round' || input == 'round_id' || input == 'personalized_email' || input == 'email' || input == 'color_scheme' || input == 'suggestions'))
            input_data++;
          //SPECIAL CASE - SRF
          else if(modules[mod].type == 'SRF' && (input == 'ranking' || input == 'ratio z' || input == 'decimal places' || input == 'weight type'))
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

  function executeModules(mod_aux) {
    for(mod in mod_aux) {
      if(mod_aux[mod].type == 'Output File' || mod_aux[mod].type == 'Input File')
        mod_aux[mod].executed = true;
      else {
        //transfer data between the connections of the current module
        transferData(modules[mod]);

        //check if current module received all necessary data
        //or another module needs to executed first
        if(checkModData(modules[mod])) {
          //try to execute method
          if(executeMethod(modules[mod]))
            mod_aux[mod].executed = true;
        }
      }
    }

    return mod_aux;
  }

  function verifyModules(mod_aux) {
    for(mod in mod_aux)
      if(mod_aux[mod].executed != true)
        return false;

    return true;
  }

  //check if a certain module has already received all necessary data
  function checkModData(mod) {
    for(input in mod.input) {
      //SPECIAL CASE - INQUIRY EMAILS
      if(mod.type == 'Inquiry' && input == 'emails')
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
        createOutputModule(mod);
        break;

      case 'Sort':
        mod.output = angular.copy(mod.input.objects);
        method_executed = true;
        createOutputModule(mod);
        break;

      case 'CAT-SD':
        CATSDService.getResults(mod.input).then(function(data) {
          mod.output = data;
          createOutputModule(mod);
        });

        method_executed = true;
        break;

      case 'Inquiry':
        var results = InquiryService.startRound($scope.username, proj_id, mod.input.subject, mod.input.description, mod.input.emails, mod.input.open_answer_questions, mod.input.questions, mod.input.current_round, mod.input.suggestions, mod.input.personalized_email, mod.input.email, mod.input.color_scheme, mod.input.glossary, mod.input.scale);

        results.then(function(resolve) {
          mod.input.round_id = resolve.id;
          createOutputModule(mod);
        });

        mod.input.current_round++;

        method_executed = true;

        break;

      case 'SRF':
        mod.output = SRFService.getResults(mod.input.criteria, mod.input['white cards'], mod.input.ranking, mod.input['ratio z'], mod.input['decimal places'], mod.input['weight type']);
        createOutputModule(mod);
        method_executed = true;
        break;
    }

    return method_executed;
  }

  //create the output modules for the executed methods
  //a new output module is always created
  function createOutputModule(mod) {
    var mod_name = 'Output - ' + mod.type + mod.name_id;
    
    //define left coordinates based on the type of the module
    var left_pos;
    
    if(mod.type == 'CAT-SD')
      left_pos = mod.position.left + 200;
    else if(mod.type == 'SRF')
      left_pos = mod.position.left + 180;
    else
      left_pos = mod.position.left + 160;
    
    var mod_pos = {top: mod.position.top, left: left_pos};

    createOutputFileModule(mod_name, mod_pos);
    createOutputFileData(mod_name, mod.output, mod_pos, mod.type, mod.input);
  }

  /*** ARCHIVE FUNCTIONS ***/
  $scope.archive = {};

  //refresh the archive, i.e. list of saved workflows
  function getArchive() {
    $http.get('/projects').then(function(response) {
      //get the current project
      for(proj in response.data)
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          $scope.archive = response.data[proj].archive;
          break;
        }
    });
  }

  //open the save workflow modal
  $scope.openSaveDataModal = function() {
    $scope.save_comment = '';
    $('#save-modal').modal();
  }

  //holds the workflow selected to be deleted
  $scope.delete_workflow = '';

  //select a workflow to be deleted
  $scope.deleteWorkflow = function(workflow) {
    $scope.delete_workflow = workflow.id;
  }

  //delete workflow
  $scope.confirmDeleteWorkflow = function(workflow) {
    $http.get('/projects').then(function(response) {
      var previous_proj, new_proj;

      //get the current project
      for(proj in response.data)
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          delete response.data[proj]['_id'];
          previous_proj = angular.copy(response.data[proj]);

          for(workf in response.data[proj].archive)
            if(response.data[proj].archive[workf].id == workflow.id)
              response.data[proj].archive.splice(workf, 1);

          //project to store in the db
          new_proj = response.data[proj];
          break;
        }

      //update the project
      $http.put('/projects', [previous_proj, new_proj]).then(function() {
        //update the list of executions
        getArchive();
        $scope.delete_workflow = '';
      });
    });
  }

  //cancel the deletion of a workflow
  $scope.cancelDeleteWorkflow = function() {
    $scope.delete_workflow = '';
  }

  $scope.deleteAllWorkflows = function() {
    $('#archive-modal').modal('hide');
    $('#delete-all-modal').modal();
  }

  $scope.confirmDeleteAllWorkflows = function() {
    $http.get('/projects').then(function(response) {
      var previous_proj, new_proj;

      //get the current project
      for(proj in response.data)
        if(response.data[proj].username == $scope.username && response.data[proj]['project_id'] == proj_id) {
          delete response.data[proj]['_id'];
          previous_proj = angular.copy(response.data[proj]);

          response.data[proj].archive = [];

          //project to store in the db
          new_proj = response.data[proj];

          break;
        }

      //update the project
      $http.put('/projects', [previous_proj, new_proj]).then(function() {
          //update the list of executions
          getArchive();
          $('#delete-all-modal').modal('hide');
          $('#archive-modal').modal();
          $scope.delete_workflow = '';
      });
    });
  }

  $scope.cancelDeleteAllWorkflows = function() {
    $('#delete-all-modal').modal('hide');
    $('#archive-modal').modal();
  }

  //workflow selected to be reloaded
  $scope.reload_workflow = '';

  //open the confirmation box to save before reloading
  $scope.openSaveConfirmation = function(workflow) {
    $scope.reload_workflow = workflow.id;
    $('#archive-modal').modal('hide');
    $('#save-confirmation-reload-modal').modal();
  }

  //save current workflow and reload the selected one
  $scope.confirmSaveReloadWorkflow = function() {
    $scope.saveData(function() {
      $scope.reloadData(true, $scope.reload_workflow);
    });
  }

  $scope.exportWorkflow = function(workflow) {
    //make a copy of the workflow data
    var workflow_data = angular.copy(workflow);

    //create zip file
    var zip = new JSZip();
    //create modules folder
    zip.folder('modules data');

    for(mod in workflow_data.modules) {
      //get the formats of the input data
      workflow_data.modules[mod].input_formats = {};

      for(input_data in workflow_data.modules[mod].input)
        workflow_data.modules[mod].input_formats[input_data] = typeof workflow_data.modules[mod].input[input_data];

      //get the format of the output data
      workflow_data.modules[mod].output_format = typeof workflow_data.modules[mod].output;

      //create folder for module data
      var input_folder, output_folder;

      if(workflow_data.modules[mod].type == 'Input File' || workflow_data.modules[mod].type == 'Output File') {
        zip.folder('modules data/' + workflow_data.modules[mod].name);
        input_folder = zip.folder('modules data/' + workflow_data.modules[mod].name + '/input');
        output_folder = zip.folder('modules data/' + workflow_data.modules[mod].name + '/output');
      }
      else {
        zip.folder('modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id);
        input_folder = zip.folder('modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id + '/input');
        output_folder = zip.folder('modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id + '/output');
      }

      //transform modules data to CSV files
      var files = generateCSVFiles(workflow_data.modules[mod]);

      //add the input files to the respective folders
      for(input_file in files[0]) {
        input_folder.file(files[2][input_file] + '.csv', files[0][input_file]);

        //modify the workflow data to reference the input files
        if(workflow_data.modules[mod].type == 'Input File' || workflow_data.modules[mod].type == 'Output File')
          workflow_data.modules[mod].input[files[2][input_file]] = 'modules data/' + workflow_data.modules[mod].name + '/input/' + files[2][input_file] + '.csv';
        else
          workflow_data.modules[mod].input[files[2][input_file]] = 'modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id + '/input/' + files[2][input_file] + '.csv';
      }
      
      //add the output files to the respective folders
      //CAT-SD exception - three output files are generated
      if(workflow_data.modules[mod].type == 'CAT-SD' || (workflow_data.modules[mod].type == 'Output File' && workflow_data.modules[mod].parent_type == 'CAT-SD')) {
        for(output_file in files[1])
          output_folder.file(files[3][output_file] + '.csv', files[1][output_file]);
      }
      else  
        output_folder.file('output.csv', files[1]);
      
      //modify the workflow data to reference the output files - CAT-SD exception (three output files are generated)
      if(workflow_data.modules[mod].type == 'CAT-SD')
        workflow_data.modules[mod].output = ['modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id + '/output/' + files[3][0] + '.csv', 'modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id + '/output/' + files[3][1] + '.csv', 'modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id + '/output/' + files[3][2] + '.csv'];
      else if(workflow_data.modules[mod].type == 'Output File' && workflow_data.modules[mod].parent_type == 'CAT-SD')
        workflow_data.modules[mod].output = ['modules data/' + workflow_data.modules[mod].name + '/output/' + files[3][0] + '.csv', 'modules data/' + workflow_data.modules[mod].name + '/output/' + files[3][1] + '.csv', 'modules data/' + workflow_data.modules[mod].name + '/output/' + files[3][2] + '.csv'];
      else if(workflow_data.modules[mod].type == 'Input File' || workflow_data.modules[mod].type == 'Output File')
        workflow_data.modules[mod].output = 'modules data/' + workflow_data.modules[mod].name + '/output/output.csv';
      else
        workflow_data.modules[mod].output = 'modules data/' + workflow_data.modules[mod].type + workflow_data.modules[mod].name_id + '/output/output.csv';
    }

    zip.file('data.json', JSON.stringify(workflow_data));

    zip.generateAsync({type:"blob"}).then(function(content) {
      // see FileSaver.js
      saveAs(content, "workflow.zip");
    });
  }

  function generateCSVFiles(module) {
    //generate input files
    var input_files = [], input_titles = [];

    //iterate over input data (e.g, criteria and actions)
    for(input in module.input) {
      //store title
      input_titles.push(input);
      //transform json data into csv
      input_files.push(JSONtoCSV(module.input[input], input));
    }
    
    //output files of the CAT-SD method consist of three different tables
    //generate output files
    if(module.type == 'CAT-SD' || (module.type == 'Output File' && module.parent_type == 'CAT-SD')) {
      var output_files = [], output_titles = ['Assigned Categories', 'Maximum Similarity Values Per Category', 'Similarity Values Per Reference Action'];
      
      for(output in module.output)
        output_files.push(JSONtoCSV(module.output[output], output));
      
      return [input_files, output_files, input_titles, output_titles];
    }
    else {
      //generate output file
      var output_file = JSONtoCSV(module.output);

      return [input_files, output_file, input_titles];
    }
  }

  $scope.selectImportWorkflow = function() {
    $('#save-confirmation-import-modal').modal();
  }

  $scope.confirmSaveImportWorkflow = function() {
    $scope.saveData(function() {
      $scope.importWorkflow();
    });
  }

  $scope.importWorkflow = function() {
    var input_workflow = document.getElementById('input-workflow');

    for(i = 0; i < input_workflow.files.length; i++) {
      var zip = new JSZip();

      JSZip.loadAsync(input_workflow.files[i]).then(function(zip) {
        zip.file("data.json").async("string").then(function(data) {
          var original_data = JSON.parse(data);

          for(mod in original_data.modules) {
            //unzip input data
            for(input in original_data.modules[mod].input)
              unzipFile(zip, original_data.modules[mod].input[input], mod, input, original_data.modules[mod].input_formats[input], function(res_data, res_mod, res_input, res_format) {
                original_data.modules[res_mod].input[res_input] = CSVtoJSON(res_data, res_format);
              });
            
            //unzip output data
            //CAT-SD exception - three output files are generated
            if(original_data.modules[mod].type == 'CAT-SD' || (original_data.modules[mod].type == 'Output File' && original_data.modules[mod].parent_type == 'CAT-SD'))
              for(output_file in original_data.modules[mod].output)
                unzipFile(zip, original_data.modules[mod].output[output_file], mod, output_file, original_data.modules[mod].output_format, function(res_data, res_mod, res_pos, res_format) {
                  original_data.modules[res_mod].output[res_pos] = CSVtoJSON(res_data, res_format);
                });
            else  
              unzipFile(zip, original_data.modules[mod].output, mod, 0, original_data.modules[mod].output_format, function(res_data, res_mod, res_pos, res_format) {
                original_data.modules[res_mod].output = CSVtoJSON(res_data, res_format);
              });
            
           
          }
          
          //remove current modules and connections
          resetCurrentData();

          //reload imported data
          modules = original_data.modules;
          for(mod in modules)
            reloadModule(modules[mod]);

          connections = original_data.connections;
          for(connection in connections)
            reloadConnection(connections[connection]);
        });
      });
    }
  }

  //get the data from a zipped file
  function unzipFile(zip, data, mod, input, format, callback) {
    zip.file(data).async('string').then(function(res_data) {
      callback(res_data, mod, input, format);
    });
  }

  //reset current modules and connections
  function resetCurrentData() {
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
  }

  /*** DATA TRANFORMATION FUNCTIONS ***/
  function JSONtoCSV(data, name) {
    if(typeof data == 'object') {
      //create new csv file
      var csv_str = '';

      //iterate over the fields
      for(field in data[0])
        csv_str += field + ';';

      csv_str = csv_str.substring(0, csv_str.length - 1);
      csv_str += '\n';

      for(obj in data) {
        for(item in data[obj]) {
          if(data[obj][item] === '')
            csv_str += "''" + ';';
          else
            csv_str += data[obj][item] + ';';
        }
            
        csv_str = csv_str.substring(0, csv_str.length - 1);
        csv_str += '\n';
      }
      
      return csv_str;
    }
    else
      return name + ';\n' + data;
  }

  function CSVtoJSON(data, format) {
    if(format == 'object') {
      var res_data = [];

      var rows = data.split("\n");

      for(row in rows)
        rows[row] = rows[row].trim();

      var columns = rows[0].split(";");

      //remove whitespaces and empty strings
      for(column in columns)
        columns[column] = columns[column].trim();

      for(var i = 1; i < rows.length; i++) {
        var cells = rows[i].split(";");
        var element = {};

        //add the unique id
        element['id'] = i;

        for(var j = 0; j < cells.length; j++) {
          if(cells[j].trim() != '' && columns[j].trim() != '') {
            if(cells[j].trim() == "''")
              element[columns[j]] = '';
            else {
              if(cells[j] == 'true' || cells[j] == 'false')
                element[columns[j]] = (cells[j] == 'true');
              else if(isNaN(cells[j]))
                element[columns[j]] = cells[j];
              else
                element[columns[j]] = Number(cells[j]);
            }
          }
        }

        if(!angular.equals(element, {}))
          res_data.push(element);
      }
      
      for(data_row in res_data)
        if(Object.keys(res_data[data_row]).length == 1)
          res_data.splice(data_row, 1);
      
      return res_data;
    }
    else if(format == 'number') {
      var rows = data.split("\n");

      return Number(rows[1]);
    }
    else if(format == 'string') {
      var rows = data.split("\n");

      return rows[1];
    }
  }

  /*** INQUIRY OUTPUT FUNCTIONS ***/
  //get the results in "real-time" for Inquiry Method
  function aggregateInquiryResults() {
    var results = InquiryService.aggregateResults($scope.currentModule.input.round_id);

    results.then(function(resolve) {
      //questions
      $scope.currentModule.output = resolve[0];
      $scope.currentModule.log.emails = resolve[1];
      $scope.currentModule.log.suggestions = resolve[2];
      $scope.currentModule.log.link = resolve[3];
      $scope.currentModule.log.open_answer_questions = resolve[4];
      $scope.currentModule.log.pending_users = resolve[5];
    });
  }

  $scope.stopInquiry = function() {
    $scope.currentModule.log.status = 'ended';

    $scope.saveData();
  }
  
  $scope.approveRequest = function(user) {
    $http.get('/inquiry_responses').then(function(response) {
      var previous_res, new_res;
      
      for(res in response.data)
        if(response.data[res].user == user.email && response.data[res].round_id == $scope.currentModule.input.round_id) {
          delete response.data[res]['_id'];
          previous_res = angular.copy(response.data[res]);
          
          response.data[res].status = 'approved';
          
          new_res = response.data[res];
          break;
        }
      
      $http.put('/inquiry_responses', [previous_res, new_res]).then(function() {
        $scope.currentModule.log.pending_users.splice($scope.currentModule.log.pending_users.indexOf(user), 1);
        
        //send survey link
        var send_email = {
          'email' : user.email,
          'link' : 'http://decspace.sysresearch.org/content/project-management/inquiry.html?r=' + new_res.round_id + '&u=' + user.email
        };
        
        if(!$scope.currentModule.input.personalized_email)
          $http.post('/default_inquiry_survey', send_email).then(function(response) {});
        else {
          send_email.subject = $scope.currentModule.input.email.subject;
          send_email.text = $scope.currentModule.input.email.text;

          $http.post('/personalized_inquiry_survey', send_email).then(function(response) {});
        }
      });
    });
  }
  
  $scope.rejectRequest = function(user) {
    $http.get('/inquiry_responses').then(function(response) {
      var previous_res, new_res;
      
      for(res in response.data)
        if(response.data[res].user == user.email && response.data[res].round_id == $scope.currentModule.input.round_id) {
          delete response.data[res]['_id'];
          previous_res = angular.copy(response.data[res]);
          
          response.data[res].status = 'rejected';
          
          new_res = response.data[res];
          break;
        }
      
      $http.put('/inquiry_responses', [previous_res, new_res]).then(function() {
        $scope.currentModule.log.pending_users.splice($scope.currentModule.log.pending_users.indexOf(user), 1);
      });
    });
  }
  
  $scope.checkTypeAnswer = function(answer) {
    if(typeof answer == 'object')
      return true;
    else
      return false;
  }
  
  //reorder by "attr" and "dir"
  $scope.sortData = function(attr, dir, data) {
    SortDataService.sortDataVar(data, attr, dir);
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
  hideAlerts();
});
