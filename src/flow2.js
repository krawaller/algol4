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
	console.log("Gonna remove mark",markname,"which means",state.getIn(["removeMarks",markname]), "in cache",state.hasIn(["cache", state.getIn(["removeMarks",markname]) ]) );
	return state.getIn(["cache", state.getIn(["removeMarks",markname]) ]); //.setIn(["cache",state.get("id")],state);
}

Algol.makeMark = function(state,markname,pos,nodive){
	var oldid = state.get("id"), newid = oldid+","+pos, stored = state.getIn(["cache",newid]);
	if (stored){
		console.log("Gonna make mark",markname,"at",pos,"which was already stored",stored.get("pruned"));
		return nodive || stored.get("pruned") ? stored : this.pruneOptions( stored );
	}
	console.log("Gonna make mark",markname,"at",pos,"which needs to be calculated");
	var newstate = state
		.setIn(["removeMarks",markname],oldid)
		.set("availableMarks",I.Map())
		.set("availableCommands",I.Map())
		.set("reversalCommands",I.Map())
		.set("id",newid)
		.set("canendturnnow",false)
		.set("canreachendturn",false)
		.set("path",state.get("path").push(pos))
		.setIn(["marks",markname],pos);
	newstate = this.obeyInstructions(newstate,newstate.getIn(["gamedef","marks",markname]));
	if (!nodive){
		newstate = this.pruneOptions(newstate);
	}
	newstate = newstate.setIn(["cache",oldid],state.setIn(["cache",newid,newstate]));
	return newstate;
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

Algol.performCommand = function(state,cdef,auto){
	var gamedef = state.get("gamedef"),
		cmndname = cdef.get("name"),// = gamedef.getIn(["gamedef","commands",cmndname]),
		afterstep = gamedef.get("afterstep"),
		oldid = state.get("id"),
		newid = auto ? oldid : oldid+","+cmndname,
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
		.set("canendturnnow",false)
		.set("canreachendturn",false)
		.set("path",auto ? state.get("path") : state.get("path").push(cmndname))
		.setIn(["context","performedsteps"],state.getIn(["context","performedsteps"])+1);
	newstate = auto ? newstate : I.pushIn(newstate,["steps"],I.fromJS({
		command: cmndname,
		marks: state.get("marks")
	}));
	newstate = this.prepareBasicUnitLayers(newstate);
	return newstate;
};

Algol.allowCommand = function(state,cmndname,auto){
	//console.log("Allowing command",cmndname);
	var gamedef = state.get("gamedef"),
		cdef = gamedef.getIn(["commands",cmndname]),
		newstate = this.performCommand(state,cdef,auto),
		newid = newstate.get("id");
	// make sure this isn't a reversal to earlier
	var tocheck = newstate
	while(tocheck.has("undo")){
		tocheck = tocheck.getIn(["cache",tocheck.get("undo")]);
		if (this.areStatesEqual(tocheck,newstate)){
			return state.setIn(["reversalCommands",cmndname],tocheck.get("id"));
		}
	};
	// command causes new state! we add its instructions (and generators)
	newstate = this.obeyInstructions(newstate,cdef);
	var afterstep = gamedef.get("afterstep");
	if (afterstep){
		newstate = this.obeyInstructions(newstate,afterstep);
	}
	return auto ? newstate : state
		.setIn(["availableCommands",cmndname],newid)
		.setIn(["cache",newid], newstate);
};


Algol.endTurn = function(state){
	var endturndef = state.getIn(["gamedef","endturn"]);
	// perform eventual afterturn effects
	if (endturndef.has("applyEffects")){
		state = endturndef.get("applyEffects").reduce(function(s,effect){
			return this.applyEffect(s,effect);
		},state,this);
		state = this.prepareBasicUnitLayers(state);
	}
	// end game if reached sth
	var endgame = endturndef.get("endgame").reduce(function(mem,end,name){
		if (!mem && this.evaluateBoolean(state,end.get("condition"))) {
			var //res = this.evaluateValue(state,end.get("result")),
				who = end.has("who") && this.evaluateValue(state,end.get("who")) || state.get("player");  //(res==="loseto" && this.evaluateValue(state,end.get("who")) || res==="draw" || 0 || state.get("player") );
			return state
				.set("endedby",name)
				.set("winner",who)
				.set("save",state.get("save").push(state.get("path")));
		}
		return mem;
	},undefined,this);
	if (endgame) { return endgame; }
	// end if nxtplayer cannot end
	var newstate = this.newTurn(state,state.getIn(["passto",state.get("player")]));
	if (!this.canReachEndTurn(newstate)){ // TODO AARGH!!
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
		unless = endturndef.get("unless"),
		forbidden;
	if (unless){
		state = unless.reduce(function(s,cond,name){
			if (this.evaluateBoolean(s,cond)){
				//console.log("FOrbidden",name,"for state",s.get("id"));
				forbidden = name;
				return s.set("forbidden",name);
			}
			return s;
		},state,this);
	}
	if (forbidden){
		//console.log("Hmm",state.get("forbidden"),state.get("id"),"layers",state.get("layers").toJS());
	}
	return forbidden ? state : state.set("canreachendturn",true).set("canendturnnow",true);
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
		path: [],
		cache: {},
		marks: {},
		availableCommands: {},
		availableMarks: {},
		reversalCommands: {},
		removeMarks: {},
		steps: [],
		save: state.get("turn") ? state.get("save").push(state.get("path")) : I.List(),
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

Algol.analyzeEndReach = function(state){
	//console.log("Analyzing reach of",state.get("id"),state.get("canendturnnow"),state.get("canreachendturn"),state.get("forbidden"));
	var debug = false;
	if (state.get("canreachendturn")){
		debug && console.log("Analyzing reach of",state.get("id"),"it can reach eventually!");
		return state;
	} else if (state.get("canendturnnow")){
		debug && console.log("Analyzing reach of",state.get("id"),"it can end now!");
		return state.set("canreachendturn",true);
	} else if (state.getIn(["gamedef","endturn","canalwaysreachend"])){
		debug && console.log("Analyzing reach of",state.get("id"),"it can always reach end!");
		return state.set("canreachendturn",true);
	} else {
		// check commands
		state = state.get("availableCommands").reduce(function(s,id,cmndname){
			if (s.get("canreachendturn")){
				return s;
			}
			var teststate = this.analyzeEndReach(this.makeCommand(s,cmndname,true));
			if (teststate.get("canreachendturn")){
				s = s.set("reachendby",cmndname);
			}
			return s.set("canreachendturn",teststate.get("canreachendturn")).set("forbidden",teststate.get("forbidden"));
		},state,this);
		if (state.get("canreachendturn")){
			debug && console.log("Analyzing reach of",state.get("id"),"it can reach end by command",state.get("reachendby"));
			return state;
		}
		// check marks
		state = state.get("availableMarks").reduce(function(s,markname,pos){
			if (s.get("canreachendturn")){
				return s;
			}
			var teststate = this.analyzeEndReach(this.makeMark(s,markname,pos,true));
			if (teststate.get("canreachendturn")){
				s = s.set("reachendby",markname+"-"+pos);
			}
			return s.set("canreachendturn",teststate.get("canreachendturn")).set("forbidden",teststate.get("forbidden"));
		},state,this);
		if (state.get("canreachendturn")){
			debug && console.log("Analyzing reach of",state.get("id"),"it can reach end by mark",state.get("reachendby"));
			return state;
		} else {
			debug && console.log("Analyzing reach of",state.get("id")," but it is a dead end :(",state.get("forbidden"));
			return state
		}
	}

}

Algol.pruneOptions = function(state){
	//return state;

	if (state.hasIn(["gamedef","endturn","canalwaysreachend"])){
		return state;
	}
	var debug = false;
	debug && console.log("pruning state",state.get("id"));
	// fix markings
	state = state.get("availableMarks").reduce(function(s,markname,pos){
		var newstate = this.analyzeEndReach(this.makeMark(s,markname,pos,true));
		//if (state.hasIn(["gamedef","marks",markname,"canalwaysreachturnend"]) || this.canReachEndTurn(newstate)){
		if (newstate.get("canreachendturn")){
			debug && console.log("state",s.get("id"),"can reach end by mark",markname,"at pos",pos,"so keeping that")
			return s.set("canreachendturn",true).setIn(["cache",newstate.get("id")],newstate); 
		} else {
			debug && console.log("state",s.get("id"),"can NOT reach end by mark",markname,"at pos",pos,"so DELETING that")
			return s.deleteIn(["availableMarks",pos]).deleteIn(["cache",newstate.get("id")]).set("forbidden",newstate.get("forbidden")||s.get("forbidden"));
		}
	},state,this);
	// fix commands
	state = state.get("availableCommands").reduce(function(s,newid,cmndname){
		var newstate = this.analyzeEndReach(this.makeCommand(s,cmndname,true));
		//if (this.canReachEndTurn(newstate)){
		if (newstate.get("canreachendturn")){
			debug && console.log("state",s.get("id"),"can reach end by cmnd",cmndname,"so keeping that")
			return s.set("canreachendturn",true).setIn(["cache",newid],newstate); 
		} else {
			debug && console.log("state",s.get("id"),"can NOT reach end by cmnd",cmndname,"so DELETING that")
			return s.deleteIn(["availableCommands",cmndname]).deleteIn(["cache",newid]).set("forbidden",newstate.get("forbidden")||s.get("forbidden"));
		}
	},state,this);
	// send me home
	debug && console.log("Pruned turn",state.get("turn"),"player",state.getIn(["context","currentplayer"]),"id",state.get("id"),"fobidden is",state.get("forbidden"));
	return state.set("pruned",true);
};

Algol.newGame = function(gamedef,nbrofplayers){
	var commandslist = gamedef.get("commands").keySeq().sort(),
		startunits = this.prepareInitialUnitsForGame(gamedef);
	var state = I.fromJS({
		gamedef: gamedef.set("commands",commandslist.reduce(function(map,comname,n){
			return map.set(comname,gamedef.getIn(["commands",comname]).set("number",n+1));
		},I.Map())),
		commandsinorder: commandslist,
		connections: this.prepareConnectionsFromBoardDef(gamedef.get("board")),
		data: {
			units: startunits,
			playervars: this.prepareInitialPlayerVarsForGame(gamedef),
		},
		startunits: startunits,
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
	},
	auto: function(state,cmnd){
		cmnd = this.evaluateValue(state,cmnd);
		//console.log("Autodoing",cmnd,"for state",state.get("id"));
		return this.allowCommand(state,cmnd,true);
	}
};

Algol.allow = function(state,def){
	//console.log("ALLOW",def && def.toJS && def.toJS() || def);
	if (state.hasIn(["gamedef","marks",def])){
		return this.allowMark(state,def);
	} else if (state.hasIn(["gamedef","commands",def])){
		return this.allowCommand(state,def);
	} else if (def === "endturn"){
		return this.allowEndTurn(state);
	}
	if (!def.first){
		console.log("ALARM",def);
	}
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
