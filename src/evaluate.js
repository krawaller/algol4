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
	}
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
	idofunitat: function(state,position){ return state.getIn(["layers","units",this.evaluatePosition(state,position),0,"ID"]); },
	loopid: function(state){ return state.getIn(["context","loopid"]); }
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
	isempty: function(state,layername){ return state.getIn(["layers",layername]).isEmpty(); },
	notempty: function(state,layername){ return !state.getIn(["layers",layername]).isEmpty(); },
	performedanycommand: function(state){ return !state.get("steps").isEmpty(); },
	hasperformedcommand: function(state,commandname){
		return state.get("steps").some(function(step){ return step.get("command") === commandname; });
	},
	affected: function(state,id){ return state.get("affected").contains(this.evaluateId(state,id)); },
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
	}
};

Algol.evaluateBoolean = function(state,def){
	return boolmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var valuemethods = {
	val: function(state,raw){ return raw; },
	layername: function(state,raw){ return raw; },
	contextval: function(state,ctxvalname){ return state.getIn(["context",ctxvalname]); },
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
	}
};

Algol.evaluateValue = function(state,def){
	return I.List.isList(def) ? valuemethods[def.first()].apply(this,[state].concat(def.rest().toArray())) : def;
};

var positionmethods = {
	markpos: function(state,markname){ return state.getIn(["marks",markname]); },
	firstposin: function(state,layername){ return I.Iterable(state.getIn(["layers",layername]).keys()).first(); },
	contextpos: function(state,ctxposname){ return state.getIn(["context",ctxposname]); },
	markinlast: function(state,commandname,markname){
		var step = state.get("steps").findLast(function(s){ return s.get("command") === commandname; });
		return step && step.getIn(["marks",markname]);
	}
};

Algol.evaluatePosition = function(state,def){
	return positionmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));	
};




// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithEvaluateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithEvaluateFunctions;
} else {
    window.augmentWithEvaluateFunctions = augmentWithEvaluateFunctions;
}})();
