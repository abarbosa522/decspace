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

          /*
                              UNCOMMENT
          $scope.reloadData();
          */


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

  /*** MODULES FUNCTIONS ***/

  //created modules
  $scope.modules = [];

  //add a new module to "modules" and the corresponding data
  function createNewModule(method_name) {
    var new_mod = {};

    //id of the new module
    new_mod['id'] = 'orderby' + $scope.modules.length;

    new_mod['criteria'] = {
      //arguments needed to fill the criteria table
      'args' : ['Name', 'Type', 'Direction', 'Order By'],
      //added criteria
      'data' : []
    };

    new_mod['actions'] = {
      //arguments needed to fill the actions table
      //the arguments of "actions" are the criteria
      //they should be added when inserted by the user
      'args' : [],
      'data' : []
    };

    $scope.modules.push(new_mod);
  }

  //id of the currently open module
  $scope.currentModule = '';

  //select the current module
  $scope.selectCurrentModule = function(event) {
    var parent_id = event.target.parentNode.parentNode.id;

    for(mod in $scope.modules)
      if($scope.modules[mod]['id'] == parent_id)
        $scope.currentModule = $scope.modules[mod];
  }

  /*** METHODS FUNCTIONS ***/

  //available methods
  $scope.methods = ['CAT-SD', 'Delphi', 'OrderBy', 'Sort', 'SRF'];

  //add a new method module
  $scope.addMethodModule = function(method) {
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

    //create the data of the new module
    createNewModule('OrderBy');
  }

  /*** STARTUP FUNCTIONS ***/
  requestLogIn();
  rewriteLastUpdate();
});
