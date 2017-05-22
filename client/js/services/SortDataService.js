app.service('SortDataService', function() {

  this.sortDataVar = function(data, order, direction) {
    data.sort(sortData(order, direction));
    return data;
  }

  this.sortDataDates = function(data, order, direction) {
    data.sort(sortDates(order, direction));
    return data;
  }

  function sortData(order, direction) {
    return function(a, b) {
      var var1, var2;

      if(typeof a[order] == 'string')
        var1 = a[order].toLowerCase();
      else
        var1 = a[order];

      if(typeof b[order] == 'string')
        var2 = b[order].toLowerCase();
      else
        var2 = b[order];

      if(direction == 'ascendant') {
        if(var1 < var2)
          return -1;
        if(var1 > var2)
          return 1;
        return 0;
      }
      else {
        if(var1 < var2)
          return 1;
        if(var1 > var2)
          return -1;
        return 0;
      }
    }
  }

  //sort dates by "order" and "direction"
  function sortDates(order, direction) {
    return function(a, b) {
      //parse the first date
      var date1 = new Date();
      var day = a[order].substr(0, a[order].indexOf('-'));
      var month = a[order].substr(a[order].indexOf('-') + 1);
      month = month.substr(0, month.indexOf('-'));
      var year = a[order].substr(a[order].lastIndexOf('-') + 1, a[order].length - 1);
      date1.setFullYear(year, Number(month) - 1, day);

      //parse the second date
      var date2 = new Date();
      day = b[order].substr(0, b[order].indexOf('-'));
      month = b[order].substr(b[order].indexOf('-') + 1);
      month = month.substr(0, month.indexOf('-'));
      year = b[order].substr(b[order].lastIndexOf('-') + 1, b[order].length - 1);
      date2.setFullYear(year, Number(month) - 1, day);

      if(direction == 'ascendant') {
        if(date1 < date2)
          return -1;
        if(date1 > date2)
          return 1;
        return 0;
      }
      else {
        if(date1 < date2)
          return 1;
        if(date1 > date2)
          return -1;
        return 0;
      }
    }
  }

});
