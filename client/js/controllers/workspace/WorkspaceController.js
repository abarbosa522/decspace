app.controller('WorkspaceController', function($scope, $window, $http, $compile, OrderByService) {
  /*** SETUP FUNCTIONS ***/

  //get the id of the open project
  var url = window.location.href;
  var proj_id = Number(url.substr(url.indexOf('?id=') + 4));

  //check if there is a user logged in
  function requestLogIn() {
    $http.get('/requestlogin').success(function(res) {
      if(typeof res.user == 'undefined')
        $window.location.href = '../homepage/login.html';
      else {
        $scope.username = res.user;
        //get all accounts and find the name of the logged user
        $http.get('/accounts').success(function(response) {
          for(account in response) {
            if(response[account].email == $scope.username) {
              $scope.name = response[account].name;
              break;
            }
          }
        });
      }
    });
  }

  //log out current user
  $scope.logOut = function() {
    $http.get('/logout').success(function(res) {
      $window.location.href = '../../index.html';
    });
  }

  //change "last update" field to current date and get the selected method
  function rewriteLastUpdate() {
    //get all projects from database
    $http.get('/projects').success(function(response) {
      var id_doc, proj_res;

      //get current date
      var current_date = new Date();
      var last_update = current_date.getDate() + '-' + (current_date.getMonth() + 1) + '-' + current_date.getFullYear();

      //get the selected project
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the name of the project
          $scope.project_name = response[proj]['name'];
          //change the date of the last update of the project
          response[proj]['last_update'] = last_update;
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db and remove the id of the document
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function(){
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
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
    $http.get('/projects').success(function(response) {
      //save the position of all modules
      for(mod in modules)
        modules[mod]['position'] = $('#' + modules[mod]['id']).offset();

        var id_doc, proj_res;

        //get the current project
        for(proj in response) {
          if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
            //insert the created modules into the database
            response[proj]['modules'] = modules;
            //insert the created connections into the database
            response[proj]['connections'] = connections;
            //get the id of the document
            id_doc = response[proj]['_id'];
            //project to store in the db
            proj_res = response[proj];
            delete proj_res['_id'];
            break;
          }
        }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          //show save success alert
          showAlert('save-success');
        });
      });
    });
  }

  //reload last save
  $scope.reloadData = function() {
    $http.get('/projects').success(function(response) {
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

      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          if(response[proj]['modules'] != undefined)
            modules = response[proj]['modules'];

          if(response[proj]['connections'] != undefined)
            connections = response[proj]['connections'];

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

              for(var j = 0; j < cells.length; j++)
                if(cells[j].trim() != '' && columns[j].trim() != '')
                  element[columns[j]] = cells[j];

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
  $scope.currentModule = '';

  //select the current module
  $scope.selectCurrentModule = function(event) {
    var parent_id = event.target.parentNode.id;

    for(mod in modules)
      if(modules[mod]['id'] == parent_id)
        $scope.currentModule = modules[mod];

    //reset the select deletion variables
    switch($scope.currentModule['type']) {
      case 'OrderBy':
        $scope.deleteIdOrderByCriterion = '';
        $scope.deleteIdOrderByAction = '';
        break;
    }
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
    }
  }

  /*** DATA INPUT FUNCTIONS ***/

  //OrderBy Method

  //add a new criterion
  $scope.addOrderByCriterion = function() {
    //assign an unique id to the new criterion
    if($scope.currentModule.input.criteria.length == 0)
      $scope.new_criterion.id = 1;
    else
      $scope.new_criterion.id = $scope.currentModule.input.criteria[$scope.currentModule.input.criteria.length - 1]['id'] + 1;

    //the criterion is not selected by default
    $scope.new_criterion.selected = false;

    //add the new criterion to the
    $scope.currentModule.input.criteria.push(angular.copy($scope.new_criterion));

    //reset the criterion input fields
    $scope.new_criterion.name = '';
    $scope.new_criterion.type = '';
    $scope.new_criterion.direction = '';
  }

  //selected criterion to be deleted
  $scope.deleteIdOrderByCriterion = '';

  //select a certain criterion to be deleted
  $scope.deleteOrderByCriterion = function(criterion) {
    $scope.deleteIdOrderByCriterion = criterion.id;
  }

  //delete the selected criterion
  $scope.confirmDeleteOrderByCriterion = function(criterion) {
    $scope.currentModule.input.criteria.splice($scope.currentModule.input.criteria.indexOf(criterion), 1);
    $scope.deleteIdOrderByCriterion = '';
  }

  //cancel the criterion selection
  $scope.cancelDeleteOrderByCriterion = function() {
    $scope.deleteIdOrderByCriterion = '';
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
    if($scope.currentModule.input.actions.length == 0)
      $scope.new_action.id = 1;
    else
      $scope.new_action.id = $scope.currentModule.input.actions[$scope.currentModule.input.actions.length - 1]['id'] + 1;

    $scope.currentModule.input.actions.push(angular.copy($scope.new_action));

    $scope.new_action.name = '';

    for(criterion in $scope.currentModule.input.criteria)
      $scope.new_action[$scope.currentModule.input.criteria[criterion]['name']] = '';
  }

  //selected action to be deleted
  $scope.deleteIdOrderByAction = '';

  //select a certain action to be deleted
  $scope.deleteOrderByAction = function(action) {
    $scope.deleteIdOrderByAction = action.id;
  }

  //delete the selected action
  $scope.confirmDeleteOrderByAction = function(action) {
    $scope.currentModule.input.actions.splice($scope.currentModule.input.actions.indexOf(action), 1);
    $scope.deleteIdOrderByAction = '';
  }

  //cancel the action selection
  $scope.cancelDeleteOrderByAction = function() {
    $scope.deleteIdOrderByAction = '';
  }

  /*** CONNECTOR FUNCTIONS ***/

  //created connections
  var connections = [];
  //controls if a first point has already been clicked
  var drawing_line = false;
  //holds all the information of the first point
  var first_event;

  //draw a line connector between two different points
  $scope.drawConnection = function(event) {
    //first a first point has not been created yet
    if(!drawing_line) {
      first_event = event;
      drawing_line = true;
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
        //set the color of the connector
        new_line.setAttribute('stroke', 'rgb(255, 0, 0)');
        //set the width of the connector
        new_line.setAttribute('stroke-width', '3');

        //get the id of the connector
        var unique_id = generateUniqueId(connections);

        //set the id of the connector
        new_line.setAttribute('id', 'line-' + unique_id);

        //set a click event
        new_line.setAttribute('ng-click', 'deleteConnection($event)')
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
            for(modl in modules)
              if(modules[modl]['id'] == input)
                modules[modl]['input'][input_type.toLowerCase()] = angular.copy(modules[mod]['output']);
            break;
          }
      }
      //reset the drawing process
      drawing_line = false;
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
    //set the color of the line
    new_line.setAttribute('stroke', 'rgb(255, 0, 0)');
    //set the width of the line
    new_line.setAttribute('stroke-width', '3');
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
        for(input in modules[mod]['input'])
          for(connection in connections)
            if((connections[connection]['input'] == modules[mod]['id'] && connections[connection]['input_type'] == input) || modules[mod]['input'][input].length > 0) {
              input_data++;
              break;
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
    $http.get('/projects').success(function(response) {
      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the actions previously added
          $scope.executions = response[proj]['executions'];
          break;
        }
      }
    });
  }

  //create new execution
  function newExecution() {
    //get created projects
    $http.get('/projects').success(function(response) {
      //create the new execution object
      var new_exec = {};

      //proj_res - new project document; id_doc - id of the old project document
      var proj_res, id_doc;

      for(proj in response) {
        if(response[proj]['username'] == $scope.username && response[proj]['project_id'] == proj_id) {
          //get the largest execution_id
          var exec_id;

          if(response[proj]['executions'].length == 0)
            exec_id = 1;
          else
            exec_id = response[proj]['executions'][response[proj]['executions'].length - 1]['exec_id'] + 1;

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
          response[proj]['executions'].push(new_exec);
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
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
    $http.get('/projects').success(function(response) {
      //proj_res - new project document; id_doc - id of the old project document
      var proj_res, id_doc;

      //find the current project
      for(proj in response) {
        if(response[proj]['username'] == $scope.username && response[proj]['project_id'] == proj_id) {
          //remove execution from the executions array
          response[proj]['executions'].splice($scope.executions.indexOf($scope.exec_delete), 1);
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
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
    $http.get('/projects').success(function(response) {
      //proj_res - new project document; id_doc - id of the old project document
      var proj_res, id_doc;

      //find the current project
      for(proj in response) {
        if(response[proj]['username'] == $scope.username && response[proj]['project_id'] == proj_id) {
          //remove execution from the executions array
          response[proj]['executions'] = [];
          //get the id of the document, so that it can be removed from the db
          id_doc = response[proj]['_id'];
          //project to store in the db
          proj_res = response[proj];
          delete proj_res['_id'];
          break;
        }
      }

      //delete the previous document with the list of projects
      $http.delete('/projects/' + id_doc).success(function() {
        //add the new list of projects
        $http.post('/projects', proj_res).success(function() {
          //reload executions
          getExecutions();
        });
      });
    });
  }

  //currently selected execution
  $scope.current_exec = '';

  //define exec as the currently selected execution
  $scope.selectExecution = function(exec) {
    $scope.current_exec = exec;
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

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
  hideAlerts();
});
