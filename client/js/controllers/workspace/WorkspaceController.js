app.controller('WorkspaceController', function($scope, $window, $http, $compile) {
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
          /*
                              UNCOMMENT
          getExecutions();
          */

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

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
  }

  /*** BUTTON BAR FUNCTIONS ***/

  //save the current data
  $scope.saveData = function() {
    $http.get('/projects').success(function(response) {
      //save the position of all modules
      for(mod in $scope.modules)
        $scope.modules[mod]['position'] = $('#' + $scope.modules[mod]['id']).offset();

        var id_doc, proj_res;

        //get the current project
        for(proj in response) {
          if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
            //insert modules
            response[proj]['modules'] = $scope.modules;
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
      for(mod in $scope.modules)
        $('#' + $scope.modules[mod]['id']).remove();

      $scope.modules = [];

      for(proj in response) {
        if(response[proj].username == $scope.username && response[proj]['project_id'] == proj_id) {
          if(response[proj]['modules'] != undefined)
            $scope.modules = response[proj]['modules'];

          break;
        }
      }

      //add the method module to the screen
      for(mod in $scope.modules)
        addModule($scope.modules[mod]);
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
  $scope.modules = [];

  //add a new module to "modules" and the corresponding data
  function createModuleData(mod) {
    switch(mod) {
      case 'OrderBy':
        var new_mod = {};
        //generate the unique id
        new_mod['id'] = 'orderby' + $scope.modules.length;
        //store the module type
        new_mod['type'] = 'OrderBy';
        //initialize the criteria array
        new_mod['criteria'] = [];
        //initialize the actions array
        new_mod['actions'] = [];
        //store the new module into the modules array
        $scope.modules.push(new_mod);
        break;
    }
  }

  //add a new input file module and correspondign data
  function createInputFileData(name, data) {
    var new_mod = {};
    //generate the unique id
    new_mod['id'] = 'inputfile' + $scope.modules.length;
    //store the module type
    new_mod['type'] = 'InputFile';
    //store the name of the file
    new_mod['name'] = name;
    //store the imported data
    new_mod['data'] = data;
    //store the new module into the modules array
    $scope.modules.push(new_mod);
  }

  //id of the currently open module
  $scope.currentModule = '';

  //select the current module
  $scope.selectCurrentModule = function(event) {
    var parent_id = event.target.parentNode.id;

    for(mod in $scope.modules)
      if($scope.modules[mod]['id'] == parent_id)
        $scope.currentModule = $scope.modules[mod];

    //reset the select deletion variables
    switch($scope.currentModule['type']) {
      case 'OrderBy':
        $scope.deleteIdOrderByCriterion = '';
        $scope.deleteIdOrderByAction = '';
        break;
    }
  }

  //delete the currently selected module
  $scope.deleteCurrentModule = function() {
    //close the open modal
    switch($scope.currentModule['type']) {
      case 'InputFile':
        $('#inputfile-modal').modal('hide');
        break;
      case 'OrderBy':
        $('#orderby-modal').modal('hide');
        break;
    }
    //remove module from the DOM
    $('#' + $scope.currentModule['id']).remove();
    //delete the module's data
    $scope.modules.splice($scope.modules.indexOf($scope.currentModule), 1);
    //reset the currentModule variable, since the modal was closed
    $scope.currentModule = '';
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
        temp_clone.find('#orderby').attr('id', 'orderby' + $scope.modules.length);
        //cloned elements need to be manually compiled - angularJS
        var compiled_temp = $compile(temp_clone)($scope);
        //add the new instance of the template to the document
        compiled_temp.appendTo($('#workspace'));
        //define the initial posiiton of the new module
        $('#orderby' + $scope.modules.length).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});
        break;
    }

    //create the data of the new module
    createModuleData(mod);
  }

  $scope.createInputFileModule = function(name, data) {
    //get the input file template
    var temp = document.getElementById('inputfile-temp');
    //clone the template
    var temp_clone = $(temp.content).clone();
    //make its id unique
    temp_clone.find('#inputfile').attr('id', 'inputfile' + $scope.modules.length);
    //add the file name to the module
    temp_clone.find('a').html(name);
    //cloned elements need to be manually compiled by the angularJS
    var compiled_temp = $compile(temp_clone)($scope);
    //add the new instance of the template to the document
    compiled_temp.appendTo($('#workspace'));
    //define the initial posiiton of the new input file
    $('#inputfile' + $scope.modules.length).offset({top: $('#svg').offset().top + 10, left: $('#svg').offset().left + 10});

    createInputFileData(name, data);
  }

  //add the module mod to the workspace
  function addModule(mod) {
    switch(mod['type']) {
      case 'OrderBy':
        //get the method's template
        var temp = document.getElementById('orderby-temp');
        //clone the template
        var temp_clone = $(temp.content).clone();
        //make its id unique
        temp_clone.find('#orderby').attr('id', mod['id']);
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
        temp_clone.find('a').html(mod['name']);
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
    if($scope.currentModule.criteria.length == 0)
      $scope.new_criterion.id = 1;
    else
      $scope.new_criterion.id = $scope.currentModule.criteria[$scope.currentModule.criteria.length - 1]['id'] + 1;

    //the criterion is not selected by default
    $scope.new_criterion.selected = false;

    //add the new criterion to the
    $scope.currentModule.criteria.push(angular.copy($scope.new_criterion));

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
    $scope.currentModule.criteria.splice($scope.currentModule.criteria.indexOf(criterion), 1);
    $scope.deleteIdOrderByCriterion = '';
  }

  //cancel the criterion selection
  $scope.cancelDeleteOrderByCriterion = function() {
    $scope.deleteIdOrderByCriterion = '';
  }

  //select the criterion that defines the order
  $scope.selectOrderByCriterion = function(criterion) {
    $scope.currentModule.criteria[$scope.currentModule.criteria.indexOf(criterion)]['selected'] = true;
  }

  //add a new action
  $scope.addOrderByAction = function() {
    if($scope.currentModule.actions.length == 0)
      $scope.new_action.id = 1;
    else
      $scope.new_action.id = $scope.currentModule.actions[$scope.currentModule.actions.length - 1]['id'] + 1;

    $scope.currentModule.actions.push(angular.copy($scope.new_action));

    $scope.new_action.name = '';

    for(criterion in $scope.currentModule.criteria)
      $scope.new_action[$scope.currentModule.criteria[criterion]['name']] = '';
  }

  //selected action to be deleted
  $scope.deleteIdOrderByAction = '';

  //select a certain action to be deleted
  $scope.deleteOrderByAction = function(action) {
    $scope.deleteIdOrderByAction = action.id;
  }

  //delete the selected action
  $scope.confirmDeleteOrderByAction = function(action) {
    $scope.currentModule.actions.splice($scope.currentModule.actions.indexOf(action), 1);
    $scope.deleteIdOrderByAction = '';
  }

  //cancel the action selection
  $scope.cancelDeleteOrderByAction = function() {
    $scope.deleteIdOrderByAction = '';
  }

  /*** CONNECTOR FUNCTIONS ***/
  //created lines
  var lines = [];
  //controls if a first point has already been clicked
  var drawing_line = false;
  //holds the first point's coordinates
  var line_x, line_y;
  //holds the "type" of the first point - output, criteria, actions, etc
  var first_type;
  //holds the id of the module of the first point
  var first_module_id;

  //draw a line connector between two different points
  $scope.drawLine = function(event) {
    //first a first point has not been created yet
    if(!drawing_line) {
      var new_coords = transformCoordinates($(event.target).offset().left, $(event.target).offset().top - window.scrollY);
      //store the coordinates of the first point
      line_x = new_coords[0];
      line_y = new_coords[1];
      //store the "type" of the first point
      first_type = event.target.nextElementSibling.innerHTML;
      //store the id of the module of the first point
      first_module_id = event.target.parentElement.attributes.id.value;

      drawing_line = true;
    }
    //if a first point has been created already
    else {
      //"type" of the second point
      var second_type = event.target.nextElementSibling.innerHTML;
      //id of the module of the second point
      var second_module_id = event.target.parentElement.attributes.id.value;

      //unsuccessful connection if both points are of the same type or neither of them is of type "Output"
      if(first_type == second_type || (first_type != 'Output' && second_type != 'Output')) {
        showAlert('invalid-connection1');
      }
      //unsuccessful connection -  both points belong to the same module
      else if(first_module_id == second_module_id) {
        showAlert('invalid-connection2');
      }
      //successful connection
      else {
        var new_coords = transformCoordinates($(event.target).offset().left, $(event.target).offset().top - window.scrollY);
        //create a new SVG line
        var new_line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        //set the coordinates of the line
        new_line.setAttribute('x1', line_x);
        new_line.setAttribute('y1', line_y);
        new_line.setAttribute('x2', new_coords[0]);
        new_line.setAttribute('y2', new_coords[1]);
        //set the color of the line
        new_line.setAttribute('stroke', 'rgb(255, 0, 0)');
        //set the width of the line
        new_line.setAttribute('stroke-width', '2');
        //append the new line to the svg area
        $('#svg').append(new_line);
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

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
  hideAlerts();
});
