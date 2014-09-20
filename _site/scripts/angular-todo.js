/* global angular */

/**
 * todoApp Module
 *
 * Description
 */

"use strict";

var app = angular.module("todoApp", []);


app.config(["$interpolateProvider", "$httpProvider",
  function($interpolateProvider, $httpProvider) {
    $interpolateProvider.startSymbol("[[").endSymbol("]]");

    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
    // $httpProvider.defaults.useXDomain = true;
    // delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }
]);


app.factory('settings', function(){
  return {
    "appname": "todoist-ang",
    "apiUrl": "http://localhost:5123/api/todos"
  }
});


app.controller("TodoController", ["$scope", "$http", "settings", "storage", function($scope, $http, settings, storage) {

  storage.get(function (res) {
    $scope.todos = res;
  });

}]);


app.directive("todoItem", ["storage", function(storage){
  return {
    link: function(scope) {
      scope.saveStatus = function() {
        storage.update(scope.todo);
      };
      scope.remove = function() {
        storage.remove(scope.todo);
      };
    }
  };
}]);


app.factory("storage", ["$http", "$filter", "settings", function($http, $filter, settings){
  var localStore = JSON.parse(localStorage.getItem(settings.appname));
  return {

    get: function(callback) {
      $http.get(settings.apiUrl).success(callback);
    },

    set: function(item, callback) {
      console.log(item);
      // if(item.length > 1) {
      //   localStorage.setItem(settings.appname, JSON.stringify(item));
      // } else {
        // remoteStore.unshift(item);
        // localStorage.setItem(settings.appname, JSON.stringify(remoteStore));
      // }
      // $http.post(settings.apiUrl, item.title).success(callback);
      $http({
        url: settings.apiUrl,
        method: "POST",
        data: item
      }).success(function(res, status) {

      })
      .error(function(mssg) {

      });
    },

    update: function(item) {
      for (var i = 0; i < remoteStore.length; i++) {
        if(remoteStore[i].id === item.id) {
          remoteStore.done = item.done;
        }
      }
      localStorage.setItem(settings.appname, JSON.stringify(remoteStore));
    },

    remove: function(item) {
      for (var i = 0; i < remoteStore.length; i++) {
        if(remoteStore[i].id === item.id) {
          remoteStore.splice(i, 1);
        }
      }
      localStorage.setItem(settings.appname, JSON.stringify(remoteStore));
    },

    refresh: function(item) {
      //...
    }

  };
}]);


app.directive("todoAddnew", ["$filter", "$http", "storage", "settings", function($filter, $http, storage, settings) {
  return {
    link: function($scope) {



      $scope.addTodo = function() {
        angular.element(".newItemForm").show().find("input").focus();
      };

      $scope.newTodo = {};

      $scope.saveTodo = function() {
        console.log($scope.newTodo);

        $http.post(settings.apiUrl, $scope.newTodo).success(function(res){
          console.log(res);
        });
        // var newItem = {
        //   "title": $scope.newTodo.title,
        //   "done": false
        // };

        // storage.set(newItem);

        // angular.element(".newItemForm").hide();
        // $scope.newTodo.title = "";
      };

    }
  };
}]);


app.directive("ngControls", ["storage", function(storage) {
  return {
    restrict: "A",
    link: function(scope) {

      scope.remaining = function() {
        var undone = 0;
        angular.forEach(scope.todos, function(todo) {
          undone += todo.done ? 0 : 1;
        });
        return undone;
      };

      scope.completeAll = function() {
        for (var i = 0; i < scope.todos.length; i++) {
          scope.todos[i].done = true;
        }
        storage.update(scope.todos);
      };

      scope.clearCompleted = function() {
        var completed = function() {
            var returnArray = [];
            for (var i = 0; i < scope.todos.length; i++) {
              if(scope.todos[i].done === true) {
                returnArray.push(scope.todos[i]);
              }
            }
            return returnArray;
          },
        completedItems = completed();
        for (var i = 0; i < completedItems.length; i++) {
          storage.remove(completedItems[i]);
        }
      };

    }
  };
}]);
