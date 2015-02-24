(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithGenerateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ G E N E R A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

Algol.generateNexttoSeeds = function(state,def){
	return this.evaluatePositionList(state,def.get("starts")).reduce(function(recorder,startpos){
		return this.evaluateDirList(state.setIn(["context","START"],startpos),def.get("dirs")).reduce(function(recorder,dir){
			var targetpos = state.getIn(["neighbours",startpos,dir])||state.getIn(["neighbours",startpos,dir+""]), context;
			if (targetpos){
				context = I.Map({START:startpos,TARGET:targetpos,DIR:dir});
				recorder = recorder.set("start", I.addToList(recorder.get("start"),startpos,context) );
				recorder = recorder.set("target", I.addToList(recorder.get("target"),targetpos,context) );
			}
			return recorder;
		},recorder,this);
	},I.fromJS({start:{},target:{}}),this);
};

function stopreason(state,def,dir,pos,length){
	var nextpos = (state.getIn(["neighbours",pos,dir])||state.getIn(["neighbours",pos,dir+""]));
	if (!nextpos){
		return "OUTOFBOUNDS";
	} else if (def.get("max") && length === def.get("max")) {
		return "REACHEDMAX";
	} else if (def.has("steplayer") && !state.getIn(["layers",def.get("steplayer"),nextpos]) ){
		return "NOMORESTEPS";
	} else if (def.has("blocklayer") && state.getIn(["layers",def.get("blocklayer"),nextpos]) ){
		return "HITBLOCK";
	}
}

Algol.generateWalkerSeeds = function(state,def){
	return this.evaluatePositionList(state,def.get("starts")).reduce(function(recorder,startpos){
		return this.evaluateDirList(state.setIn(["context","START"],startpos),def.get("dirs")).reduce(function(recorder,dir){
			var max = def.get("max")||666, length=0, pos=startpos, steps = [], reason;
			while(!(reason=stopreason(state,def,dir,pos,steps.length))){
				steps.push(pos = state.getIn(["neighbours",pos,dir])||state.getIn(["neighbours",pos,dir+""]));
			}
			var context = I.Map({START:startpos,DIR:dir,STEPS:steps.length,STOPREASON:reason});
			recorder = recorder.set("start", I.addToList(recorder.get("start"),startpos,context ) );
			if (reason==="HITBLOCK"){
				blockpos = state.getIn(["neighbours",pos,dir])||state.getIn(["neighbours",pos,dir+""]);
				recorder = recorder.set("block", I.addToList(recorder.get("block"),blockpos,context.set("TARGET",blockpos) ) );
			}
			_.each(steps,function(step,n){
				recorder = recorder.set("step", I.addToList(recorder.get("step"),step,context.set("TARGET",step).set("STEP",n+1) ) );
			});
			return recorder;
		},recorder,this);
	},I.fromJS({start:{},step:{},block:{}}),this);
};

Algol.generateFilterSeeds = function(state,def){
	var seeds = state.getIn(["layers",def.get("layer")]),
		overlapping = def.get("overlapping"),
		matching = def.get("matching");
	if (overlapping){
		var legal = this.evaluatePositionList(state,overlapping);
		seeds = seeds.filter(function(val,pos){ return legal.contains(pos); });
	}
	if (matching){
		seeds = seeds.filter(function(arr,pos){
			return arr.some(function(o){
				return this.evaluateObjectMatch(state,matching,o);
			},this);
		},this);
	}
	context = I.Map({TOTAL:seeds.size});
	return I.Map({start: seeds.map(function(val,p){ return I.List([context.set("START",p)]); }) });
};

Algol.paintSeedPod = function(state,painter,pod){
	return pod.reduce(function(state,seeds,pos){
		return seeds.reduce(function(state,seed){
			state = state.mergeIn(["context"],seed);
			if (!painter.has("condition")||this.evaluateBoolean(state,painter.get("condition"))){
				state = I.pushIn(state,["layers",this.evaluateValue(state,painter.get("tolayer")),pos],(painter.get("include")||I.Map()).map(function(def){
					return this.evaluateValue(state,def);
				},this));
			}
			return state;
		},state,this);
	},state,this).set("context",state.get("context"));
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithGenerateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithGenerateFunctions;
else
    window.augmentWithGenerateFunctions = augmentWithGenerateFunctions;

})();