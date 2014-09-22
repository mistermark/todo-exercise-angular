var app = angular.module("todoConfig", []);

app.factory("settings", function() {
  return {
    "apiUrl": "http://localhost:5123/api/todos"
  };
});
