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

Algol.removeMark = function(state,markname){
	//console.log("Gonna remove mark",markname,"which means",state.getIn(["removeMarks",markname]), "in cache",state.getIn(["cache", state.getIn(["removeMarks",markname]) ]) )
	return state.getIn(["cache", state.getIn(["removeMarks",markname]) ]);
}

Algol.makeMark = function(state,markname,pos,nodive){
	var oldid = state.get("id"), newid = oldid+","+pos;
	if (state.hasIn(["cache",newid])){
		return state.getIn(["cache",newid]);
	}
	var newstate = state
		.setIn(["removeMarks",markname],oldid)
		.setIn(["cache",oldid],state)
		.set("availableMarks",I.Map())
		.set("availableCommands",I.Map())
		.set("reversalCommands",I.Map())
		.set("id",newid)
		.setIn(["marks",markname],pos);
	newstate = this.obeyInstructions(newstate,newstate.getIn(["gamedef","marks",markname]));
	return nodive ? newstate : this.pruneOptions(newstate);
};

Algol.makeCommand = function(state,cmnd,nodive){
	if (cmnd==="undo"){
		//console.log("UNDOING",cmnd,state.get("undo"),state.hasIn(["cache",state.get("undo")]));
		return state.getIn(["cache",state.get("undo")]);
	} else if (cmnd==="endturn"){
		return this.endTurn(state);
	} else {
		var oldid = state.get("id"),
			newstate = state.getIn(["cache",state.getIn(["availableCommands",cmnd]) ])
				.set("undo",oldid)
				.setIn(["cache",oldid],state);
		return nodive ? newstate : this.pruneOptions(newstate);
	}
};

Algol.allowMark = function(state,markname){
	//console.log("Allowing mark",markname);
	return this.evaluatePositionSet(state,state.getIn(["gamedef","marks",markname,"from"])).reduce(function(s,pos){
		return s.setIn(["availableMarks",pos],markname);	
	},state);
};

Algol.performCommand = function(state,cdef){
	var gamedef = state.get("gamedef"),
		cmndname = cdef.get("name"),// = gamedef.getIn(["gamedef","commands",cmndname]),
		afterstep = gamedef.get("afterstep"),
		oldid = state.get("id"),
		newid = oldid+","+cmndname,
		newstate;
	// calculate new state after command effects
	newstate = cdef.get("applyEffects").reduce(function(s,effect){
		return this.applyEffect(s,effect);
	},state,this);
	// set new stuff
	newstate = newstate
		.set("id",newid)
		.set("availableCommands",I.Map())
		.set("reversalCommands",I.Map())
		.set("availableMarks",I.Map())
		.set("marks",I.Map())
		.set("removeMarks",I.Map())
		.setIn(["context","hasperformed"+cmndname],true)
		.setIn(["context","performedsteps"],state.getIn(["context","performedsteps"])+1);
	newstate = I.pushIn(newstate,["steps"],I.fromJS({
		command: cmndname,
		marks: state.get("marks")
	}));
	return this.prepareBasicUnitLayers(newstate);
};

Algol.allowCommand = function(state,cmndname){
	//console.log("Allowing command",cmndname);
	var gamedef = state.get("gamedef"),
		cdef = gamedef.getIn(["commands",cmndname]),
		newstate = this.performCommand(state,cdef),
		newid = newstate.get("id");
	// make sure this isn't a reversal to earlier
	var tocheck = newstate
	while(tocheck.has("undo")){
		tocheck = tocheck.getIn(["cache",tocheck.get("undo")]);
		if (this.areStatesEqual(tocheck,newstate)){
			return state.setIn(["reversalCommands",cmndname],tocheck.get("id"));
		}
	};
	// command causes new state! we add its instructions
	newstate = this.obeyInstructions(newstate,cdef);
	var afterstep = gamedef.get("afterstep");
	if (afterstep){
		newstate = this.obeyInstructions(newstate,afterstep);
	}
	return state
		.setIn(["availableCommands",cmndname],newid)
		.setIn(["cache",newid], newstate);
};


Algol.endTurn = function(state){
	var endturndef = state.getIn(["gamedef","endturn"]);
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
	if (!this.canReachEndTurn(newstate)){
		return state
			.set("endedby", newstate.get("forbidden") || "stalemate" )
			.set("winner", state.get("player"));
	}
	// no end, return new state
	return newstate;
};


