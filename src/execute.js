(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithExecuteFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E X E C U T E  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

var effectmethods = {
	KILLUNIT: function(state,id){
		id = this.evaluateId(state,id);
		return I.pushInIfNew(state,["affected"],id).mergeIn(["data","units",id],{STATUS:"DEAD",AFFECTEDTURN:state.get("turn")});
	},
	MOVEUNIT: function(state,id,pos){
		id = this.evaluateId(state,id);
		return I.pushInIfNew(state,["affected"],id).mergeIn(["data","units",id],{POS:this.evaluatePosition(state,pos),AFFECTEDTURN:state.get("turn")});
	},
	TURNUNIT: function(state,id,mod){
		id = this.evaluateId(state,id);
		var newdir = state.getIn(["data","units",id,"DIR"])+this.evaluateValue(state,mod);
		return I.pushInIfNew(state,["affected"],id).mergeIn(["data","units",id],{DIR:(newdir>8?newdir-8:0>newdir?newdir+8:newdir),AFFECTEDTURN:state.get("turn")});
	},
	SETUNITDATA: function(state,id,propname,val){
		id = this.evaluateId(state,id);
		return I.pushInIfNew(state,["affected"],id).mergeIn(["data","units",id],_.object([propname,"AFFECTEDTURN"],[this.evaluateValue(state,val),state.get("turn")]));
	},
	SWAPUNITPOSITIONS: function(state,id1,id2){
		id1 = this.evaluateId(state,id1);
		id2 = this.evaluateId(state,id2);
		state = I.pushInIfNew(state,["affected"],id1);
		state = I.pushInIfNew(state,["affected"],id2);
		var temp = state.getIn(["data","units",id1,"POS"]);
		state = state.mergeIn(["data","units",id1],{POS:state.getIn(["data","units",id2,"POS"]),AFFECTEDTURN:state.get("turn")});
		return state.mergeIn(["data","units",id2],{POS:temp,AFFECTEDTURN:state.get("turn")});
	},
	CREATETERRAIN: function(state,pos,props){
		pos = this.evaluatePosition(state,pos);
		return state.setIn(["data","terrain",pos,I.fromJS(props).set("POS",pos)]);
	},
	FORALLIN: function(state,layername,effect){
		var layer = state.getIn(["layers",layername]);
		return state.getIn(["data","units"]).reduce(function(state,unit,id){
			return layer.has(unit.get("POS")) ? this.applyEffect(state.setIn(["context","LOOPID"],id),effect) : state;
		},state,this)[state.hasIn(["context","LOOPID"])?"setIn":"deleteIn"](["context","LOOPID"],state.getIn(["context","LOOPID"]));
	},
	MULTIEFFECT: function(state,list){
		return list.reduce(this.applyEffect.bind(this),state,this);
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
		if (I.is(comparetostate.get("data"),newdata)){ return I.List(["BACK",comparetostate]); }
	}
	// newstate is really new state, treat it as such
	return I.List(["NEWSTEP",I.pushIn(newstate,["steps"],this.calculateStepData(state,commanddef)).set("previousstep",state).set("marks",this.updateMarksFromCommand(state,commanddef)).setIn(["context","PERFORMEDSTEPS"],state.getIn(["context","PERFORMEDSTEPS"])+1)]);
};

// returns an endturn option. this will either be an endgame or passing to another player
// Used in Algol.listCommandOptions
Algol.endTurnOption = function(state,gamedef){
	return gamedef.get("endgame").reduce(function(mem,end,name){
		return mem || this.evaluateBoolean(state,end.get("condition")) && ["ENDGAME",name,this.evaluateValue(state,end.get("winner"))];
	},undefined,this) || ["PASSTO",this.evaluateValue(state,gamedef.getIn(["endturn","passto"]))];
};

// Returns an array of available commands
// Used in Algol.hydrateState  -- TODO really the right place?
Algol.listCommandOptions = function(state,gamedef){
	return I.setIf(I.setIf(gamedef.get("commands").reduce(function(ret,comdef,comname){
		return this.canExecuteCommand(state,comdef) ? ret.set(comname,this.calculateCommandResult(state,this.applyEffect(state,comdef.get("effect")),comdef)) : ret;
	},I.Map(),this),"ENDTURN",state.get("canendturn") && this.endTurnOption(state,gamedef)),"UNDO",state.has("previousstep") ? ["BACK",state.get("previousstep")] : false) ;
};


// Called from Algol.performOption (various)
Algol.hydrateState = function(state){
	state = this.applyGeneratorList(state,state.getIn(["gamedef","hydration"]));
	state = state.set("canendturn",this.evaluateBoolean(state,state.getIn(["gamedef","endturn","condition"])));
	if (state.get("canendturn")){
		state = this.applyGeneratorList(state,state.getIn(["gamedef","endturn","hydration"]));
	}
	return state.set("commands",this.listCommandOptions(state,state.get("gamedef")));
};

Algol.newTurnState = function(state,player){
	return state.merge(I.fromJS({
		steps: [],
		affected: [],
		save: state.get("save").push(I.List([state.get("player")]).concat(state.get("steps"))),
		marks: {},
		previousstep: state,
		previousturn: state,
		status: "ONGOING",
		player: player,
		turn: state.get("turn")+1,
		context: {CURRENTPLAYER:player,PERFORMEDSTEPS:0}
	}));
};

var optionmethods = {
	BACK: function(state,oldstate){ return oldstate; },
	NEWSTEP: function(state,newstate){ return this.hydrateState(newstate); },
	PASSTO: function(state,player){
		return this.hydrateState(this.newTurnState(state,player));
	},
	ENDGAME: function(state,cond,player){ return state.merge({player:player,status:cond}); }
};

Algol.performOption = function(state,def){
	return optionmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithExecuteFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithExecuteFunctions;
else
    window.augmentWithExecuteFunctions = augmentWithExecuteFunctions;
})();
