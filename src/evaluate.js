(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithEvaluateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E V A L U A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

var dirlistmethods = {
	dirs: function(state,dirs){
		return dirs;
	},
	relativedirs: function(state,dirs,reldir){
		var rd = this.evaluateValue(state,reldir);
		return this.evaluateDirList(state,dirs).map(function(d){ return [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8][rd-2+d]; });
	},
	ifelse: function(state,cond,val1,val2){ return this.evaluateDirList(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
};

Algol.evaluateDirList = function(state,def){
	return dirlistmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var positionlistmethods = {
	allposinlayer: function(state,layername){ return state.getIn(["layers",layername]).keySeq(); },
	allposinlayers: function(){
		var state = arguments[0];
		return _.reduce( _.slice(arguments,2), function(mem,name){
			return mem.merge( state.getIn(["layers",name]) );
		},state.getIn(["layers",arguments[1]]),this).keySeq();
	}
};

Algol.evaluatePositionList = function(state,def){
	var name = def.first(), rest = def.rest().toArray();
	return positionlistmethods[name] ?
		positionlistmethods[name].apply(this,[state].concat(rest))
		: I.List([positionmethods[name].apply(this,[state].concat(rest))]);
};

var idmethods = {
	idofunitat: function(state,position){ return state.getIn(["layers","units",this.evaluatePosition(state,position),0,"id"]); },
	loopid: function(state){ return state.getIn(["context","loopid"]); },
	id: function(state,id){ return this.evaluateValue(state,id); }
};

Algol.evaluateId = function(state,def){
	return ""+idmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var proptestmethods = {
	is: function(state,val,rawval){ return this.evaluateValue(state,val) === rawval; },
	isnt: function(state,val,rawval){ return this.evaluateValue(state,val) !== rawval; },
};

Algol.evaluateObjectMatch = function(state,def,map){
	return def.every(function(proptestdef,propname){
		return proptestmethods[proptestdef.first()].apply(this,[state].concat(proptestdef.rest().toArray()).concat(map.get(propname)));
	},this);
};

var boolmethods = {
	and: function(state,list){ return list.every(this.evaluateBoolean.bind(this,state)); },
	or: function(state,list){ return list.some(this.evaluateBoolean.bind(this,state)); },
	not: function(state,bool){ return !this.evaluateBoolean(state,bool); },
	same: function(state,val1,val2){ return this.evaluateValue(state,val1) === this.evaluateValue(state,val2); },
	different: function(state,val1,val2){ return this.evaluateValue(state,val1) !== this.evaluateValue(state,val2); },
	anyat: function(state,layername,position){ return state.hasIn(["layers",layername,this.evaluatePosition(state,position)]); },
	noneat: function(state,layername,position){ return !state.hasIn(["layers",layername,this.evaluatePosition(state,position)]); },
	morethan: function(state,val1,val2){ return this.evaluateValue(state,val1) > this.evaluateValue(state,val2); },
	isempty: function(state,layername){ return (state.getIn(["layers",layername])||I.Map()).isEmpty(); },
	notempty: function(state,layername){ return !(state.getIn(["layers",layername])||I.Map()).isEmpty(); },
	true: function(){ return true; },
	false: function(){ return false; },
	positionisinlist: function(state,pos,poslist){
		return this.evaluatePositionList(state,poslist).contains(this.evaluatePosition(state,pos));
	},
	overlaps: function(state,layer1,layer2){
		var otherlayer = state.getIn(["layers",layer2]);
		return state.getIn(["layers",layer1]).some(function(entitylist,pos){
			return otherlayer.has(pos);
		});
	},
	truthy: function(state,def){ return !!this.evaluateValue(state,def); },
	falsy: function(state,def){ return !this.evaluateValue(state,def); }
};

Algol.evaluateBoolean = function(state,def){
	if (typeof def.first !== "function"){
		console.log("THE HECK BOOL",state.toJS(),"def",def.toJS && def.toJS() || def)
	}
	return boolmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var valuemethods = {
	val: function(state,raw){ return raw; },
	layername: function(state,raw){ return raw; },
	contextval: function(state,ctxvalname){ return state.getIn(["context",this.evaluateValue(state,ctxvalname)]); },
	positionsin: function(state,layername){ return state.getIn(["layers",layername]).size; },
	ifelse: function(state,cond,val1,val2){ return this.evaluateValue(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
	lookup: function(state,layername,position,prop){ return state.getIn(["layers",layername,this.evaluatePosition(state,position),0,prop]); },
	idofunitat: idmethods.idofunitat,
	sum: function(){
		var state = _.first(arguments);
		return _.reduce(_.tail(arguments),function(acc,val){ return acc + this.evaluateValue(state,val); },0,this);
	},
	relativedir: function(state,dir,reldir){
		return [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8][this.evaluateValue(state,reldir)-2+this.evaluateValue(state,dir)];
	},
	layerobjectcount: function(state,layername){
		return (state.getIn(["layers",this.evaluateValue(state,layername)])||I.Map()).reduce(function(count,list){
			return count + list.size;
		},0);
	},
	layerpositioncount: function(state,layername){
		return (state.getIn(["layers",this.evaluateValue(state,layername)])||I.Map()).size;
	},
	overlapsize: function(state,layername1,layername2){
		var lr1 = state.getIn(["layers",layername1]) || I.Map();
		return (state.getIn(["layers",layername2])||I.Map()).reduce(function(count,entities,pos){
			return lr1.has(pos) ? count+1 : count;
		},0);
	}
};

Algol.evaluateValue = function(state,def){
	return I.List.isList(def) ? valuemethods[def.first()].apply(this,[state].concat(def.rest().toArray())) : def;
};

var positionmethods = {
	markpos: function(state,markname){ return state.getIn(["marks",markname]); },
	firstposin: function(state,layername){ return I.Iterable(state.getIn(["layers",layername]).keys()).first(); },
	contextpos: function(state,ctxposname){ return state.getIn(["context",ctxposname]); },
	pos: function(state,pos){ return this.evaluateValue(state,pos); }
};

Algol.evaluatePosition = function(state,def){
	if (typeof def.first !== "function"){
		console.log("THE HECK POS",state.toJS(),"def",def.toJS && def.toJS() || def)
	}
	return positionmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));	
};

/*
Used to determine if a command results in a new state or is a repeat of a previous state
*/
Algol.areStatesEqual = function(s1,s2){
	return s1.getIn(["layers","compare"]).equals(s2.getIn(["layers","compare"]));
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithEvaluateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithEvaluateFunctions;
} else {
    window.augmentWithEvaluateFunctions = augmentWithEvaluateFunctions;
}})();
