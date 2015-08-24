(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithFlowFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ F L O W  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

/*

flow game, turn, command, mark

Each state has a turn-specific id: pos,pos,command,pos,command etc
It also has a cache with previous stored states, by id.

GAME
 * pretty much same as before

MARK
 * set removemark[pos] to id of prior state and cache prior state
 * add mark to state.marks[markname] = pos
 * flow instructions from mark


COMMAND - backtrack through undos to see if same
 * set undo to id of prior state
 * reset marks, removemarks, layers
 * increase stepcount
 * flow instructions from command, afterstep

NEWTURN
 * change player, base layer
 * increase turn
 * flow instructions from startturn


FLOWINSTRUCTIONS
 * allowmark
 * allowcommand
 * allowend
 // cmnd only
 * performeffects
 * setmarks (ignore for ai)


*/

Algol.obeyInstructions = function(state,instr){
	if (instr.has("runGenerators")){
		state = this.applyGeneratorList(state,instr.get("rungenerators"));
	}
	if (instr.has("allowMarks")){
		state = state.get("allowMarks").reduce(this.allowMark,state,this);
	}
	if (instr.has("allowCommands")){
		state = state.get("allowCommands").reduce(this.allowCommand,state,this);	
	}
	if (instr.has("allowEndTurn")){
		state = this.allowEndTurn(state);
	}
	return state;
};

Algol.allowMark = function(state,markname){
	var mdef = state.getIn(["gamedef",markname]),
		oldid = state.get("id"),
		newstateblueprint = state
			.setIn(["removeMarks",markname],oldid)
			.setIn(["cache",oldid],state)
			.deleteIn(["availableMarks",markname]) // shouldn't have to do that
			.set("availableCommands",I.Map())
			.set("reversalCommands",I.Map());
	return this.evaluatePositionSet(state,mdef.get("from")).reduce(function(s,pos){
		var newid = oldid+","+pos, newstate = newstateblueprint
			.setIn(["marks",markname],pos)
			.set("id",newid)
		newstate = this.obeyInstructions(newstate,mdef);
		return newstate.get("canreachendturn") ? state : state
			.setIn(["availableMarks",markname,pos],newid)
			.setIn(["cache",newid],newstate)
			.set("canreachendturn",true);
	},state,this);
};

Algol.performCommand = function(state,cdef){
	var gamdef = state.get("gamedef"),
		cmndname = cdef.get("name"),// = gamedef.getIn(["gamedef","commands",cmndname]),
		afterstep = gamedef.get("afterstep"),
		oldid = state.get("id"),
		newid = oldid+","+cmndname;
		newstate = state
			.set("id",newid)
			.set("undo",oldid)
			.setIn(["cache",oldid],state)
			.set("availableCommands",I.Map())
			.set("reversalCommands",I.Map())
			.set("availableMarks",I.Map())
			.set("marks",I.Map())
			.set("removeMarks",I.Map())
			.setIn(["context","hasperformed"+cmndname],true)
			.setIn(["context","performedsteps"],state.getIn(["context","performedsteps"])+1);
	// calculate new state after command effects
	newstate = cdef.get("applyEffects").reduce(function(s,effect){ // assumes commanddef has effects: [effect,effect,...]
		return this.applyEffect(s,effect);
	},newstate,this);
	return this.prepareBasicUnitLayers(newstate);
};

Algol.allowCommand = function(state,cmndname){
	var gamdef = state.get("gamedef"),
		cdef = gamedef.getIn(["gamedef","commands",cmndname]),
		newstate = this.performCommand(state,cdef),
		newid = newstate.get("id");
	// make sure this isn't a reversal to earlier
	var tocheck = newstate
	while(tocheck.has("undo")){
		tocheck = tocheck.getIn(["cache",tocheck.get("undo")]);
		if (this.areStatesEqual(tocheck,newstate)){
			return state.setIn(["reversalCommands",cmndname],tocheck.get("id"));
		}
	});
	// command causes new state! we add its instructions
	newstate = this.obeyInstructions(newstate,cdef);
	if (afterstep){
		newstate = this.obeyInstructions(newstate,afterstep);
	}
	return newstate.get("canreachendturn") ? state : state
		.setIn(["availableCommands",cmndname],newid)
		.setIn([cache,newid],newstate)
		.set("canreachendturn",true)
};


