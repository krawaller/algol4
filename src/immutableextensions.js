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

I.addToList = function(map,listname,val){
	return map.set( listname, I.addIfNew( (map.has(listname) ? map : map.set(listname,I.List([]))).get(listname), val ) );
};

I.pushIn = function(map,path,obj){
	if (!map.hasIn(path)){ map = map.setIn(path,I.List()); }
	return map.setIn(path,map.getIn(path).push(obj));
};

I.pushInIfNew = function(map,path,obj){
	return map.hasIn(path) ? map.getIn(path).contains(obj) ? map : map.setIn(path,map.getIn(path).push(obj)) : map.setIn(path,I.List().push(obj));
};

I.concat = function(oldlist,newlist){return oldlist.concat(newlist);};

I.setIf = function(map,name,val){
	return val ? map.set(name,val) : map;
};


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = I;
})();
