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
Algol.applyEffect = function(state,def){
	return effectmethods[def.first()].apply(this,[state].concat(def.rest().toArray()));
};

Algol.performCommand = function(state,def){

};

Algol.canExecuteCommand = function(state,def){
	return !(
		(def.has("condition") && !this.evaluateBoolean(state,def.get("condition"))) || 
		def.has("neededmarks") && def.get("neededmarks").some(function(markname){ return !state.get("marks").has(markname); })
	);
};

Algol.calculateCommandResult = function(state,newstate,commanddef){
	var newdata = newstate.get("data"), comparetostate = state;
	while(comparetostate.get("steps").size){
		comparetostate = comparetostate.get("previousstep");
		if (I.is(comparetostate.get("data"),newdata)){ return I.List(["BACK",comparetostate]); }
	}
	return I.List(["NEWSTEP",I.pushIn(newstate,["steps"],I.fromJS({
		command: commanddef.get("name"),
		marks: commanddef.get("neededmarks").reduce(function(mem,mname){
			return mem.set(mname,state.getIn(["marks",mname]));
		},I.Map(),this)
	})).set("previousstep",state).set("marks",(commanddef.get("setmarks")||I.Map()).reduce(function(ret,pos,markname){
		return ret.set(markname,this.evaluateValue(state,pos));
	},I.Map(),this))]);
};

Algol.endTurnCheck = function(state,gamedef){
	return !this.evaluateBoolean(state,gamedef.getIn(["endturn","condition"])) ? false : gamedef.get("endgame").reduce(function(mem,end,name){
		return mem || this.evaluateBoolean(state,end.get("condition")) && ["ENDGAME",name,this.evaluateValue(state,end.get("winner"))];
	},undefined,this) || ["PASSTO",this.evaluateValue(state,gamedef.getIn(["endturn","passto"]))];
};

Algol.listCommandOptions = function(state,gamedef){
	return I.setIf(I.setIf(gamedef.get("commands").reduce(function(ret,comdef,comname){
		return this.canExecuteCommand(state,comdef) ? ret.set(comname,this.calculateCommandResult(state,this.applyEffect(state,comdef.get("effect")),comdef)) : ret;
	},I.Map(),this),"ENDTURN",this.endTurnCheck(state,gamedef)),"UNDO",state.has("previousstep") ? ["BACK",state.get("previousstep")] : false) ;
};


var optionmethods = {
	BACK: function(state,oldstate){ return oldstate; },
	NEWSTEP: function(state,oldstate){ return oldstate; },
	PASSTO: function(state,player){
		return state.merge(I.fromJS({
			steps: [],
			affected: [],
			marks: {},
			previousstep: state,
			previousturn: state,
			status: "ONGOING",
			player: player,
			turn: state.get("turn")+1,
			context: {CURRENTPLAYER:player}
		}));
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
