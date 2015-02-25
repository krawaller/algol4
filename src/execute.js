(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithExecuteFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E X E C U T E  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

var effectmethods = {
	KILLUNIT: function(state,id){
		id = this.evaluateId(state,id);
		state = state.set("affected",I.addIfNew(state.get("affected"),id));
		return state.setIn(["data","units",id,"status"],"dead");
	},
	MOVEUNIT: function(state,id,pos){
		id = this.evaluateId(state,id);
		state = state.set("affected",I.addIfNew(state.get("affected"),id));
		return state.setIn(["data","units",id,"pos"],this.evaluatePosition(state,pos));
	},
	SETUNITDATA: function(state,id,propname,val){
		id = this.evaluateId(state,id);
		state = state.set("affected",I.addIfNew(state.get("affected"),id));
		return state.setIn(["data","units",id,propname],this.evaluateValue(state,val));
	},
	SWAPUNITPOSITIONS: function(state,id1,id2){
		id1 = this.evaluateId(state,id1);
		id2 = this.evaluateId(state,id2);
		state = state.set("affected",I.addIfNew(state.get("affected"),id1));
		state = state.set("affected",I.addIfNew(state.get("affected"),id2));
		var temp = state.getIn(["data","units",id1,"pos"]);
		state = state.setIn(["data","units",id1,"pos"],state.getIn(["data","units",id2,"pos"]));
		return state.setIn(["data","units",id2,"pos"],temp);
	},
	CREATETERRAIN: function(state,pos,props){
		pos = this.evaluatePosition(state,pos);
		return state.setIn(["data","terrain",pos,I.fromJS(props).set("pos",pos)]);
	},
	FORALLIN: function(){
		var state = arguments[0], layer = state.getIn(["layers",arguments[1]]), effects = _.slice(arguments,2);
		return state.getIn(["data","units"]).reduce(function(state,unit,id){
			return layer.has(unit.get("pos")) ? this.performCommandEffects(state.setIn(["context","LOOPID"],id),effects) : state;
		},state,this)[state.hasIn(["context","LOOPID"])?"setIn":"deleteIn"](["context","LOOPID"],state.getIn(["context","LOOPID"]));
	}
};

// returns an updated state
Algol.performCommandEffect = function(state,def){
	return effectmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

Algol.performCommandEffects = function(state,arr){
	return _.reduce(arr,function(state,e){ return this.performCommandEffect(state,e); },state,this);
};

Algol.canExecuteCommand = function(state,def){
	return !(
		(def.has("condition") && !this.evaluateBoolean(state,def.get("condition"))) || 
		def.has("neededmarks") && def.get("neededmarks").some(function(markname){ return !state.get("marks").has(markname); })
	);
};

Algol.testPostCommandState = function(state,newstate){
	var newdata = newstate.get("data");
	while(state.get("steps").size){
		state = state.get("previousstep");
		if (I.is(state.get("data"),newdata)){ return I.List(["BACK",newstate]); }
	}
	return I.List(["NEWSTATE",newstate]);
};

Algol.endTurnCheck = function(state,gamedef){
	return !this.evaluateBoolean(state,gamedef.getIn(["endturn","condition"])) ? false : gamedef.get("endgame").reduce(function(mem,end,name){
		return mem || this.evaluateBoolean(state,end.get("condition")) && ["ENDGAME",name,this.evaluateValue(state,end.get("winner"))];
	},undefined,this) || ["PASSTO",this.evaluateValue(state,gamedef.getIn(["endturn","passto"]))];
};

Algol.listCommandOptions = function(state,gamedef){
	return I.setIf(I.setIf(gamedef.get("commands").reduce(function(ret,comdef,comname){
		return this.canExecuteCommand(state,comdef) ? ret.set(comname,this.testPostCommandState(state,this.performCommandEffect(state,comdef.get("effect")))) : ret;
	},I.Map(),this),"ENDTURN",this.endTurnCheck(state,gamedef)),"UNDO",state.has("previousstep") ? ["BACK",state.get("previousstep")] : false) ;
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithExecuteFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithExecuteFunctions;
else
    window.augmentWithExecuteFunctions = augmentWithExecuteFunctions;

})();