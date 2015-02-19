(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("immutable") : window.Immutable);
function augmentWithExecuteFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E X E C U T E  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

var effectmethods = {
	KILLUNIT: function(state,id){ return state.setIn(["data","units",this.evaluateId(state,id),"state"],"dead"); },
	MOVEUNIT: function(state,id,pos){ return state.setIn(["data","units",this.evaluateId(state,pos),"pos"],this.evaluatePosition(state,pos)); },
	SETUNITDATA: function(state,id,prop,val){ return state.setIn(["data","units",this.evaluateId(state,id),prop],"dead"); },
	SWAPUNITPOSITIONS: function(state,id1,id2){
		id1 = this.evaluateId(state,id1);
		id2 = this.evaluateId(state,id2);
		var temp = state.getIn(["data","units",id1,"pos"]);
		state = setIn(["data","units",id1,"pos"],state.getIn(["data","units",id2,"pos"]));
		return state.setIn(["data","units",id2,"pos"],temp);
	},
	CREATETERRAIN: function(state,pos,props){
		pos = this.evaluatePosition(state,pos);
		return state.setIn(["data","terrain",pos,I.fromJS(props).set("pos",pos)]);
	},
	FORALLIN: function(){
		var state = arguments[0], layer = state.getIn(["layers",arguments[1]]), effects = _.tail(arguments,2), returnstate = state;
		state.getIn(["data","units"]).forEach(function(unit,id){
			if (layer.has(unit.get("pos"))){
				_.each(effects,function(e){
					returnstate = this.executeEffect(returnstate.setIn(["context","LOOPID",id]),e);
				},this);
			}
		},this);
		return returnstate;
	}
};

// returns an updated state
Algol.executeEffect = function(state,def){
	return effectmethods[def[0]].apply(this,[state].concat(_.tail(def)));
};

// returns an updated state
Algol.executeEffects = function(state,arr){
	_.each(arr,function(e){
		state = this.executeEffect(state,e);
	},this);
	return state;
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithExecuteFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithExecuteFunctions;
else
    window.augmentWithExecuteFunctions = augmentWithExecuteFunctions;

})();