/* global jQuery*/

(function($) {

  'use strict';

  $.fn.todoist = function(options) {

    var settings = $.extend({}, $.fn.todoist.defaults, options);

    // Everything has to have a name, even "this"
    var placeholder = this;

    // Template for "todo" item
    var todoTemplate = '<div class="todo-item {{ status }}" id="{{ id }}">' +
      '<label for="todo-{{ id }}">' +
      '<div class="col-11 todo-descr">' +
      '<div class="checkbox"><input type="checkbox" name="todo-{{ id }}" id="todo-{{ id }}" {{ checked }} class="checkbox"/><label for="todo-{{ id }}"></label></div>' +
      '<span>{{ name }}</span>' +
      '</div>' +
      '<div class="col-1 todo-delete">' +
      '<a href="#delete-todo" class="icon-trash" title="Delete Todo"><span class="hide-text">Delete</span></a>' +
      '</div>' +
      '</label>' +
      '</div>';

    // Template for status header
    var statusHeaderTemplate = '{{ todo }} Todo items left (out of {{ total }})';


    /**
     * Let's get this party started! *\o/*
     */
    var _init = function(callback) {

      // Fill the list with stored data from localStorage
      _generateTodoList();

      // Create a new Todo
      $(document).on('click', '#' + settings.addItem, function() {
        _addItem();
      });

      // Trash a Todo item
      $(document).on('click', '.icon-trash', function() {
        var toTrashItem = this;
        _trashItem(toTrashItem);
      });

      // Clear completed Todo items
      $(document).on('click', 'button[name="clear_complete"]', function() {
        _clearCompleted();
      });

      // Complete all Todo items in the list
      $(document).on('click', 'button[name="complete_all"]', function(){
        _markAllComplete();
      });

      // Track changes on individual Todo items
      $(document).on('change', ':checkbox', function() {
        if(this.checked === false) {
          _unmarkAsDone(this);
        } else if(this.checked === true) {
          _markAsDone(this);
        }
      });

      // Whatever the user wants to do after _init()
      callback();
    };


    /**
     * Replacing strings in batch
     * @param  {object} obj Objects array with items to replace
     * @return {string}     HTML as string
     */
    String.prototype.batchReplace = function(obj) {
      var returned = this;
      for (var string in obj) {
        returned = returned.replace(new RegExp(string, 'g'), obj[string]);
      }
      return returned;
    };


    /**
     * Parse string into JSON
     * @return {object} Proper parsed JSON
     */
    String.prototype.parseJson = function() {
      return JSON.parse(this);
    };


    /**
     * Render Todo list in full
     * @param  {boolean} refresh true = to refresh, null = default render
     * @return {}
     */
    var _generateTodoList = function(refresh) {
      var savedTodos = _getStoredTodos(),
          html = '';

      if(savedTodos && typeof savedTodos !== 'undefined') {
        // List out all stored todos
        for (var i = 0; i < savedTodos.length; i++) {
          var checked = null;
          if (savedTodos[i].status == 'done') {
            checked = 'checked="checked"';
          } else {
            checked = '';
          }
          html += todoTemplate.batchReplace({
            '{{ status }}': savedTodos[i].status,
            '{{ name }}': savedTodos[i].name,
            '{{ id }}': savedTodos[i].id,
            '{{ checked }}': checked
          });
        }
        if(refresh === true) {
          $(placeholder).html(html);
        } else {
          $(placeholder).append(html);
        }
        _updateStatusHeader();
      }
    };


    /**
     * Render an input to add a Todo item
     */
    var _addItem = function() {
      var localItems = _sortArray(_getStoredTodos());
      var newId = (localItems[localItems.length - 1] ? parseInt(localItems[localItems.length - 1].id) + 1 : 1);
      var inputTemplate = $('<form name="newItemForm">' +
        '<div class="todo-item add-new">' +
        '<label for="todo-new">' +
        '<div class="col-12 todo-descr">' +
        '<input type="text" class="todo-name input-medium col-8" value="" placeholder="Enter a title" name="name"/>' +
        '<input type="hidden" value="' + newId + '" name="id"/>' +
        '<input type="hidden" value="active" name="status"/>' +
        '<button type="submit" class="icon-tick icon-btn"><span class="hide-text">Save</span></button>' +
        '</div>' +
        '</label>' +
        '</div>' +
        '</form>');

      $(placeholder).prepend(inputTemplate);

      $('form', placeholder).find('.todo-name').focus();

      $('form', placeholder).on('submit', function(ev) {
        ev.preventDefault();
        var self = this;
        var newTodo = {
          'name': self.name.value,
          'id': self.id.value,
          'status': self.status.value
        };
        _storeNewTodo(newTodo);
      });

    };


    /**
     * Mark all Todo items as completed
     * @return {function} Store updated status
     */
    var _markAllComplete = function() {
      var checkboxes = placeholder[0].getElementsByTagName('input');
      for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = true;
        _updateStoredStatus(checkboxes[i]);
      }
    };


    /**
     * Clear all completed items
     * @return {function} Remove completed items from storage
     */
    var _clearCompleted = function() {

      $(placeholder).find('.done').each(function(i, obj) {
        _spliceItem(obj);
      });

    };


    /**
     * Mark a single item as Done
     * @param  {object} checkbox Triggered checkbox
     * @return {function}          Store updated status
     */
    var _markAsDone = function(checkbox) {
      var wrapper = _getItemWrapper(checkbox);
      wrapper.addClass('done').removeClass('active');
      _updateStoredStatus(checkbox);
    };


    /**
     * Unmark an item as done
     * @param  {object} item Toto item
     * @return {function}      Store updated status
     */
    var _unmarkAsDone = function(item) {
      var wrapper = _getItemWrapper(item);
      wrapper.removeClass('done').addClass('active');
      _updateStoredStatus(item);
    };


    /**
     * Remove a single item
     * @param  {object} item Item to be removed
     * @return {function}      Remove item from storage
     */
    var _trashItem = function (item) {
        var toTrashItemId = _getItemWrapper(item);
        _spliceItem(toTrashItemId[0]);
    };


    /**
     * Store newly added Todo item to localStorage
     * @param  {object} newTodo JSON data of new item
     * @return {}
     */
    var _storeNewTodo = function(newTodo) {
      var storedData = _getStoredTodos();
      storedData.unshift(newTodo);
      _storeNewData(storedData);
    };


    /**
     * Store updated status in localStorage
     * @param  {object} checkbox Checkbox object
     * @return {function}          Store all data in localStorage
     */
    var _updateStoredStatus = function(checkbox) {
      var storedData = _getStoredTodos();
      var i;

      if(checkbox.checked === true) {
        for (i = 0; i < storedData.length; i++) {
          if(checkbox.id.substr(5) === storedData[i].id) {
            storedData[i].status = 'done';
          }
        }
      } else if (checkbox.checked === false) {
        for (i = 0; i < storedData.length; i++) {
          if(checkbox.id.substr(5) === storedData[i].id) {
            storedData[i].status = 'active';
          }
        }
      }
      _storeNewData(storedData);
    };


    /**
     * Remove completed item from localStorage
     * @param  {object} item Item to be removed
     * @return {function}      Store updated data to localStorage
     */
    var _spliceItem = function(item) {
      console.log(item);
      var storedData = _getStoredTodos();
      for (var i = 0; i < storedData.length; i++) {
        if(storedData[i].id === item.id) {
          storedData.splice(i, 1);
        }
      }
      _storeNewData(storedData);
    };


    /**
     * Get the outer wrapper of a Todo item
     * @param  {object} item Item action'ed on
     * @return {object}      Outer wrapper of Todo item
     */
    var _getItemWrapper = function(item) {
      return $(item).closest('.todo-item');
    };


    /**
     * Get all items from localStorage as parsed JSON
     * @return {array} Parsed JSON objects in array
     */
    var _getStoredTodos = function() {
      if(_hasLocalStorage()) {
        return localStorage.getItem(settings.storageName).parseJson();
      } else {
        return [];
      }
    };


    /**
     * Sort array by ID
     * @param  {array} array Unsorted items array
     * @return {array}       Sorted array
     */
    var _sortArray = function(array) {
      array.sort(function (a,b) {
        if(a.id > b.id) return 1;
        if(a.id < b.id ) return -1;
        return 0;
      });
      return array;
    };


    /**
     * Store updated object to localStorage
     * @param  {object} data Updated JSON object
     * @return {[type]}      [description]
     */
    var _storeNewData = function(data) {
      var newData = JSON.stringify(data);
      localStorage.setItem(settings.storageName, newData);

      // Verify data is stored
      if(_verifyStoredData(data) === true) {
        _refreshList();
      }
    };


    /**
     * Verify data is stored correctly
     * @param  {string} data Data to be stored
     * @return {boolean}      Returns 'true' if equal to new data, 'false' if not
     */
    var _verifyStoredData = function (data) {
      var storedData = _getStoredTodos();
      if(JSON.stringify(storedData) === JSON.stringify(data)) {
        return true;
      }
    };


    /**
     * Refresh the current list of items
     * @return {function} Generate list from stored data
     */
    var _refreshList = function () {
      _generateTodoList(true);
    };


    /**
     * Update the status header with count(s)
     * @return {function} Updated status of todos
     */
    var _updateStatusHeader = function() {
      var storedData = _getStoredTodos();
      var nrOfActive = function() {
        var todoCount = 0;
        for (var i = 0; i < storedData.length; i++) {
          if(storedData[i].status === 'active') {
            todoCount++;
          }
        }
        return todoCount;
      };

      var statusHeaderTxt = statusHeaderTemplate.batchReplace({
        '{{ total }}': storedData.length,
        '{{ todo }}': nrOfActive()
      });

      $(document).find('.controls .status').text(statusHeaderTxt);
    };


    /**
     * Check for localStorage support and existing items
     * @return {boolean} 'true' = has support and has items, 'false' = either no support, or no items
     */
    var _hasLocalStorage = function() {

      var localStoreTodo = (localStorage.getItem(settings.storageName) ? localStorage.getItem(settings.storageName).parseJson() : '');

      if (localStorage && localStoreTodo.length !== 0 && localStoreTodo[0].id) {
        return true;
      } else {
        return false;
      }
    };


    /**
     * Callback function
     * @return {function} Function to call after things are done
     */
    var _complete = function() {
      if ($.isFunction(settings.oncomplete)) {
        settings.oncomplete.call();
      }
    };


    /**
     * Initialize it all
     * @return {function} Callback function to call on completion
     */
    return _init(function() {
      _complete();
    });

  };

  /**
   * Default settings
   * @type {object}
   */
  $.fn.todoist.defaults = {
    addItem: 'add-todo',
    storageName: 'todoist',
    oncomplete: null
  };

}(jQuery));
