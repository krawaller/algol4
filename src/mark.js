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

Algol.getAvailableMarks = function(state){
	return state.getIn(["gamedef","marks"]).reduce(function(mem,markdef,markname){
		return this.isMarkAvailable(state,markname) ? mem : mem.set(markname,state.getIn(["layers",markdef.get("fromlayer")]).keySeq());
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
		fromlayer = state.getIn(["layers",markdef.get("fromlayer")]),
		requiredmarks = markdef.get("requiredmarks");
	if (setmarks.has(markname)){
		return "alreadyset";
	} else if (cond && !this.evaluateBoolean(state,cond)){
		return "conditionnotmet";
	} else if (!fromlayer || !fromlayer.size){
		return "nopositions";
	} else if (requiredmarks && !requiredmarks.every(setmarks.has.bind(setmarks))){
		return "missingrequiredmarks";
	}
};

/*
User response, also used in Algol.setMark
Removes mark
Removes all marks in markdef.requiredby
Clears all layers in markdef.cleanse
*/
Algol.removeMark = function(state,markname){
	var def = state.getIn(["gamedef","marks",markname]);
	return (def.get("cleanse")||I.List()).reduce(function(mem,layername){
		return mem.removeIn(["layers",layername]);
	},(def.get("requiredby")||I.List()).reduce(function(mem,requiredby){
		return this.removeMark(mem,requiredby);
	},state.removeIn(["marks",markname]),this),this);
};

/*
User response
Updates the mark
Removes all marks in markdef.notwith using this.removeMark
Runs generator list in markdef.generators with this.applyGeneratorList
*/
Algol.setMark = function(state,markname,position){
	var def = state.getIn(["gamedef","marks",markname]);
	return this.applyGeneratorList((def.get("notwith")||I.List()).reduce(function(mem,notwith){
		return this.removeMark(mem,notwith);
	},state.setIn(["marks",markname],position),this),def.get("generators")||I.List());
};



// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithMarkFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithMarkFunctions;
} else {
    window.augmentWithMarkFunctions = augmentWithMarkFunctions;
}})();