Algol.endTurn = function(state){
	var endturndef = state.get("endturn");
	// end game if reached sth
	var endgame = endturndef.get("endgame").reduce(function(mem,end,name){
		if (!mem && this.evaluateBoolean(state,end.get("condition"))) {
			var res = this.evaluateValue(state,end.get("result")),
				who = (res==="loseto" && this.evaluateValue(state,end.get("who")) || res==="draw" || 0 || state.get("player") );
			return state
				.set("endedby",name)
				.set("winner",who);
		}
		return mem;
	},undefined,this);
	if (endgame) { return endgame; }
	// end if nxtplayer cannot end
	var newstate = this.newTurn(state,state.getIn(["passto",state.get("player")]));
	if (!newstate.get("canreachendturn")){
		return state
			.set("endedby", newstate.get("forbidden") || "stalemate" )
			.set("winner", state.get("player"));
	}
	// no end, return new state
	return newstate;
};


Algol.allowEndTurn = function(state){
	var endturndef = state.getIn(["gamedef","endturn"]),
		unless = endturndef.get("unless");
	if (unless){
		state = unless.reduce(function(s,cond,name){
			return this.evaluateBoolean(s,cond) ? s.set("forbidden",name) : state;
		},state,this);
	}
	return state.has("forbidden") ? state : state.set("canreachendturn",true).set("canendturnnow",true);
};

Algol.newTurn = function(state,newturnplayer){
	var startturn = state.getIn(["gamedef","startturn"])||I.Map(),
		//effect = startturn.get("applyeffect"),
		baselayer = state.getIn(["baselayers",newturnplayer])||state.getIn(["baselayers",newturnplayer+""]);
	// set basics
	state = state.delete("previousstep").delete("canreachendturn").delete("canendnow").delete("forbidden").merge(I.fromJS({
		player: newturnplayer,
		turn: (state.get("turn")||0)+1,
		baselayer: baselayer,
		marks: {},
		availableCommands: {},
		availableMarks: {},
		reversalCommands: {},
		removeMarks: {},
		context: state.get("basecontext").merge(I.fromJS({
			currentplayer:newturnplayer,
			turn: (state.get("turn")||0)+1,
			performedsteps:0,
			nextplayer:state.getIn(["passto",newturnplayer])||state.getIn(["passto",""+newturnplayer])
		}))
	}));
	// effects ?
	if (startturn.has("applyEffects")){
		state = this.prepareBasicUnitLayers(state);
		//state = this.applyGeneratorList(state,startturn.get("rungenerators")||I.List());
		state = startturn.get("applyEffects").reduce(function(s,effect){
			return this.applyEffect(s,effect);
		},state,this);
	}
	// layers
	state = this.prepareBasicUnitLayers(state);
	// commands
	return this.obeyInstructions(startturn);
};


Algol.newGame = function(gamedef,nbrofplayers){
	var commandslist = gamedef.get("commands").keySeq().sort();
	var state = I.fromJS({
		gamedef: gamedef.set("commands",commandslist.reduce(function(map,comname,n){
			return map.set(comname,gamedef.getIn(["commands",comname]).set("number",n+1));
		},I.Map())),
		commandsinorder: commandslist,
		connections: this.prepareConnectionsFromBoardDef(gamedef.get("board")),
		data: I.Map().set("units",this.prepareInitialUnitDataFromSetup(gamedef.get("setup"))),
		baselayers: this.prepareBaseLayers(gamedef,nbrofplayers),
		basecontext: {
			nbrofplayers: nbrofplayers
		},
		status: "ongoing",
		passto: _.reduce(_.range(1,nbrofplayers+1),function(mem,p){
			return mem.set(p,p===nbrofplayers?1:p+1);
		},I.Map())
	});
	return this.newTurn(state,1)
};



// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithFlowFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithFlowFunctions;
} else {
    window.augmentWithFlowFunctions = augmentWithFlowFunctions;
}})();
