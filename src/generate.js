(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithGenerateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ G E N E R A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


// Called in Algol.applyGenerator
Algol.generateNeighbourPods = function(state,def){
	return this.evaluatePositionList(state,def.get("starts")).reduce(function(recorder,startpos){
		var neighbours = this.evaluateDirList(state.setIn(["context","START"],startpos),def.get("dirs")).reduce(function(map,dir){
			var targetpos = state.getIn(["connections",startpos,"nextto",dir])||state.getIn(["connections",startpos,"nextto",dir+""]);
			return targetpos ? map.set(dir,targetpos) : map;
		},I.Map(),this);
		return neighbours.reduce(function(recorder,pos,dir){
			return I.pushIn(recorder,["target",pos],I.Map({START:startpos,DIR:dir,TARGET:pos,NEIGHBOURS:neighbours.size}));
		},I.pushIn(recorder,["start",startpos],I.Map({START:startpos,NEIGHBOURS:neighbours.size})),this);
	},I.fromJS({start:{},target:{}}),this);
};

function stopreason(state,def,dir,pos,length,blocks,steps,prioblocks){
	var nextpos = (state.getIn(["connections",pos,"nextto",dir])||state.getIn(["connections",pos,"nextto",dir+""]));
	if (!nextpos){
		return "OUTOFBOUNDS";
	} else if (def.get("max") && length === def.get("max")) {
		return "REACHEDMAX";
	} else if (prioblocks && blocks && blocks.contains(nextpos)){
		return "HITBLOCK";
	} else if (steps && !steps.contains(nextpos)){
		return "NOMORESTEPS";
	} else if (blocks && blocks.contains(nextpos)){
		return "HITBLOCK";
	}
}

Algol.generateWalkerPodsInDir = function(startstate,def,recorder,startpos,dir){
	var pos=startpos, walk = [], reason, blockpos,
		blocks = def.has("blocks") && this.evaluatePositionList(startstate,def.get("blocks")),
		steps = def.has("steps") && this.evaluatePositionList(startstate,def.get("steps"));
	while(!(reason=stopreason(startstate,def,dir,pos,walk.length,blocks,steps,def.get("prioritizeblocksoversteps")))){
		walk.push(pos = startstate.getIn(["connections",pos,"nextto",dir])||startstate.getIn(["connections",pos,"nextto",dir+""]));
	}
	var context = I.Map({START:startpos,DIR:dir,STEPS:walk.length,STOPREASON:reason});
	recorder = I.pushIn(recorder,["start",startpos],context);
	if (reason==="HITBLOCK"){
		blockpos = startstate.getIn(["connections",pos,"nextto",dir])||startstate.getIn(["connections",pos,"nextto",dir+""]);
		recorder = I.pushIn(recorder,["block",blockpos],context.set("TARGET",blockpos));
	}
	_.each(walk,function(step,n){
		recorder = I.pushIn(recorder,["step",step],context.set("TARGET",step).set("STEP",n+1));
	});
	return recorder;
};

Algol.generateWalkerPodsFromStart = function(state,def,recorder,startpos){
	var startstate = state.setIn(["context","START"],startpos);
	return this.evaluateDirList(startstate,def.get("dirs")).reduce(function(recorder,dir){
		return this.generateWalkerPodsInDir(startstate,def,recorder,startpos,dir);
	},recorder,this);
};

Algol.generateWalkerPods = function(state,def){
	var pods = this.evaluatePositionList(state,def.get("starts")).reduce(function(recorder,startpos){
		return this.generateWalkerPodsFromStart(state,def,recorder,startpos);
	},I.fromJS({}),this);
	return pods.set("all",pods.reduce(function(mem,pod){ return mem.mergeWith(I.concat,pod); }),I.Map(),this);
};

Algol.applyFilter = function(state,def){
	var matching = def.get("matching"), tolayer = def.get("tolayer"), condition = def.get("condition");
	return state.getIn(["layers",def.get("layer")]).reduce(function(state,list,pos){
		return list.reduce(function(state,obj){
			return (!matching || this.evaluateObjectMatch(state,matching,obj)) && (!condition || this.evaluateBoolean(state,condition)) ? I.pushIn(state,["layers",this.evaluateValue(state,tolayer),pos],obj) : state;
		},state.setIn(["context","START"],pos),this);
	},state,this).set("context",state.get("context"));
};

Algol.applyGenerator = function(state,def){
	var type = def.get("type"), marklist = def.get("neededmarks"), marks = state.get("marks"), pods;
	if (!marklist || marklist.every(function(mark){return marks.has(mark);})){
		if (type==="filter") {
			return this.applyFilter(state,def);
		} else {
			pods = this[{walker:"generateWalkerPods",nextto:"generateNeighbourPods"}[type]](state,def);
			return this.paintSeedPods(state,def.get("draw"),pods);
		}
	} else {
		return state;
	}
};

Algol.applyGeneratorList = function(state,list){
	return list.reduce(function(state,generatorname){
		return this.applyGenerator(state,state.getIn(["gamedef","generators",generatorname]));
	},state,this);
};

Algol.generateFilterPods = function(state,def){
	/*var overlapping = def.get("overlapping"),
		matching = def.get("matching");
	return I.Map({start: state.getIn(["layers",def.get("layer")]) })*/
	
	/*var seeds = state.getIn(["layers",def.get("layer")]),
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
	return I.Map({start: seeds.map(function(val,p){ return I.List([context.set("START",p)]); }) }); */
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


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithGenerateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithGenerateFunctions;
} else {
    window.augmentWithGenerateFunctions = augmentWithGenerateFunctions;
}})();