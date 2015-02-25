(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithGenerateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ G E N E R A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

Algol.generateNeighbourPods = function(state,def){
	return this.evaluatePositionList(state,def.get("starts")).reduce(function(recorder,startpos){
		var neighbours = this.evaluateDirList(state.setIn(["context","START"],startpos),def.get("dirs")).reduce(function(map,dir){
			var targetpos = state.getIn(["neighbours",startpos,dir])||state.getIn(["neighbours",startpos,dir+""]);
			return targetpos ? map.set(dir,targetpos) : map;
		},I.Map(),this);
		return neighbours.reduce(function(recorder,pos,dir){
			return I.pushIn(recorder,["target",pos],I.Map({START:startpos,DIR:dir,TARGET:pos,NEIGHBOURS:neighbours.size}));
		},I.pushIn(recorder,["start",startpos],I.Map({START:startpos,NEIGHBOURS:neighbours.size})),this);
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

Algol.generateWalkerPods = function(state,def){
	var pods = this.evaluatePositionList(state,def.get("starts")).reduce(function(recorder,startpos){
		return this.evaluateDirList(state.setIn(["context","START"],startpos),def.get("dirs")).reduce(function(recorder,dir){
			var pos=startpos, steps = [], reason;
			while(!(reason=stopreason(state,def,dir,pos,steps.length))){
				steps.push(pos = state.getIn(["neighbours",pos,dir])||state.getIn(["neighbours",pos,dir+""]));
			}
			var context = I.Map({START:startpos,DIR:dir,STEPS:steps.length,STOPREASON:reason});
			recorder = I.pushIn(recorder,["start",startpos],context);
			if (reason==="HITBLOCK"){
				blockpos = state.getIn(["neighbours",pos,dir])||state.getIn(["neighbours",pos,dir+""]);
				recorder = I.pushIn(recorder,["block",blockpos],context.set("TARGET",blockpos));
			}
			_.each(steps,function(step,n){
				recorder = I.pushIn(recorder,["step",step],context.set("TARGET",step).set("STEP",n+1));
			});
			return recorder;
		},recorder,this);
	},I.fromJS({start:{},step:{},block:{}}),this);
	return pods.set("all",pods.reduce(function(mem,pod){ return mem.mergeWith(I.concat,pod); }),I.Map(),this);
};

Algol.generateFilterPods = function(state,def){
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

// Painter has tolayer and can have condition, include
// Pod is map with positions, each have list of contexts
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

// Draw is prop straight from generator definition
// Pods is with named pods, names corresponding to (some of) the painter names
Algol.paintSeedPods = function(state,draw,pods){
	return draw.reduce(function(state,painter,name){
		return pods.has(name) ? this.paintSeedPod(state,painter,pods.get(name)) : state;
	},state,this);
};

Algol.generateUnitLayers = function(state){
	return state.mergeIn(["layers"],state.getIn(["data","units"]).reduce(function(map,unit,id){
		var pos = unit.get("POS");
		return unit.get("STATUS") === "DEAD" ? I.pushIn(map,["DEADUNITS",pos],unit) : 
			I.pushIn(I.pushIn(map,[(unit.get("PLR") === state.get("player")?"MYUNITS":"OPPUNITS"),pos],unit),["UNITS",pos],unit);
	},I.fromJS({UNITS:{},DEADUNITS:{},MYUNITS:{},OPPUNITS:{}}),this));
};

Algol.generateInitialData = function(state,gamedef){
	return I.Map().set("units",gamedef.get("setup").reduce(function(map,unit,n){
		return map.set("unit"+(n+1),unit.set("id","unit"+(n+1)));
	},I.Map(),this));
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithGenerateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithGenerateFunctions;
else
    window.augmentWithGenerateFunctions = augmentWithGenerateFunctions;

})();