(function(){

var I = (typeof require !== "undefined" ? require("immutable") : window.Immutable);

I.keyInMap = function(othermap) { return function (v, k) { return othermap.has(k); }; };

I.keyIn = function(/*...keys*/) {
  var keySet = Immutable.Set(arguments); 
  return function (v, k) { return keySet.has(k); };
};

I.notUndefined = function(v){ return v !== undefined; };

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = I;
})();