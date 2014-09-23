/* global angular */

"use strict";

var app = angular.module("todoApp", ["ngResource", "todoConfig"]);


app.config(["$interpolateProvider", "$httpProvider", "$sceDelegateProvider",
  function($interpolateProvider, $httpProvider) {
    $interpolateProvider.startSymbol("[[").endSymbol("]]");

    $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8;";
    $httpProvider.defaults.headers.put["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8;";

  }
]);


app.controller("TodoController", ["$scope", "$http", "$resource", "storage",
  function($scope, $http, $resource, storage) {

    $scope.initial = {
      "title": "",
      "done": false,
      "date": new Date().getTime()
    };
    $scope.busy = false;

    storage.get(function(res, status) {
      if (status === 200) {
        $scope.todos = res;
      }
    });

    $scope.addTodo = function() {
      angular.element(".newItemForm").show().find("input").focus();
    };

    $scope.saveTodo = function(ev, newTodo) {

      var newItem = {
        "title": newTodo.title
      };

      storage.set($scope.newTodo, function(res, status) {
        if (status == 200 && res.status === "SUCCESS") {
          newItem._id = res.object.id;
          newItem.done = false;
          $scope.todos.push(newItem);

          angular.element(".newItemForm").hide();

          $scope.newTodo.title = "";
          $scope.newItemForm.$setPristine;
        }
      });
    };

    $scope.saveStatus = function(todo) {
      if (!$scope.busy) {
        $scope.busy = true;
        storage.update(todo, function(res, status) {
          if (status == 200 && res.status === "SUCCESS") {
            $scope.busy = false;
          }
        });
      }
    };

    $scope.remove = function(todo) {
      if (!$scope.busy) {
        $scope.busy = true;
        storage.remove(todo, function(res, status) {
          var deletedItem;
          if (status == 200 && res.status === "SUCCESS") {
            $scope.todos.forEach(function(el, i) {
              if (el._id === todo._id) {
                deletedItem = i;
              }
            });
            if (typeof deletedItem !== "undefined") {
              $scope.todos.splice(deletedItem, 1);
            }
          }
          $scope.busy = false;
        });
      }
    };

    $scope.refresh = function () {
      if (!$scope.busy) {
        $scope.busy = true;
        storage.get(function (res, status) {
          if(status === 200) {
            $scope.todos = res;
          }
          $scope.busy = false;
        });
      }
    }

  }
]);


app.factory("storage", ["$http", "$filter", "settings",
  function($http, $filter, settings) {
    return {

      get: function(callback) {
        $http({
          method: "GET",
          url: settings.apiUrl
        }).success(function(res, status) {
          callback(res, status);
        });
      },

      set: function(item, callback) {
        item.done = "false";
        $http({
          method: "POST",
          url: settings.apiUrl,
          data: {
            title: item.title,
            done: item.done,
            date: new Date().getTime()
          },
          headers: {
            "Content-Type": "application/json"
          }
        }).success(function(res, status) {
          callback(res, status);
        });
      },

      update: function(item, callback) {
        $http({
          method: "PUT",
          url: settings.apiUrl + "/" + item._id,
          data: item,
          headers: {
            "Content-Type": "application/json"
          }
        }).success(function(res, status) {
          callback(res, status);
        });
      },

      remove: function(item, callback) {
        $http({
          method: "DELETE",
          url: settings.apiUrl + "/" + item._id
        }).success(function(res, status) {
          callback(res, status);
        });
      }

    };
  }
]);


app.directive("ngControls", ["storage",
  function(storage) {
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

        // scope.completeAll = function() {
        //   for (var i = 0; i < scope.todos.length; i++) {
        //     scope.todos[i].done = true;
        //   }
        //   storage.update(scope.todos);
        // };

        // scope.clearCompleted = function() {
        //   var completed = function() {
        //       var returnArray = [];
        //       for (var i = 0; i < scope.todos.length; i++) {
        //         if(scope.todos[i].done === true) {
        //           returnArray.push(scope.todos[i]);
        //         }
        //       }
        //       return returnArray;
        //     },
        //   completedItems = completed();
        //   for (var i = 0; i < completedItems.length; i++) {
        //     storage.remove(completedItems[i]);
        //   }
        // };

      }
    };
  }
]);
