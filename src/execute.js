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
		return state.setIn(["data","units",this.evaluateId(state,id),"pos"],this.evaluatePosition(state,pos));
	},
	turnunit: function(state,id,mod){
		id = this.evaluateId(state,id);
		var newdir = state.getIn(["data","units",id,"dir"])+this.evaluateValue(state,mod);
		return state.setIn(["data","units",id,"dir"],newdir>8?newdir-8:0>newdir?newdir+8:newdir);
	},
	setunitdata: function(state,id,propname,val){
		return state.setIn(["data","units",this.evaluateId(state,id),this.evaluateValue(state,propname)],this.evaluateValue(state,val));
	},
	swapunitpositions: function(state,id1,id2){
		id1 = this.evaluateId(state,id1);
		id2 = this.evaluateId(state,id2);
		var temp = state.getIn(["data","units",id1,"pos"]);
		return state.setIn(["data","units",id1,"pos"],state.getIn(["data","units",id2,"pos"])).setIn(["data","units",id2,"pos"],temp);
	},
	forallin: function(state,layername,effect){
		var layer = state.getIn(["layers",this.evaluateValue(state,layername)]);
		return state.getIn(["data","units"]).reduce(function(state,unit,id){
			return layer.has(unit.get("pos")) ? this.applyEffect(state.setIn(["context","loopid"],id),effect) : state;
		},state,this)[state.hasIn(["context","loopid"])?"setIn":"deleteIn"](["context","loopid"],state.getIn(["context","loopid"]));
	},
	multieffect: function(state,list){
		return list.reduce(this.applyEffect.bind(this),state,this);
	},
	setcontextval: function(state,prop,val){
		return state.setIn(["context",this.evaluateValue(state,prop)],this.evaluateValue(state,val));
	},
	addtocontextval: function(state,prop,val){
		var propname = this.evaluateValue(state,prop);
		return state.setIn(["context",propname],this.evaluateValue(state,val)+(state.getIn(["context",propname])||0));
	}
};

// returns an updated state
// Called from Algol.listCommandOptions
Algol.applyEffect = function(state,def){
	return effectmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

// Called from Algol.listCommandOptions
Algol.canExecuteCommand = function(state,def){
	return !(
		(def.has("condition") && !this.evaluateBoolean(state,def.get("condition"))) || 
		def.has("neededmarks") && def.get("neededmarks").some(function(markname){ return !state.get("marks").has(markname); })
	);
};


// TODO - obsolete
Algol.buildSaveEntryFromStep = function(state,stepentry){
	var commanddef = state.getIn(["gamedef","commands",stepentry.get("command")]);
	return commanddef.get("neededmarks").reduce(function(ret,markname){
		return ret+"_"+stepentry.getIn(["marks",markname]);
	},commanddef.get("id"));
};

// returns an object describing what step was taken (name of command + relevant marks)
// Used only in Algol.calculateCommandResult
Algol.calculateStepData = function(state,commanddef){
	return I.fromJS({
		command: commanddef.get("name"),
		marks: commanddef.get("neededmarks").reduce(function(mem,mname){
			return mem.set(mname,state.getIn(["marks",mname]));
		},I.Map())
	});
};

// returns new mark data for a new step. will either be empty or contain the marks
// specified by the commanddef
// Used only in Algol.calculateCommandResult
// TODO - obsolete!
Algol.updateMarksFromCommand = function(state,commanddef){
	return (commanddef.get("setmarks")||I.Map()).reduce(function(ret,pos,markname){
		return ret.set(markname,this.evaluateValue(state,pos));
	},I.Map(),this);
};


// Called from Algol.listCommandOptions
Algol.calculateCommandResult = function(state,newstate,commanddef){
	var newdata = newstate.get("data"), comparetostate = state;
	// if newstate is equal to a previous step this turn, treat as a goback command
	while(comparetostate.get("steps").size){
		comparetostate = comparetostate.get("previousstep");
		if (I.is(comparetostate.get("data"),newdata)){ return I.List(["backto",comparetostate]); }
	}
	// newstate is really new state, treat it as such
	return I.List(["newstep",I.pushIn(newstate,["steps"],this.calculateStepData(state,commanddef)).set("previousstep",state).set("marks",this.updateMarksFromCommand(state,commanddef)).setIn(["context","performedsteps"],state.getIn(["context","performedsteps"])+1)]);
};

// returns an endturn option. this will either be an endgame or passing to another player
// Used in Algol.listCommandOptions
Algol.endTurnOption = function(state,endturndef){
	return endturndef.get("endgame").reduce(function(mem,end,name){
		return mem || this.evaluateBoolean(state,end.get("condition")) && ["endgame",name,this.evaluateValue(state,end.get("winner"))];
	},undefined,this) || ["passto",this.evaluateValue(state,endturndef.get("passto"))];
};

// Returns an array of available commands
// Used in Algol.hydrateState  -- TODO really the right place?
Algol.listCommandOptions = function(state,gamedef){
	return I.setIf(I.setIf((state.get("canendturn") && gamedef.getIn(["endturn","commandcap"]) ? I.Map() : gamedef.get("commands")).reduce(function(ret,comdef,comname){
		return this.canExecuteCommand(state,comdef) ? ret.set(comname,this.calculateCommandResult(state,this.applyEffect(state,comdef.get("effect")),comdef)) : ret;
	},I.Map(),this),"endturn",state.get("canendturn") && this.endTurnOption(state,gamedef.get("endturn"))),"undo",state.has("previousstep") ? ["backto",state.get("previousstep")] : false) ;
};


// Called from Algol.performOption (various) // TODO - kull of this crap
Algol.hydrateStateAfterCommand = function(state){ 
	state = this.applyGeneratorList(state,state.getIn(["gamedef","hydration"]));
	state = state.set("canendturn",this.evaluateBoolean(state,state.getIn(["gamedef","endturn","condition"])));
	if (state.get("canendturn")){
		state = this.applyGeneratorList(state,state.getIn(["gamedef","endturn","hydration"]));
	}
	return state.set("commands",this.listCommandOptions(state,state.get("gamedef")));
};


var optionmethods = {
	backto: function(state,oldstate){ return oldstate; },
	newstep: function(state,newstate){ return this.hydrateStateAfterCommand(newstate); },
	passto: function(state,player){
		return this.hydrateStateAfterCommand(this.prepareNewTurnState(state,player));
	},
	endgame: function(state,cond,player){ return state.merge({player:player,status:cond}); }
};

Algol.performOption = function(state,def){
	return optionmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithExecuteFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithExecuteFunctions;
} else {
    window.augmentWithExecuteFunctions = augmentWithExecuteFunctions;
}})();
