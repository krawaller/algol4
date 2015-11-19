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
		if (tree.getIn(["gamedef","marks",markname,"nodeadends"])){
			newstate = newstate.set("nodeadends",true);
		}
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
		//console.log("UNDO! was at",id,"to",fromstate.get("undo"),"tree",tree.toJS());
		return tree.set("current",fromstate.get("undo"));
	} else if (cmndname==="endturn"){
		return this.endTurn(tree,id);
	} else if (reversal){
		console.log("REVERSING! to",reversal,"tree",tree.toJS());
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
		//.set("undo",auto ? state.get("undobeforefirstauto") : oldid)
		//.set("path",auto ? state.get("path") : state.get("path").push(cmndname))
		.setIn(["context","performedsteps"],state.getIn(["context","performedsteps"])+1);
	if (!auto){
		newstate = newstate.delete("undobeforefirstauto").set("path",state.get("path").push(cmndname));
		newstate = I.pushIn(newstate,["steps"],I.fromJS({
			command: cmndname,
			marks: state.get("marks")
		}));
	}
	/*newstate = auto ? newstate : I.pushIn(newstate,["steps"],I.fromJS({
		command: cmndname,
		marks: state.get("marks")
	}));*/
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
	if (tree.getIn(["gamedef","checkrepeat"])){
		while(tocheck.has("undo")){
			tocheck = tree.getIn(["cache",tocheck.get("undo")]);
			if (this.areStatesEqual(tocheck,newstate)){
				return tree.setIn(["cache",id,"reversalCommands",cmndname],tocheck.get("id"));
			}
		}
	}
	// command causes new state! we add its instructions (and generators)
	tree = tree.setIn(["cache",newid],newstate.set("undo",auto ? newstate.get("undobeforefirstauto") : id));
	tree = this.obeyInstructions(tree,newid,cdef);
	var afterstep = gamedef.get("afterstep");
	if (afterstep){
		if (afterstep.has("applyEffects")){
			tree = tree.setIn(["cache",newid],this.prepareBasicUnitLayers(afterstep.get("applyEffects").reduce(function(s,effect){
				return this.applyEffect(s,effect);
			},tree.getIn(["cache",newid]),this)));
		}
		tree = this.obeyInstructions(tree,newid,afterstep);
	}
	if (!auto){
		tree = tree.setIn(["cache",id,"availableCommands",cmndname],newid);
	}
	//console.log("Allowed command",cmndname,"for",id,"which would lead to",newid);
	return tree;
};


Algol.endTurn = function(tree,id,inhistory){
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
	var endgame = inhistory ? false : endturndef.get("endgame").reduce(function(mem,end,name){
		if (!mem && this.evaluateBoolean(state,end.get("condition"))) {
			var //res = this.evaluateValue(state,end.get("result")),
				who = endturndef.has("winner")
					? this.evaluateValue(state,endturndef.get("winner"))
					: end.has("who") ? this.evaluateValue(state,end.get("who"))
					: state.get("player");
			return (state
				.set("endedby",name)
				.set("winner",who)
				.set("save",state.get("save").push(state.get("path")))
				.set("availableCommands",I.Map())
				.set("availableMarks",I.Map())
				.set("removeMarks",I.Map())
				.set("reversalCommands",I.Map())
			);
		}
		return mem;
	},undefined,this);
	if (endgame) {
		// Endgame condition met!
		//finishid = id+",finish";
		//console.log("ENDGAME!!")
		return tree.setIn(["cache",id],endgame).set("current",id);
	} else {
		newturntree = this.newTurnTree(tree.setIn(["cache",id,state]),id,state.getIn(["passto",state.get("player")]));
		if (!inhistory){
			newturntree = this.checkEndReach(newturntree,"root");
			// Opponent cannot end in next turn!
			if (!newturntree.getIn(["cache","root","canreachendturn"])){
				state = state
					.set("endedby", newturntree.get("forbidden") || "stalemate")
					.set("winner",endturndef.has("winner") ? this.evaluateValue(state,endturndef.get("winner")) : state.get("player"))
					.set("save",state.get("save").push(state.get("path")));
				return tree.setIn(["cache",id],state).set("current",id);
			}
		}
		// Game keeps going!
		newturntree = newturntree.set("current","root");
		return inhistory ? newturntree : this.pruneOptions(newturntree,"root"); // todo - store final states on tree for comparison?
	}
};

