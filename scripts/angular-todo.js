/* global angular */

// localStorage.setItem("todoist", '[{"name": "Make coffee", "id": 4, "done": false}, {"name": "Buy milk", "id": 3, "done": true}, {"name": "Put out the trash", "id": 2, "done": true}, {"name": "Drink a beer", "id": 1, "done": true}]');

/**
 * todoApp Module
 *
 * Description
 */
"use strict";
var app = angular.module("todoApp", []);


app.config(["$interpolateProvider", function($interpolateProvider) {
  $interpolateProvider.startSymbol("[[").endSymbol("]]");
}]);


app.controller("TodoController", ["$scope", "storage", function($scope, storage) {

  $scope.todos = storage.get("todoist");

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


app.factory("storage", ["$filter", function($filter){
  var localStore = JSON.parse(localStorage.getItem("todoist"));
  return {

    get: function(sorted) {
      if(sorted === true) {
        return $filter("orderBy")(localStore, "id", false);
      } else {
        return localStore;
      }
    },
    set: function(item) {
      if(item.length > 1) {
        localStorage.setItem("todoist", JSON.stringify(item));
      } else {
        localStore.unshift(item);
        localStorage.setItem("todoist", JSON.stringify(localStore));
      }
    },
    update: function(item) {
      for (var i = 0; i < localStore.length; i++) {
        if(localStore[i].id === item.id) {
          localStore.done = item.done;
        }
      }
      localStorage.setItem("todoist", JSON.stringify(localStore));
    },
    remove: function(item) {
      for (var i = 0; i < localStore.length; i++) {
        if(localStore[i].id === item.id) {
          localStore.splice(i, 1);
        }
      }
      localStorage.setItem("todoist", JSON.stringify(localStore));
    }

  };
}]);


app.directive("todoAddnew", ["$filter", "$templateCache", "storage", function($filter, $templateCache, storage) {
  return {
    link: function($scope) {


      $scope.addTodo = function() {
        angular.element(".newItemForm").show().find("input").focus();
      };

      $scope.saveTodo = function() {
        $scope.sorted = storage.get(true);

        $scope.newTodo.id = ($scope.sorted.length ? $scope.sorted[$scope.sorted.length - 1].id + 1 : 1);

        var newItem = {
          "id": $scope.newTodo.id,
          "name": $scope.newTodo.name,
          "done": false
        };

        storage.set(newItem);

        angular.element(".newItemForm").hide();
        $scope.newTodo.name = "";
        $scope.newTodo.id = "";
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
