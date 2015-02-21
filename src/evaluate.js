(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithEvaluateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E V A L U A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

var dirlistmethods = {
	DIRS: function(){
		return I.List(_.tail(arguments));
	},
	RELATIVEDIRS: function(state,dirs,reldir){
		reldir = this.evaluateValue(state,reldir);
		dirs = this.evaluateDirList(state,dirs);
		return dirs.map(function(d){ return [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8][reldir-2+d]; });
	}
};

Algol.evaluateDirList = function(state,def){
	return dirlistmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var positionlistmethods = {
	FROMALLINLAYER: function(state,layername){ return state.getIn(["layers",layername]).keySeq(); },
	FROMALLINLAYERS: function(){
		var state = arguments[0];
		return _.reduce( _.slice(arguments,2), function(mem,name){
			return mem.merge( state.getIn(["layers",name]) );
		},state.getIn(["layers",arguments[1]]),this).keySeq();
	}
};

Algol.evaluatePositionList = function(state,def){
	return positionlistmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var idmethods = {
	IDAT: function(state,position){ return state.getIn(["layers","UNITS",this.evaluatePosition(state,position),0,"id"]); },
	LOOPID: function(state){ return state.getIn(["context","LOOPID"]); }
};

Algol.evaluateId = function(state,def){
	return ""+idmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var proptestmethods = {
	IS: function(state,val,rawval){ return this.evaluateValue(state,val) === rawval; },
	ISNT: function(state,val,rawval){ return this.evaluateValue(state,val) !== rawval; },
};

Algol.evaluateObjectMatch = function(state,def,map){
	return def.every(function(proptestdef,propname){
		return proptestmethods[proptestdef.first()].apply(this,[state].concat(proptestdef.rest().toArray()).concat(map.get(propname)));
	},this);
};

var boolmethods = {
	AND: function(){ return _.every(_.tail(arguments),this.evaluateBoolean.bind(this,_.first(arguments))); },
	OR: function(){ return _.some(_.tail(arguments),this.evaluateBoolean.bind(this,_.first(arguments))); },
	NOT: function(state,bool){ return !this.evaluateBoolean(state,bool); },
	SAME: function(state,val1,val2){ return this.evaluateValue(state,val1) === this.evaluateValue(state,val2); },
	DIFFERENT: function(state,val1,val2){ return this.evaluateValue(state,val1) !== this.evaluateValue(state,val2); },
	ANYAT: function(state,layername,position){ return state.hasIn(["layers",layername,this.evaluatePosition(state,position)]); },
	NONEAT: function(state,layername,position){ return !state.hasIn(["layers",layername,this.evaluatePosition(state,position)]); },
	MORE: function(state,val1,val2){ return this.evaluateValue(state,val1) > this.evaluateValue(state,val2); },
	EMPTY: function(state,layername){ return state.getIn(["layers",layername]).isEmpty(); },
	NOTEMPTY: function(state,layername){ return !state.getIn(["layers",layername]).isEmpty(); },
	PERFORMEDANYCOMMAND: function(state){ return !state.get("steps").isEmpty(); },
	HASPERFORMEDCOMMAND: function(state,commandname){
		return state.get("steps").some(function(step){ return step.get("command") === commandname; });
	},
	AFFECTED: function(state,id){ return state.get("affected").contains(this.evaluateId(state,id)); },
	TRUE: function(){ return true; },
	FALSE: function(){ return false; }
};

Algol.evaluateBoolean = function(state,def){
	return boolmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var valuemethods = {
	VAL: function(state,raw){ return raw; },
	CONTEXTVAL: function(state,ctxvalname){ return state.getIn(["context",ctxvalname]); },
	POSITIONSIN: function(state,layername){ return state.getIn(["layers",layername]).size; },
	IFELSE: function(state,cond,val1,val2){ return this.evaluateValue(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
	LOOKUP: function(state,layername,position,prop){ return state.getIn(["layers",layername,this.evaluatePosition(state,position),0,prop]); },
	IDAT: idmethods.IDAT,
	SUM: function(){
		var state = _.first(arguments);
		return _.reduce(_.tail(arguments),function(acc,val){ return acc + this.evaluateValue(state,val); },0,this);
	},
	RELATIVEDIR: function(state,dir,reldir){
		return [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8][this.evaluateValue(state,reldir)-2+this.evaluateValue(state,dir)];
	}
};

Algol.evaluateValue = function(state,def){
	return valuemethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var positionmethods = {
	MARKPOS: function(state,markname){ return state.getIn(["marks",markname]); },
	ONLYPOSIN: function(state,layername){ return I.Iterable(state.getIn(["layers",layername]).keys()).first(); },
	CONTEXTPOS: function(state,ctxposname){ return state.getIn(["context",ctxposname]); },
	MARKINLAST: function(state,commandname,markname){
		var step = state.get("steps").findLast(function(s){ return s.get("command") === commandname; });
		return step && step.getIn(["marks",markname]);
	}
};

Algol.evaluatePosition = function(state,def){
	return positionmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));	
};




// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithEvaluateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithEvaluateFunctions;
else
    window.augmentWithEvaluateFunctions = augmentWithEvaluateFunctions;

})();