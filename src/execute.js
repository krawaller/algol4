(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithExecuteFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E X E C U T E  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

var effectmethods = {
	killunit: function(state,id){
		return state.setIn(["data","units",this.evaluateId(state,id),"dead"],true);
	},
	moveunit: function(state,id,pos){
		var calcid = this.evaluateId(state,id),
			calcpos = this.evaluatePosition(state,pos);
		//console.log("MOVING id",id.toJS(),calcid,"pos",pos && pos.toJS &&  pos.toJS() || pos,calcpos,"state",state.toJS());
		return state.setIn(["data","units",calcid,"pos"],calcpos);
	},
	move: function(state,from,to){
		from = this.evaluatePosition(state,from);
		to = this.evaluatePosition(state,to);
		return (state.getIn(["layers","units",from])||I.List()).reduce(function(s,unit){
			return state.setIn(["data","units",unit.get("id"),"pos"],to);
		},state,this);
	},
	kill: function(state,pos){
		pos = this.evaluatePosition(state,pos);
		return (state.getIn(["layers","units",pos])||I.List()).reduce(function(s,unit){
			return state.setIn(["data","units",unit.get("id"),"dead"],true);
		},state,this);
	},
	turnunit: function(state,id,mod){
		id = this.evaluateId(state,id);
		var newdir = state.getIn(["data","units",id,"dir"])+this.evaluateValue(state,mod);
		return state.setIn(["data","units",id,"dir"],newdir>8?newdir-8:0>newdir?newdir+8:newdir);
	},
	setunitdata: function(state,id,propname,val){
		//console.log("SET unit",this.evaluateId(state,id),"prop",this.evaluateValue(state,propname),"to",this.evaluateValue(state,val))
		return state.setIn(["data","units",this.evaluateId(state,id),this.evaluateValue(state,propname)],this.evaluateValue(state,val));
	},
	removeunitdata: function(state,id,propname){
		return state.deleteIn(["data","units",this.evaluateId(state,id),this.evaluateValue(state,propname)]);
	},
	swapunitpositions: function(state,id1,id2){
		id1 = this.evaluateId(state,id1);
		id2 = this.evaluateId(state,id2);
		var temp = state.getIn(["data","units",id1,"pos"]);
		return state.setIn(["data","units",id1,"pos"],state.getIn(["data","units",id2,"pos"])).setIn(["data","units",id2,"pos"],temp);
	},
	forallin: function(state,positionset,effect){
		var positionset = this.evaluatePositionSet(state,positionset);
		//console.log("FOR ALL IN",positionset.toJS());
		/*return positionset.reduce(function(state,pos){
			return (state.getIn(["layers","units",pos])||I.List()).reduce(function(unit){
				return this.applyEffect(state.setIn(["context","loopid"],unit.get("id")),effect);
			},state,this);
		},state,this)[state.hasIn(["context","loopid"])?"setIn":"deleteIn"](["context","loopid"],state.getIn(["context","loopid"]));*/
		return state.getIn(["data","units"]).reduce(function(state,unit,id){
			//console.log("checking unit",id,positionset.has(unit.get("pos")));
			return positionset.has(unit.get("pos")) ? this.applyEffect(state.setIn(["context","loopid"],id),effect) : state;
		},state,this)[state.hasIn(["context","loopid"])?"setIn":"deleteIn"](["context","loopid"],state.getIn(["context","loopid"]));
	},
	forallposin: function(state,positionset,effect){
		var positionset = this.evaluatePositionSet(state,positionset);
		return positionset.reduce(function(state,pos){
			return this.applyEffect(state.setIn(["context","target"],pos),effect);
		},state,this)[state.hasIn(["context","target"])?"setIn":"deleteIn"](["context","target"],state.getIn(["context","target"]));
	},
	multieffect: function(state,list){
		return list.reduce(this.applyEffect.bind(this),state,this);
	},
	setcontextval: function(state,prop,val){
		return state.setIn(["context",this.evaluateValue(state,prop)],this.evaluateValue(state,val));
	},
	setbattleval: function(state,prop,val){
		return state.setIn(["data",this.evaluateValue(state,prop)],this.evaluateValue(state,val));
	},
	spawnunit: function(state,pos,group,owner,obj){
		var id = "unit"+(state.getIn(["data","units"]).size+1),
			obj = (obj||I.Map()).reduce(function(o,def,key){ return o.set(key,this.evaluateValue(state,def)); },I.Map(),this),
			newstate = state.setIn(["data","units",id],obj.set("id",id).set("group",group).set("owner",this.evaluateValue(state,owner)||0).set("pos",this.evaluatePosition(state,pos)));
		return newstate;
	},
	addtocontextval: function(state,prop,val){
		var propname = this.evaluateValue(state,prop);
		return state.setIn(["context",propname],this.evaluateValue(state,val)+(state.getIn(["context",propname])||0));
	},
	if: function(state,bool,effect){
		return this.evaluateBoolean(state,bool) ? this.applyEffect(state,effect) : state;
	},
	ifelse: function(state,bool,e1,e2){
		return this.applyEffect(state,this.evaluateBoolean(state,bool) ? e1 : e2);
	},
	offsetunit: function(state,id,dir,dist){
		id = this.evaluateId(state,id);
		dir = this.evaluateValue(state,dir);
		dist = this.evaluateValue(state,dist) || 1;
		var pos = state.getIn(["data","units",id,"pos"]);
		while(dist && state.hasIn(["connections",pos,dir])){
			pos = state.getIn(["connections",pos,dir]);
			dist--;
		}
		return state.setIn(["data","units",id,"pos"],pos);
	}
};

// returns an updated state
// Called from Algol.listCommandOptions -- hmm?
// Called from Algol.prepareNewTurnState

Algol.applyEffect = function(state,def){
	//console.log("Applying effect",def.toJS());
	return effectmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

// Called from Algol.listCommandOptions TODO - invert to return error string or nothing
Algol.canExecuteCommand = function(state,def){
	return !(
		(def.has("condition") && !this.evaluateBoolean(state,def.get("condition"))) || 
		def.has("requiredmarks") && def.get("requiredmarks").some(function(markname){ return !state.get("marks").has(markname); })
	);
};


// TODO - obsolete?
Algol.buildSaveEntryFromStep = function(state,stepentry){
	var commanddef = state.getIn(["gamedef","commands",stepentry.get("command")]);
	return commanddef.get("requiredmarks").reduce(function(ret,markname){
		return ret+"_"+stepentry.getIn(["marks",markname]);
	},commanddef.get("id"));
};

// returns an object describing what step was taken (name of command + relevant marks)
// Used only in Algol.calculateCommandResult
Algol.calculateStepData = function(state,commanddef){
	return I.fromJS({
		command: commanddef.get("name"),
		marks: (commanddef.get("requiredmarks")||I.List()).reduce(function(mem,mname){
			return mem.set(mname,state.getIn(["marks",mname]));
		},I.Map())
	});
};


// Called from Algol.getAvailableCommands
Algol.calculateCommandResult = function(state,newstate,commanddef,commandname){
	var comparetostate = state; //I.Map().set("previousstep",state);
	// if newstate is equal to a previous step this turn, treat as a goback command

	// TODO - fix this!
	newstate = this.prepareBasicUnitLayers(newstate); // state.set("layers",this.addUnitLayersFromData(state.get("baselayer"),state.getIn(["data","units"]),state.get("player")));
	//newstate = newstate.set("layers",this.addUnitLayersFromData(newstate.get("baselayer"),newstate.getIn(["data","units"]),newstate.get("player")));

	while(comparetostate.has("previousstep")){
		comparetostate = comparetostate.get("previousstep");
		if (this.areStatesEqual(comparetostate,newstate)){ return I.List(["backto",comparetostate]); }
	}
	// newstate is really new state, treat it as such
	newstate = I.pushIn(newstate,["steps"],this.calculateStepData(state,commanddef));
	newstate = newstate.setIn(["context","hasperformed"+commandname],true);
	return I.List(["newstep",newstate,this.newMarksAfterCommand(state,commanddef),commanddef.get("rungenerators")]);
};

// returns an endturn option. this will either be win/draw/loseto or passto
// Used in Algol.getAvailableCommands
Algol.endTurnOption = function(state,endturndef){
	if (state.has("diving")){
		return I.List(["foobar"]);
	}
	var endgame = endturndef.get("endgame").reduce(function(mem,end,name){
		if (!mem && this.evaluateBoolean(state,end.get("condition"))) {
			var res = this.evaluateValue(state,end.get("result")),
				who = (res==="loseto" && this.evaluateValue(state,end.get("who")));
			return res==="loseto" ? I.List([res,name,who]) : I.List([res,name]);
		}
		return mem;
	},undefined,this);
	if (endgame){
		return endgame;
	} else {
		var newturnstate = this.setOptions(this.prepareNewTurnState(state,state.getIn(["passto",state.get("player")])));
		if (this.canReachTurnEnd(newturnstate)){
			return I.List(["passto",newturnstate]);	
		} else {
			return I.List(["win","stalemate"]);
		}
		
	}
	//return endgame || I.List(["passto",state.getIn(["passto",state.get("player")])]);
};

// Returns an array of available commands
// Used in Algol.setOptions  -- TODO really the right place?
Algol.getAvailableCommands = function(state,gamedef){
	return I.setIf(I.setIf((state.get("canendturn") && gamedef.getIn(["endturn","commandcap"]) ? I.Map() : gamedef.get("commands")).reduce(function(ret,comdef,comname){
		return this.canExecuteCommand(state,comdef) ? ret.set(comname,this.calculateCommandResult(state,this.applyEffect(state,comdef.get("effect")),comdef,comname)) : ret;
	},I.Map(),this),"endturn",state.get("canendturn") && this.endTurnOption(state,gamedef.get("endturn"))),"undo",state.has("previousstep") ? I.List(["backto",state.get("previousstep")]) : false) ;
};

var optionmethods = {
	backto: function(state,oldstate){ return oldstate; },
	newstep: function(state,newstate,newmarks,generators){ return this.setOptions(this.prepareNewStepState(newstate,state,newmarks,generators)); },
	//passto: function(state,player){ return this.setOptions(this.prepareNewTurnState(state,player)); },
	passto: function(state,newstate){ return this.removeDeadEnds(newstate); },
	win: function(state,by){ return state.set("endedby",by).set("winner",state.get("player")).delete("availableMarks").delete("availableCommands"); },
	draw: function(state,by){ return state.set("endedby",by).set("winner",0).delete("availableMarks").delete("availableCommands"); },
	loseto: function(state,by,player){ return state.set("endedby",by).set("winner",player).delete("availableMarks").delete("availableCommands"); },
	setmark: function(state,mark,pos){ return this.setOptions(this.setMark(state,mark,pos)); },
	removemark: function(state,mark){ return this.removeDeadEnds(this.setOptions(this.removeMark(state,mark))); }
};

Algol.performOption = function(state,def){
	var ret = optionmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
	//console.log("did option",def.toJS(),"result is",state.toJS());
	return ret;
};

/*
Usd in performOption newstep and passto methods
*/

Algol.setOptions = function(state){
	if (state.has("endedby")){
		return state.set("availableMarks",I.Map()).set("availableCommands",I.Map()).set("currentMarks",I.Map());
	} else if (state.get("canendturn") && state.getIn(["gamedef","endturn","commandcap"])) {
		return state
		.set("availableMarks",I.Map())
		.set("availableCommands",this.getAvailableCommands(state,state.get("gamedef")))
		.set("currentMarks",I.Map());
	} else {
		return state
		.set("availableMarks",this.getAvailableMarks(state))
		.set("availableCommands",this.getAvailableCommands(state,state.get("gamedef")))
		.set("currentMarks",this.getCurrentMarks(state));
	}
};

Algol.removeDeadEnds = function(state,def){
	return state.hasIn(["gamedef","endturn","canalwaysend"]) && this.evaluateBoolean(state,state.getIn(["gamedef","endturn","canalwaysend"])) ? state : state.set("availableMarks",state.get("availableMarks").filter(function(setmark,name){
		return this.canReachTurnEnd(this.performOption(state,setmark));
	},this)).set("availableCommands",state.get("availableCommands").filter(function(cmnd,name){
		return this.canReachTurnEnd(this.performOption(state,cmnd));
	},this));
};


Algol.canReachTurnEnd = function(state){
	state = state.set("diving",true);
	return state.get("canendturn") || (state.hasIn(["gamedef","endturn","canalwaysend"]) && this.evaluateBoolean(state,state.getIn(["gamedef","endturn","canalwaysend"]))) || state.get("availableCommands").some(function(cmnd,name){
		return cmnd.first() === "newstep" && this.canReachTurnEnd(this.performOption(state,cmnd));
	},this) || state.get("availableMarks").some(function(setmark,name){
		return this.canReachTurnEnd(this.performOption(state,setmark));
	},this);
}

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithExecuteFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithExecuteFunctions;
} else {
    window.augmentWithExecuteFunctions = augmentWithExecuteFunctions;
}})();