Algol.allowEndTurn = function(tree,id){
	//console.log("allowing endturn");
	var endturndef = tree.getIn(["gamedef","endturn"]),
		unless = endturndef.get("unless"),
		forbidden,
		state = tree.getIn(["cache",id]);
	//console.log("Gonna allow end turn id",id,"tree",tree.toJS());
	if (unless){
		state = unless.reduce(function(s,cond,name){
			//console.log(tree.get("gamedef").toJS(),"FULL UNLESS",unless.toJS(),"name",name,"cond",cond && cond.toJS && cond.toJS() || cond)
			if (this.evaluateBoolean(s,cond)){
				forbidden = name;
				return s.set("forbidden",name);
			}
			return s;
		},state,this);
	}
	if (forbidden){
		//console.log("There was sth forbidden",forbidden,"so we end up with",tree.set("forbidden",forbidden).toJS());
		return tree.set("forbidden",forbidden);
	} else {
		//console.log("There was nothing forbidden so we end up with",tree.setIn(["cache",id,"canendturnnow"],true).set("canreachendturn",true).toJS());
		return tree.setIn(["cache",id,"canendturnnow"],true).set("canreachendturn",true);
	}
};

Algol.newTurnTree = function(oldtree,id,newturnplayer){
	var state = oldtree.getIn(["cache",id]),
		startturn = oldtree.getIn(["gamedef","startturn"])||I.Map(),
		newturnnumber = (state.get("turn")||0)+1,
		//effect = startturn.get("applyeffect"),
		baselayer = state.getIn(["baselayers",newturnplayer])||state.getIn(["baselayers",newturnplayer+""]);
	// set basics
	state = state.delete("undobeforefirstauto").delete("previousstep").delete("canreachendturn").delete("canendturnnow").delete("forbidden").delete("undo").merge(I.fromJS({
		player: newturnplayer,
		turn: newturnnumber,
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
		nodeadends: false,
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
	var newtree = oldtree
		.set("cache",I.Map().set("root",state))
		.set("current","root")
		.delete("canreachendturn")
		.set("player",newturnplayer)
		.set("turn",(state.get("turn")||0)+1);
	// commands
	//console.log("So here is newtree before obeyintructions",newtree.toJS());
	newtree = this.obeyInstructions(newtree,"root",startturn,"startturn");
	//newtree = this.pruneOptions(newtree,state.get("id"));
	//console.log("And here is new tree afterwards",newtree.toJS());
	return newtree;
};

// called in newGame, makeMark, makeCommand
Algol.pruneOptions = function(tree,id){
	//return tree;
	//console.log("Pruning",tree.toJS(),"id",id);
	var statetocheck = tree.getIn(["cache",id]),
		wasat = tree.get("current"),
		gamedef = tree.get("gamedef"),
		commands = gamedef.get("commands"),
		marks = gamedef.get("marks");
	// maybe this state has already been pruned?
	if (!statetocheck){
		console.log("Prune alarm! id",id,"in tree",tree.toJS());
	}
	if (statetocheck.get("pruned") || statetocheck.get("nodeadends") || tree.getIn(["gamedef","nodeadends"])){
		return tree;
	}
	// lets go through the available commands
	tree = statetocheck.get("availableCommands").reduce(function(t,newid,cmnd){
		// this command always lead to end
		if (commands.getIn([cmnd,"nodeadends"])){
			return t;
		}
		// lets try if this command can lead to turnend
		t = this.makeCommand(t,id,cmnd,true);
		t = this.checkEndReach(t,newid);
		if (t.getIn(["cache",newid,"canreachendturn"])){
			// this command leads to end!
			return t;
		} else {
			// this command didn't so lets get rid of it
			return t.deleteIn(["cache",id,"availableCommands",cmnd]).deleteIn(["cache",newid]);
		}
	},tree,this);
	// now lets go through the marks too
	tree = statetocheck.get("availableMarks").reduce(function(t,markname,pos){
		// this mark always lead to end
		if (marks.getIn([markname,"nodeadends"])){
			return t;
		}
		// lets try if this mark can lead to turnend
		t = this.makeMark(t,id,markname,pos,true);
		t = this.checkEndReach(t,t.get("current"));
		if (t.getIn(["cache",t.get("current"),"canreachendturn"])){
			// this mark leads to end!
			return t;
		} else {
			// this mark didn't so lets get rid of it, no need to leave it
			return t.deleteIn(["cache",id,"availableMarks",pos]).deleteIn(["cache",t.get("current")]);
		}
	},tree,this);
	// return tree, restoring current to correct position
	return tree.set("current",wasat);
}

// called in endTurn, 
Algol.checkEndReach = function(tree,id){
	//console.log("Checking endreach turn",tree.get("turn"),"player",tree.get("player"),"stepid",id);
	var statetocheck = tree.getIn(["cache",id]),
		wasat = tree.get("current"),
		gamedef = tree.get("gamedef"),
		commands = gamedef.get("commands"),
		marks = gamedef.get("marks");
	if (!statetocheck){
		console.log("State check alarm! id",id,"in tree",tree.toJS());
	}
	if (statetocheck.get("canendturnnow")){
		return tree.set("canreachendturn",true).setIn(["cache",id,"canreachendturn"],true);
	}
	if (statetocheck.get("nodeadends")){
		return tree.set("canreachendturn",true).setIn(["cache",id,"canreachendturn"],true);
	}
	// lets go through the available commands
	tree = statetocheck.get("availableCommands").reduce(function(t,newid,cmnd){
		// already found sth
		if (t.getIn(["cache",id,"canreachendturn"])){
			return t;
		}
		// this command always lead to end
		if (commands.getIn([cmnd,"nodeadends"])){
			return t.set("canreachendturn",true).setIn(["cache",id,"canreachendturn"],true);
		}
		// lets try if this command can lead to turnend
		t = this.makeCommand(t,id,cmnd,true);
		t = this.checkEndReach(t,newid);
		if (t.getIn(["cache",newid,"canreachendturn"])){
			// this command leads to end!
			return t.set("canreachendturn",true).setIn(["cache",id,"canreachendturn"],true);
		} else {
			// this command didn't so lets get rid of it, no need to leave it
			return t.deleteIn(["cache",id,"availableCommands",cmnd]).deleteIn(["cache",newid]);
		}
	},tree,this);
	// if still can't reach then lets go through the marks too
	if (!tree.getIn(["cache",id,"canreachendturn"])){
		tree = statetocheck.get("availableMarks").reduce(function(t,markname,pos){
			// already found sth
			if (t.getIn(["cache",id,"canreachendturn"])){
				return t;
			}
			// this mark always lead to end
			if (marks.getIn([markname,"nodeadends"])){
				//console.log("THIS MARK ALWAYS LEADS TO NED WOO!",markname)
				return t.set("canreachendturn",true).setIn(["cache",id,"canreachendturn"],true);
			}
			// lets try if this mark can lead to turnend
			t = this.makeMark(t,id,markname,pos,true);
			t = this.checkEndReach(t,t.get("current"));
			if (t.getIn(["cache",t.get("current"),"canreachendturn"])){
				// this mark leads to end!
				return t.set("canreachendturn",true).setIn(["cache",id,"canreachendturn"],true);
			} else {
				// this mark didn't so lets get rid of it, no need to leave it
				return t.deleteIn(["cache",id,"availableMarks",pos]).deleteIn(["cache",t.get("current")]);
			}
		},tree,this);
	}
	// return tree, restoring current to correct position
	return tree.set("current",wasat);
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
			battlevals: gamedef.get("battlevals") || I.Map()
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
	var starttree = I.fromJS({
		"gamedef": gamedef,
		"cache": {"start":startstate}
	});
	return this.newTurnTree(starttree,"start",1);
};


var allowmethods = {
	ifelse: function(tree,state,bool,allow1,allow2){
		return this.evaluateBoolean(state,bool) ? this.allow(tree,state.get("id"),allow1) : this.allow(tree,state.get("id"),allow2);
	},
	"if": function(tree,state,bool,allowdef){
		//console.log("IF ALLOW",bool.toJS(),this.evaluateBoolean(state,bool));
		return this.evaluateBoolean(state,bool) ? this.allow(tree,state.get("id"),allowdef) : tree;
	},
	auto: function(tree,state,cmnd){
		var id = state.get("id");
		cmnd = this.evaluateValue(state,cmnd);
		//console.log("Autodoing",cmnd,"for state",state.get("id"));
		if (!state.has("undobeforefirstauto")){
			tree = tree.setIn(["cache",id,"undobeforefirstauto"],state.get("undo"));
		}
		return this.allowCommand(tree,id,cmnd,true);
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

Algol.obeyInstructions = function(tree,id,instr,when){
	var debug = false; // when === "startturn" && tree.getIn(["cache",id,"turn"]) === 6; // tree.getIn(["cache",id,"turn"]) === 6;
	debug && console.log("Obeying instruction",tree.toJS(),"id",id,"instr",instr.toJS());
	if (instr.has("runGenerators")){
		debug && console.log("applying generator list",instr.get("runGenerators").toJS && instr.get("runGenerators").toJS()  )
		tree = tree.setIn(["cache",id],this.applyGeneratorList(tree.getIn(["cache",id]),instr.get("runGenerators"),when,debug));
		debug && console.log("after generator list",tree.getIn(["cache",id,"layers"]).toJS());
	}
	if (instr.has("allow")){
		tree = instr.get("allow").reduce(function(t,def){
			debug && console.log("before allowing",(def && def.toJS && def.toJS() || def),t.toJS());
			t = this.allow(t,id,def);
			debug && console.log("after allowing",t.toJS());
			return t;
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