Algol.allowEndTurn = function(state){
	//console.log("allowing endturn");
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
	state = state.delete("previousstep").delete("canreachendturn").delete("canendturnnow").delete("forbidden").delete("undo").merge(I.fromJS({
		player: newturnplayer,
		turn: (state.get("turn")||0)+1,
		baselayer: baselayer,
		id: "root",
		cache: {},
		marks: {},
		availableCommands: {},
		availableMarks: {},
		reversalCommands: {},
		removeMarks: {},
		steps: [],
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
	state = this.obeyInstructions(state,startturn);
	if (true){
		state = this.pruneOptions(state);
	}
	return state;
};

Algol.canReachEndTurn = function(state){ // TODO - cache the checked states?
	//console.log("...checking reach capability of",state.get("id"));
	return state.get("canendturnnow") || state.getIn(["gamedef","endturn","canalwaysreachend"]) || state.get("availableCommands").some(function(id,cmndname){
		return this.canReachEndTurn( this.makeCommand(state,cmndname,true) );
	},this) || state.get("availableMarks").some(function(markname,pos){
		return this.canReachEndTurn( this.makeMark(state,markname,pos,true) );
	},this);
};

Algol.pruneOptions = function(state){
	if (state.hasIn(["gamedef","endturn","canalwaysreachend"])){
		return state;
	}
	var debug = false;
	debug && console.log("pruning state",state.get("id"));
	// fix markings
	state = state.get("availableMarks").reduce(function(s,markname,pos){
		var newstate = this.makeMark(s,markname,pos,true);
		if (this.canReachEndTurn(newstate)){
			debug && console.log("state",s.get("id"),"can reach end by mark",markname,"at pos",pos,"so keeping that")
			return s.set("canreachendturn",true).setIn(["cache",newstate.get("id")],newstate); 
		} else {
			debug && console.log("state",s.get("id"),"can NOT reach end by mark",markname,"at pos",pos,"so DELETING that")
			return s.deleteIn(["availableMarks",pos]).deleteIn(["cache",newstate.get("id")]);
		}
	},state,this);
	// fix commands
	state = state.get("availableCommands").reduce(function(s,newid,cmndname){
		var newstate = this.makeCommand(s,cmndname,true);
		if (this.canReachEndTurn(newstate)){
			debug && console.log("state",s.get("id"),"can reach end by cmnd",cmndname,"so keeping that")
			return s.set("canreachendturn",true).setIn(["cache",newid],newstate); 
		} else {
			debug && console.log("state",s.get("id"),"can NOT reach end by cmnd",cmndname,"so DELETING that")
			return s.deleteIn(["availableCommands",cmndname]).deleteIn(["cache",newid]);
		}
	},state,this);
	// send me home
	return state;
};


Algol.newGame = function(gamedef,nbrofplayers){
	var commandslist = gamedef.get("commands").keySeq().sort();
	var state = I.fromJS({
		gamedef: gamedef.set("commands",commandslist.reduce(function(map,comname,n){
			return map.set(comname,gamedef.getIn(["commands",comname]).set("number",n+1));
		},I.Map())),
		commandsinorder: commandslist,
		connections: this.prepareConnectionsFromBoardDef(gamedef.get("board")),
		data: I.Map().set("units",this.prepareInitialUnitsForGame(gamedef)),
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


var allowmethods = {
	mark: Algol.allowMark,
	command: Algol.allowCommand,
	endturn: Algol.allowEndTurn,
	ifelse: function(state,bool,allow1,allow2){
		return this.evaluateBoolean(state,bool) ? this.allow(state,allow1) : this.allow(state,allow2);
	},
	"if": function(state,bool,allowdef){
		return this.evaluateBoolean(state,bool) ? this.allow(state,allowdef) : state;
	}
};

Algol.allow = function(state,def){
	//console.log("ALLOW",def && def.toJS && def.toJS() || def);
	return allowmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

Algol.obeyInstructions = function(state,instr){
	if (instr.has("runGenerators")){
		//console.log("applying generator list",instr.get("runGenerators").toJS && instr.get("runGenerators").toJS()  )
		state = this.applyGeneratorList(state,instr.get("runGenerators"));
		//console.log("after generator list",state.get("layers").toJS())
	}
	if (instr.has("allow")){
		state = instr.get("allow").reduce(Algol.allow,state,this);
	}
	return state;
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithFlowFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithFlowFunctions;
} else {
    window.augmentWithFlowFunctions = augmentWithFlowFunctions;
}})();
