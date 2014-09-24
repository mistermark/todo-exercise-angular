---
---
var app = angular.module("todoConfig", []);

app.factory("settings", function() {
  return {
    "apiUrl": "{{ site.api }}"
  };
});
