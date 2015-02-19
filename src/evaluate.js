(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("immutable") : window.Immutable);
function augmentWithEvaluateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E V A L U A T E  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

var positionlistmethods = {
	FROMALLINLAYER: function(state,layername){ return Object.keys(state.getIn(["layers",layername]).toObject()); },
	FROMALLINLAYERS: function(){
		var state = _.head(arguments), names = _.tail(arguments);
		return _.unique(_.reduce(names,function(arr,name){
			return arr.concat(Object.keys(state.getIn(["layers",name]).toObject()));
		},[]));
	}
};

Algol.evaluatePositionList = function(state,def){
	return idmethods[def[0]].apply(this,[state].concat(_.tail(def)));
};

var idmethods = {
	IDAT: function(state,position){ return state.getIn(["layers","UNITS",this.evaluatePosition(state,position),0,"id"]); },
	LOOPID: function(state){ return state.getIn(["context","LOOPID"]); }
};

Algol.evaluateId = function(state,def){
	return idmethods[def[0]].apply(this,[state].concat(_.tail(def)));
};


var boolmethods = {
	ALL: function(){ return _.every(_.tail(arguments),this.evaluateBoolean.bind(this,_.head(arguments))); },
	OR: function(){ return _.some(_.tail(arguments),this.evaluateBoolean.bind(this,_.head(arguments))); },
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
		return state.get("steps").some(function(step){
			return step.get("command").is(commandname);
		});
	},
	AFFECTED: function(state,id){
		id = this.evaluateId(state,id);
		return state.getIn(["steps"]).some(function(step){
			return step.get("affected").contains(id);
		});
	}
};

Algol.evaluateBoolean = function(state,def){
	return boolmethods[def[0]].apply(this,[state].concat(_.tail(def)));
};

var valuemethods = {
	VAL: function(state,raw){ return raw; },
	CONTEXTVAL: function(state,ctxvalname){ return state.getIn(["context",ctxvalname]); },
	POSITIONSIN: function(state,layername){ return state.getIn(["layers",layername]).size; },
	IFELSE: function(state,cond,val1,val2){ return this.evaluateValue(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
	LOOKUP: function(state,layername,position,prop){ return state.getIn(["layers",layername,this.evaluatePosition(state,position),0,prop]); },
	IDAT: idmethods.IDAT
};

Algol.evaluateValue = function(state,def){
	return valuemethods[def[0]].apply(this,[state].concat(_.tail(def)));
};

var positionmethods = {
	MARKPOS: function(state,markname){ return state.getIn(["marks",markname]); },
	ONLYPOSIN: function(state,layername){ return I.Iterable(state.getIn(["layers",layername]).keys()).first(); },
	CONTEXTPOS: function(state,ctxposname){ return state.getIn(["context",ctxposname]); },
	MARKINLAST: function(state,commandname,markname){
		var step = state.steps.findLast(function(s){ return s.command === commandname; });
		return step && step.getIn(["marks",markname]);
	}
};

Algol.evaluatePosition = function(state,def){
	return positionmethods[def[0]].apply(this,[state].concat(_.tail(def)));	
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithEvaluateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithEvaluateFunctions;
else
    window.augmentWithEvaluateFunctions = augmentWithEvaluateFunctions;

})();