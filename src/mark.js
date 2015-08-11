(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithMarkFunctions(Algol){


/* €€€€€€€€€€€€€€€€€€€€€€€€€€€ M A R K   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

Expects state.marks to be a map of currently set marks
Expects state.gamedef.marks to contain mark definitions
Expects state.layers to be layermap

markdef: {
	fromlayer: name of layer which we can select positions from
	condition: optional condition that must be true for mark to be available
	requiredmarks: optional list of other marks that must be set
	requiredby: other marks requiring this one                      TODO: autogenerate
	notwith: marks that cannot be set at the same time as this one
	generators: optional list of generators to be run when mark is set
	cleanse: optional list of layers to be cleansed when mark deset    TODO: autogenerate
}

*/


/*
Used in app
Returns object like: {
	pos: [setmark,markname,pos],
	pos: [removemark,markname], 
	...
}
*/
Algol.getAvailableMarks = function(state){
	return state.getIn(["gamedef","marks"]).reduce(function(mem,markdef,markname){
		return this.isMarkAvailable(state,markname) ? mem : this.evaluatePositionSet(state,markdef.get("from")).reduce(function(o,pos){
			return o.set(pos,I.List(["setmark",markname,pos]));
		},mem);
	},I.Map(),this);
};

Algol.getCurrentMarks = function(state){
	return state.get("marks").reduce(function(mem,pos,markname){
		return mem.set(pos,I.List(["removemark",markname]));
	},I.Map(),this);
};

/*
Used in Algol.getAvailableMarks
Returns error msg if unavailable, otherwise undefined
*/
Algol.isMarkAvailable = function(state,markname){
	var markdef = state.getIn(["gamedef","marks",markname]),
		cond = markdef.get("condition"),
		setmarks = state.get("marks"),
		//fromlayer = state.getIn(["layers",markdef.get("fromlayer")]),
		requiredmarks = markdef.get("requiredmarks"),
		notif = markdef.get("notifhasmark");
	if (setmarks.has(markname)){
		return "alreadyset";
	} else if (cond && !this.evaluateBoolean(state,cond)){
		return "conditionnotmet";
	//} else if (!fromlayer || !fromlayer.size){
	//	return "nopositions";
	} else if (requiredmarks && !requiredmarks.every(setmarks.has.bind(setmarks))){
		return "missingrequiredmarks";
	} else if (notif && notif.some(function(m){return state.hasIn(["marks",m]);})) {
		return "nonlikedmarkset";
	}
};

/*
User response, also used in Algol.setMark
Removes mark from state.mark
Removes position from state.marksat
Removes all marks in markdef.requiredby
Clears all layers in markdef.cleanse
*/
Algol.removeMark = function(state,markname){
	var def = state.getIn(["gamedef","marks",markname]);
	return (def.get("cleanse")||I.List()).reduce(function(mem,layername){
		return mem.removeIn(["layers",layername]);
	},(def.get("requiredby")||I.List()).reduce(function(mem,requiredby){
		return this.removeMark(mem,requiredby);
	},state.removeIn(["marksat",state.getIn(["marks",markname])]).removeIn(["marks",markname]),this),this);
};

/*
User response
Adds mark to state.marks
Adds position to state.marksat
Removes all marks in markdef.notwith using this.removeMark
Runs generator list in markdef.rungenerators with this.applyGeneratorList
*/
Algol.setMark = function(state,markname,position){
	var def = state.getIn(["gamedef","marks",markname]);
	return this.applyGeneratorList((def.get("notwith")||I.List()).reduce(function(mem,notwith){
		return this.removeMark(mem,notwith);
	},state.setIn(["marks",markname],position).setIn(["marksat",position],markname),this),def.get("rungenerators")||I.List());
};


/*
Called from calculateCommandResult
*/
Algol.newMarksAfterCommand = function(state,commanddef){
	return (commanddef.get("setmarks") || I.Map()).reduce(function(mem,pos,name){
		return mem.set(name,this.evaluatePosition(state,pos));
	},I.Map(),this);
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithMarkFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithMarkFunctions;
} else {
    window.augmentWithMarkFunctions = augmentWithMarkFunctions;
}})();
