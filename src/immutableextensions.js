(function(){

var I = (typeof require !== "undefined" ? require("immutable") : window.Immutable);

I.keyInMap = function(othermap) { return function (v, k) { return othermap.has(k); }; };

I.keyIn = function(/*...keys*/) {
  var keySet = Immutable.Set(arguments); 
  return function (v, k) { return keySet.has(k); };
};

I.notUndefined = function(v){ return v !== undefined; };

I.notEmpty = function(v){ return !v.isEmpty(); };

I.addIfNew = function(list,val){ return list.contains(val) ? list : list.push(val); };

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = I;
})();