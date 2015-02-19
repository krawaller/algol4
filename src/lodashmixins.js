(function(){

var _ = (typeof require !== "undefined" ? require("lodash") : window._);

_.mixin({
	quickfind: function(arr,tester){
		if (!arr.length) { return undefined; }
		var index = Math.floor(arr.length/2);
		switch(tester(arr[index])){
			case -1: return _.quickfind(_.first(arr,index-1),tester);
			case 1: return _.quickfind(_.rest(arr,index),tester);
			default: return arr[index];
		}
	},
	combine: function(){
		return _.reduce(Array.prototype.slice.call(arguments, 1),function(ret,newarr){
			return _.reduce(ret,function(memo,oldi){
				return memo.concat(_.map(newarr,function(newi){
					return oldi.concat(newi);
				}));
			},[]);
		},_.map(arguments[0],function(i){return [i];}));
	},
	extendProp: function(){
		var obj = arguments[0], propname = arguments[1], sources = Array.prototype.slice.call(arguments, 2),
			args = [obj[propname]||{}].concat(sources);
		console.log("ARGS",args);
		obj[propname] = _.extend.apply(this,[obj[propname]||{}].concat(sources));
		return obj;
	}
});


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = _;
})();