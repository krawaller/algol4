(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithFlowFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ F L O W  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


Algol.removeMark = function(tree,id,markname){
	return tree.set("current",tree.getIn(["cache",id,"removeMarks",markname]));
}

Algol.makeMark = function(tree,id,markname,pos,nodive){
	var oldstate = tree.getIn(["cache",id]),
		newid = id+","+pos,
		stored = tree.getIn(["cache",newid]);
	if (stored){
		if (!nodive && !stored.get("pruned")){
			tree = this.pruneOptions(tree,newid);
		}
		return tree.set("current",newid);
	} else {
		var newstate = oldstate
			.setIn(["removeMarks",markname],id)
			.set("availableMarks",I.Map())
			.set("availableCommands",I.Map())
			.set("reversalCommands",I.Map())
			.set("id",newid)
			.set("canendturnnow",false)
			.set("canreachendturn",false)
			.set("path",oldstate.get("path").push(pos))
			.setIn(["marks",markname],pos);
		tree = tree.setIn(["cache",newid],newstate);
		tree = this.obeyInstructions(tree,newid,tree.getIn(["gamedef","marks",markname]));
		if (!nodive){
			tree = this.pruneOptions(tree,newid);
		}
		return tree.set("current",newid);
	}
};

Algol.makeCommand = function(tree,id,cmndname,nodive){
	var fromstate = tree.getIn(["cache",id]),
		reversal = fromstate.getIn(["reversalCommands",cmndname]);
	if (cmndname==="undo"){
		//console.log("UNDOING",cmndname,state.get("undo"),state.hasIn(["cache",state.get("undo")]));
		return tree.set("current",fromstate.get("undo"));
	} else if (cmndname==="endturn"){
		return this.endTurn(tree,id);
	} else if (reversal){
		//console.log("REVERSING!");
		return tree.set("current",reversal);
	} else {
		var newid = fromstate.getIn(["availableCommands",cmndname]),
			newstate = tree.getIn(["cache",newid ]);
		if (!nodive && !newstate.get("pruned")){
			tree = this.pruneOptions(tree,newid);
		}
		//console.log("Performed command",cmndname,"for id",id,"which lead to",newid);
		return tree.set("current",newid);
	}
};

Algol.allowMark = function(tree,id,markname){
	//console.log("Allowing mark",markname)
	var state = tree.getIn(["cache",id]);
	return tree.setIn(["cache",id],this.evaluatePositionSet(state,state.getIn(["gamedef","marks",markname,"from"])).reduce(function(s,pos){
		return s.setIn(["availableMarks",pos],markname);
	},state));
};

Algol.calculateStateAfterCommand = function(state,cdef,auto){
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

Algol.allowCommand = function(tree,id,cmndname,auto){
	//console.log("Allowing command",cmndname);
	var gamedef = tree.get("gamedef"),
		cdef = gamedef.getIn(["commands",cmndname]),
		newstate = this.calculateStateAfterCommand(tree.getIn(["cache",id]),cdef,auto),
		newid = newstate.get("id");
	// make sure this isn't a reversal to earlier
	var tocheck = newstate
	while(tocheck.has("undo")){
		tocheck = tree.getIn(["cache",tocheck.get("undo")]);
		if (this.areStatesEqual(tocheck,newstate)){
			return tree.setIn(["cache",id,"reversalCommands",cmndname],tocheck.get("id"));
		}
	};
	// command causes new state! we add its instructions (and generators)
	tree = tree.setIn(["cache",newid],newstate.set("undo",id));
	tree = this.obeyInstructions(tree,newid,cdef);
	var afterstep = gamedef.get("afterstep");
	if (afterstep){
		tree = this.obeyInstructions(tree,newid,afterstep);
	}
	if (!auto){
		tree = tree.setIn(["cache",id,"availableCommands",cmndname],newid);
	}
	//console.log("Allowed command",cmndname,"for",id,"which would lead to",newid);
	return tree;
};


Algol.endTurn = function(tree,id){
	var endturndef = tree.getIn(["gamedef","endturn"]),
		state = tree.getIn(["cache",id]),
		newturntree, finishid;
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
	if (endgame) {
		// Endgame condition met!
		finishid = state.get("id")+",finish";
		return tree.setIn(["cache",finishid],state).set("current",finishid);
	} else {
		newturntree = this.newTurnTree(tree,state,state.getIn(["passto",state.get("player")]));
		newturntree = this.checkEndReach(newturntree,"root");
		// Opponent cannot end in next turn!
		if (!newturntree.get("canreachendturn")){
			state = state.set("endedby", newturntree.get("forbidden") || "stalemate").set("winner",state.get("player"));
			return tree.setIn(["cache",finishid],state).set("current",finishid);
		}
		// Game keeps going!
		return newturntree.set("current","root"); // todo - store final states on tree for comparison?
	}
};

Algol.allowEndTurn = function(tree,id){
	//console.log("allowing endturn");
	var endturndef = tree.getIn(["gamedef","endturn"]),
		unless = endturndef.get("unless"),
		forbidden,
		state = tree.getIn(["cache",id]);
	if (unless){
		state = unless.reduce(function(s,cond,name){
			if (this.evaluateBoolean(s,cond)){
				forbidden = name;
				return s.set("forbidden",name);
			}
			return s;
		},state,this);
	}
	if (forbidden){
		return tree.set("forbidden",forbidden);
	} else {
		return tree.setIn(["cache",id,"canendturnnow"],true).set("canreachendturn",true);
	}
};

Algol.newTurnTree = function(oldtree,state,newturnplayer){
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
	var newtree = oldtree.set("cache",I.Map().set("root",state)).set("current","root");
	// commands
	newtree = this.obeyInstructions(newtree,state.get("id"),startturn);
	//newtree = this.pruneOptions(newtree,state.get("id"));
	//console.log("So ok, what do we have here. Old tree",oldtree.toJS(),"new tree",newtree.toJS());
	return newtree;
};

// Called in endTurn
Algol.checkEndReach = function(tree,id){
	return tree.set("canreachendturn",true);
}

// called in newGame, makeMark, makeCommand
Algol.pruneOptions = function(tree,id){
	return tree;
}

Algol.newGame = function(gamedef,nbrofplayers){
	var commandslist = gamedef.get("commands").keySeq().sort(),
		startunits = this.prepareInitialUnitsForGame(gamedef);
	var startstate = I.fromJS({
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
	return this.checkEndReach(this.newTurnTree(I.Map().set("gamedef",gamedef),startstate,1),"root");
};


var allowmethods = {
	ifelse: function(tree,state,bool,allow1,allow2){
		return this.evaluateBoolean(state,bool) ? this.allow(state,allow1) : this.allow(state,allow2);
	},
	"if": function(tree,state,bool,allowdef){
		return this.evaluateBoolean(state,bool) ? this.allow(state,allowdef) : state;
	},
	auto: function(tree,state,cmnd){
		cmnd = this.evaluateValue(state,cmnd);
		//console.log("Autodoing",cmnd,"for state",state.get("id"));
		return this.allowCommand(tree,state.get("id"),cmnd,true);
	}
};

Algol.allow = function(tree,id,def){

	if (tree.hasIn(["gamedef","marks",def])){
		return this.allowMark(tree,id,def);
	} else if (tree.hasIn(["gamedef","commands",def])){
		return this.allowCommand(tree,id,def);
	} else if (def === "endturn"){
		return this.allowEndTurn(tree,id);
	}
	if (!def.first || typeof def.first !== "function" || !allowmethods[def.first()] ){
		console.log("ALARM",def && def.toJS && def.toJS() || def);
	}
	return allowmethods[def.first()].apply(this,[tree,tree.getIn(["cache",id])].concat(def.rest().toArray()));
};

Algol.obeyInstructions = function(tree,id,instr){
	//console.log("Obeying instruction",tree.toJS(),"id",id,"instr",instr.toJS());
	if (instr.has("runGenerators")){
		//console.log("applying generator list",instr.get("runGenerators").toJS && instr.get("runGenerators").toJS()  )
		tree = tree.setIn(["cache",id],this.applyGeneratorList(tree.getIn(["cache",id]),instr.get("runGenerators")));
		//console.log("after generator list",state.get("layers").toJS())
	}
	if (instr.has("allow")){
		tree = instr.get("allow").reduce(function(t,def){
			return this.allow(t,id,def)
		},tree,this);
	}
	return tree;
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithFlowFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithFlowFunctions;
} else {
    window.augmentWithFlowFunctions = augmentWithFlowFunctions;
}})();
