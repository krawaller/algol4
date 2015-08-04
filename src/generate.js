(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithGenerateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ G E N E R A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


// Called in Algol.applyGenerator
Algol.generateNeighbourPods = function(state,def){
	var cond = def.get("condition");
	return this.evaluatePositionList(state,def.get("starts")).reduce(function(recorder,startpos){
		var neighbours = this.evaluateDirList(state.setIn(["context","start"],startpos),def.get("dirs")).reduce(function(map,dir){
			var targetpos = state.getIn(["connections",startpos,dir])||state.getIn(["connections",startpos,dir+""]);
			return targetpos && (!cond || this.evaluateBoolean(state.setIn(["context","target"],targetpos),cond)) ? map.set(dir,targetpos) : map;
		},I.Map(),this);
		return neighbours.reduce(function(recorder,pos,dir){
			return I.pushIn(recorder,["target",pos],I.Map({start:startpos,dir:dir,target:pos,neighbourcount:neighbours.size}));
		},I.pushIn(recorder,["start",startpos],I.Map({start:startpos,neighbourcount:neighbours.size})),this);
	},I.fromJS({start:{},target:{}}),this);
};

function stopreason(state,def,dir,pos,length,blocks,steps,prioblocks){
	if (def.get("max") && length === def.get("max")) {
		return "reachedmax";
	} else {
		var nextpos = (state.getIn(["connections",pos,dir])||state.getIn(["connections",pos,dir+""]));
		if (!nextpos){
			return "outofbounds";
		} else if (prioblocks && blocks && blocks.contains(nextpos)){
			return "hitblock";
		} else if (steps && !steps.contains(nextpos)){
			return "nomoresteps";
		} else if (blocks && blocks.contains(nextpos)){
			return "hitblock";
		}
	}
}

Algol.generateWalkerPodsInDir = function(startstate,def,recorder,startpos,dir){
	var pos=startpos, walk = [], reason, blockpos,
		blocks = def.has("blocks") && this.evaluatePositionList(startstate,def.get("blocks")),
		steps = def.has("steps") && this.evaluatePositionList(startstate,def.get("steps")),
		tobecounted = def.has("count") && this.evaluatePositionList(startstate,def.get("count")),
		prevcounttotal = 0, counttrack = [];
	while(!(reason=stopreason(startstate,def,dir,pos,walk.length,blocks,steps,def.get("prioritizeblocksoversteps")))){
		walk.push(pos = startstate.getIn(["connections",pos,dir])||startstate.getIn(["connections",pos,dir+""]));
		if (tobecounted){
			counttrack.push(prevcounttotal = (prevcounttotal + (tobecounted.contains(pos)?1:0)));
		}
	}
	var context = I.Map({start:startpos,dir:dir,linelength:walk.length,stopreason:reason});
	if (tobecounted){
		context = context.set("counttotal",prevcounttotal);
	}
	recorder = I.pushIn(recorder,["start",startpos],context);
	if (reason==="hitblock"){
		blockpos = startstate.getIn(["connections",pos,dir])||startstate.getIn(["connections",pos,dir+""]);
		recorder = I.pushIn(recorder,["block",blockpos],context.set("target",blockpos));
	}
	_.each(walk,function(step,n){
		var ctx = context.set("target",step).set("step",n+1).set("laststep",n+1===walk.length);
		if (tobecounted){
			ctx = ctx.set("countsofar",counttrack[n]);
		}
		recorder = I.pushIn(recorder,["steps",step],ctx);
	});
	return recorder;
};

Algol.generateWalkerPodsFromStart = function(state,def,recorder,startpos){
	var startstate = state.setIn(["context","start"],startpos);
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
		},state.setIn(["context","start"],pos),this);
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
	return I.Map({start: seeds.map(function(val,p){ return I.List([context.set("start",p)]); }) }); */
};

// Painter has tolayer and can have condition, include
// Pod is map with positions, each have list of contexts
// returns state with painted stuff woo
Algol.paintSeedPod = function(state,painter,pod){
	return pod.reduce(function(state,seeds,pos){
		var currentplr = state.getIn(["context","currentplayer"])
		return seeds.reduce(function(state,seed){
			state = state.mergeIn(["context"],seed);
			if (!painter.has("condition")||this.evaluateBoolean(state,painter.get("condition"))){
				var targetlayer = this.evaluateValue(state,painter.get("tolayer"));
				var entity = (painter.get("include")||I.Map()).map(function(def){
					return this.evaluateValue(state,def);
				},this);
				state = state.set("layers", entity.has("owner")
					? this.sortEntity(state.get("layers"),entity.set("pos",pos),[targetlayer],currentplr)
					: I.pushIn(state.get("layers"),[targetlayer,pos],entity));
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