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
		return this.evaluateDirList(state,dirs).map(function(d){
			return [1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8][rd-2+d];
		});
	},
	relativedir: function(state,dir,reldir){
		var dir = this.evaluateValue(state,dir),
			rd = this.evaluateValue(state,reldir);
		return I.List([[1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8][rd-2+dir]]);
	},
	ifelse: function(state,cond,val1,val2){ return this.evaluateDirList(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
	dir: function(state,dir){
		return I.List([this.evaluateValue(state,dir)]);
	},
	lookuplist: function(state,layername,position,prop){
		return state.getIn(["layers",layername,this.evaluatePosition(state,position),0,prop]);
	},
	case: function(state,val,listofpairs,defaultval){
		var val = this.evaluateValue(state,val),
			find = listofpairs.filter(function(pair){
				return this.evaluateValue(state,pair.first()) === val;
			},this);
		/*if (find && !find.get || !find.get(0) || !find.get(0).get || !find.get(0).get(1)){
			console.log("BOGUS CASE",find.toJS && find.toJS() || find,"full",listofpairs.toJS());
		}*/
		var ret = this.evaluateDirList(state,find&&find.size?find.get(0).get(1):defaultval);
		//console.log("CASE",val,"FOUND",find && find.get(0).get(1).toJS(),"ret",ret.toJS && ret.toJS() || ret);
		return ret;
	},
};

Algol.evaluateDirList = function(state,def){
	if (!dirlistmethods[def.first()]){
		console.log("BOGUS dirlist",def.toJS && def.toJS() || def);
	}
	return dirlistmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var positionlistmethods = {
	allposinlayer: function(state,layername){ return (state.getIn(["layers",layername])||I.Map()).keySeq(); },
	allposinlayers: function(){
		var state = arguments[0];
		return _.reduce( _.slice(arguments,2), function(mem,name){
			return mem.merge( state.getIn(["layers",name]) || I.Map() );
		},state.getIn(["layers",arguments[1]])||I.Map(),this).keySeq();
	},
	layeroverlap: function(state,layer1,layer2){
		var l1 = (state.getIn(["layers",layer1])||I.Map()),
			l2 = (state.getIn(["layers",layer2])||I.Map());
		return l1.keySeq().reduce(function(mem,pos){
			return l2.has(pos) ? mem.push(pos) : mem;
		},I.List());
	},
	layerwithoutlayer: function(state,layer1,layer2){
		var l1 = (state.getIn(["layers",layer1])||I.Map()),
			l2 = (state.getIn(["layers",layer2])||I.Map());
		return l1.keySeq().reduce(function(mem,pos){
			return l2.has(pos) ? mem : mem.push(pos);
		},I.List());
	},
};

Algol.evaluatePositionList = function(state,def){
	if (typeof def.first !== "function"){
		console.log("THE HECK POSLIST",state.toJS(),"def",def.toJS && def.toJS() || def)
	}
	var name = def.first(), rest = def.rest().toArray();
	if (!positionlistmethods[name] && !positionmethods[name]){
		console.log("THE HECK POSLIST strange!",state.toJS(),"def",def.toJS && def.toJS() || def)
	}
	return positionlistmethods[name] ?
		positionlistmethods[name].apply(this,[state].concat(rest))
		: I.List([positionmethods[name].apply(this,[state].concat(rest))]);
};

var positionsetmethods = {
	ifelse: function(state,cond,val1,val2){ return this.evaluatePositionSet(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
	union: function(state,set1,set2){ return this.evaluatePositionSet(state,set1).union(this.evaluatePositionSet(state,set2)); },
	intersect: function(state,set1,set2){
		return this.evaluatePositionSet(state,set1).intersect(this.evaluatePositionSet(state,set2));
	},
	subtract: function(state,set1,set2){ return this.evaluatePositionSet(state,set1).subtract(this.evaluatePositionSet(state,set2)); },
	layer: function(state,layername){
		return (state.getIn(["layers",this.evaluateValue(state,layername)])||I.Map()).keySeq().toSet();
	},
	coalesce: function(state,set1,set2){
		var r1 = this.evaluatePositionSet(state,set1);
		//console.log("Called coalesce",r1.toJS());
		return r1.isEmpty() ? this.evaluatePositionSet(state,set2) : r1;
	}
};

Algol.evaluatePositionSet = function(state,def){
	//console.log("POSITIONSET",def.toJS ? def.toJS() : def);
	if (typeof def === "string") {
		if (state.hasIn(["layers",def])){
			return (state.getIn(["layers",def])||I.Map()).keySeq().toSet();
		} else if (state.hasIn(["gamedef","marks",def])){
			var mark = state.getIn(["marks",def]);
			return mark ? I.Set.of(state.getIn(["marks",def])) : I.Set();
		}
		return I.Set();
	} else {
		var name = def.first(), rest = def.rest().toArray();
		if (positionsetmethods[name]){
			return positionsetmethods[name].apply(this,[state].concat(rest));
		} else if (positionmethods[name]){
			var pos = positionmethods[name].apply(this,[state].concat(rest));
			return pos ? I.Set.of(pos) : I.Set();
		} else {
			console.log("GAH!",def && def.toJS(),"STATE",state.toJS());
			throw "UNKNOWN POSITION SET THINGY!";
		}
	}
}

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
	ifelse: function(state,bool,b1,b2){ return this.evaluateBoolean(state,this.evaluateBoolean(state,bool) ? b1 : b2); },
	and: function(state,list){ return list.every(this.evaluateBoolean.bind(this,state)); },
	or: function(state,list){ return list.some(this.evaluateBoolean.bind(this,state)); },
	not: function(state,bool){ return !this.evaluateBoolean(state,bool); },
	same: function(state,val1,val2){ return this.evaluateValue(state,val1) === this.evaluateValue(state,val2); },
	different: function(state,val1,val2){ return this.evaluateValue(state,val1) !== this.evaluateValue(state,val2); },
	morethan: function(state,val1,val2){ return this.evaluateValue(state,val1) > this.evaluateValue(state,val2); },
	hasperformedcommand: function(state,command){ return !!state.getIn(["context","hasperformed"+command]); },
	hasmademove: function(state){ return !!state.getIn(["context","performedsteps"]); },
	true: function(){ return true; },
	false: function(){ return false; },
	truthy: function(state,def){ return !!this.evaluateValue(state,def); },
	falsy: function(state,def){ return !this.evaluateValue(state,def); },
	anyat: function(state,positionset,position){
		var positionset = this.evaluatePositionSet(state,positionset),
			position = this.evaluatePosition(state,position);
		return positionset.has(position); // state.hasIn(["layers",layername,this.evaluatePosition(state,position)]);
	},
	noneat: function(state,positionset,position){
		var positionset = this.evaluatePositionSet(state,positionset),
			position = this.evaluatePosition(state,position);
		//console.log("Noneat",positionset.toJS(),position.toJS && position.toJS() || position);
		return !positionset.has(position); //!state.hasIn(["layers",layername,this.evaluatePosition(state,position)]);
	},
	isempty: function(state,positionset){ return this.evaluatePositionSet(state,positionset).isEmpty(); }, //  (state.getIn(["layers",layername])||I.Map()).isEmpty(); },
	notempty: function(state,positionset){ return !this.evaluatePositionSet(state,positionset).isEmpty(); },
	overlaps: function(state,set1,set2){
		var s1 = this.evaluatePositionSet(state,set1),
			s2 = this.evaluatePositionSet(state,set2);
		return !s1.intersect(s2).isEmpty();
	},
	valinlist: function(state,val,list){
		val = this.evaluateValue(state,val);
		//console.log("...Looking for",val);
		return list.some(function(l){
			//console.log(".......comparing it to",this.evaluateValue(state,l));
			return val === this.evaluateValue(state,l);
		},this);
	}
};

Algol.evaluateBoolean = function(state,def){
	if (typeof def.first !== "function" || !boolmethods[def.first()]){
		console.log("THE HECK BOOL",state.toJS(),"def",def.toJS && def.toJS() || def)
	}
	return boolmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

var valuemethods = {
	max: function(state,v1,v2){
		v1 = this.evaluateValue(state,v1);
		v2 = this.evaluateValue(state,v2);
		return v1 > v2 ? v1 : v2;
	},
	val: function(state,raw){ return raw; },
	layername: function(state,raw){ return raw; },
	contextval: function(state,ctxvalname){ return state.getIn(["context",this.evaluateValue(state,ctxvalname)]); },
	battleval: function(state,battlevalname){ return state.getIn(["data","battlevals",this.evaluateValue(state,battlevalname)]); },
	positionsin: function(state,positionset){ return this.evaluatePositionSet(state,positionset).size; },
	ifelse: function(state,cond,val1,val2){ return this.evaluateValue(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
	lookup: function(state,layername,position,prop){
		return state.getIn(["layers",layername,this.evaluatePosition(state,position),0,prop]);
	},
	idofunitat: idmethods.idofunitat,
	sum: function(){
		var state = _.first(arguments);
		return _.reduce(_.tail(arguments),function(acc,val){ return acc + this.evaluateValue(state,val); },0,this);
	},
	minus: function(state,v1,v2){
		return this.evaluateValue(state,v1)-this.evaluateValue(state,v2);
	},
	mult: function(state,f1,f2){
		return this.evaluateValue(state,f1)*this.evaluateValue(state,f2);
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
	layerweightat: function(state,layername,pos){
		var layer = this.evaluateValue(state,layername),
			pos = this.evaluatePosition(state,pos),
			list = (state.getIn(["layers",layer,pos])||I.List());
		//console.log("Weight at",pos,"was this list",list.toJS(),"with size",list.size);
		return list.size;
	},
	overlapsize: function(state,layername1,layername2){
		return this.evaluatePositionSet(state,I.List(["intersect",layername1,layername2])).size;
		/*var lr1 = state.getIn(["layers",layername1]) || I.Map();
		return (state.getIn(["layers",layername2])||I.Map()).reduce(function(count,entities,pos){
			return lr1.has(pos) ? count+1 : count;
		},0);*/
	},
	case: function(state,val,listofpairs,defaultval){
		var val = this.evaluateValue(state,val),
			find = listofpairs.filter(function(pair){
				return this.evaluateValue(state,pair.first()) === val;
			},this);
		return this.evaluateValue(state,find?find.first().last():defaultval);
	},
	position: function(state,pos){
		return this.evaluatePosition(state,pos);
	},
	playervar: function(state,name,player){
		return state.getIn(["data","playervars",this.evaluateValue(state,name),this.evaluateValue(state,player)]);
	},
	dirline: function(state,dir){
		return {
			1: "vertical", 5: "vertical", 2: "uphill", 6: "uphill", 3: "horisontal", 7: "horisontal", 4: "downhill", 8: "downhill"
		}[this.evaluateValue(state,dir)] || "unknown"
	},
	linelength: function(state,pos1,pos2){
		//console.log("WAH",this.evaluatePosition(state,pos1),this.evaluatePosition(state,pos2),pos1 && pos1.toJS && pos1.toJS() || pos1,pos2 && pos2.toJS && pos2.toJS() || pos2)
		var c1 = this.posNameToObj(this.evaluatePosition(state,pos1),state.getIn(["gamedef","board"])),
			c2 = this.posNameToObj(this.evaluatePosition(state,pos2),state.getIn(["gamedef","board"]));
		return Math.sqrt(Math.pow(c1.x-c2.x,2)+Math.pow(c1.y-c2.y,2));
	}
};

Algol.evaluateValue = function(state,def){
	if (I.List.isList(def) && !valuemethods[def.first()] && !positionmethods[def.first()] && !boolmethods[def.first()]){
		console.log("THE HECK VAL",state.toJS(),"def",def.toJS && def.toJS() || def)
	}
	return I.List.isList(def) ? (valuemethods[def.first()] || positionmethods[def.first()] || boolmethods[def.first()]).apply(this,[state].concat(def.rest().toArray())) : def;
};

var positionmethods = {
	markpos: function(state,markname){ return state.getIn(["marks",markname]); },
	firstposin: function(state,layername){ return I.Iterable(this.evaluatePositionSet(state,layername)).first(); },
	contextpos: function(state,ctxposname){ return state.getIn(["context",ctxposname]); },
	pos: function(state,pos){ return this.evaluateValue(state,pos); },
	ifelse: function(state,cond,val1,val2){ return this.evaluatePosition(state, this.evaluateBoolean(state,cond) ? val1 : val2); },
};

Algol.evaluatePosition = function(state,def){
	if (state.hasIn(["gamedef","marks",def])){
		return state.getIn(["marks",def]);
	}
	if (typeof def.first !== "function" || !positionmethods[def.first()]){
		console.log("THE HECK POS",state.keySeq().toJS(),"def",def.toJS && def.toJS() || def)
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


