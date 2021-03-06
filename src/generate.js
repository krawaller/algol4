(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithGenerateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ G E N E R A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


// Called in Algol.applyGenerator
Algol.generateOffsetPods = function(state,def){
	var cond = def.get("condition"),
		offsets = def.get("offsets"),
		board = state.getIn(["gamedef","board"]);
	var ret = this.evaluatePositionSet(state,def.get("starts")).reduce(function(recorder,startpos){
		var startstate = state.setIn(["context","start"],startpos),
			tobecounted = def.has("count") && this.evaluatePositionSet(startstate,def.get("count")),
			counttotal = 0;
		//console.log("From here");
		var targets = this.evaluateDirList(startstate,def.get("dirs")).reduce(function(map,dir){
			return offsets.reduce(function(map,offset){ // offset is [forward,right]
				var forward = offset.get(0),
					right = offset.get(1),
					newpos = this.offsetPosName(startpos,dir,offset.get(0),offset.get(1),board),
					counted = false;
				if (tobecounted && newpos && tobecounted.contains(newpos)){
					counted = true;
					counttotal++;
				}
				return newpos && (!cond || this.evaluateBoolean(startstate.setIn(["context","target"],newpos),cond)) ? map.set(newpos,I.fromJS({
					start:startpos,
					target:newpos,
					forward:forward,
					right:right,
					dir:dir,
					counted: counted
				})) : map;
			},map,this);
		},I.Map(),this);
		return targets.reduce(function(recorder,info,pos){
			return I.pushIn(recorder,["target",pos],info.set("offsetcount",targets.size).set("counttotal",counttotal));
		},I.pushIn(recorder,["start",startpos],I.Map({start:startpos,offsetcount:targets.size,counttotal:counttotal})),this);
	},I.fromJS({start:{},target:{}}),this);
	return ret;
}

// Called in Algol.applyGenerator
Algol.generateNeighbourPods = function(state,def){
	var cond = def.get("condition");
	var ret = this.evaluatePositionSet(state,def.get("starts")).reduce(function(recorder,startpos){
		var startstate = state.setIn(["context","start"],startpos),
			tobecounted = def.has("count") && this.evaluatePositionSet(startstate,def.get("count")),
			counttotal = 0;
		//console.log("From here");
		var neighbours = this.evaluateDirList(startstate,def.get("dirs")).reduce(function(map,dir){
			startstate = startstate.setIn(["context","dir"],dir);
			var targetpos = state.getIn(["connections",startpos,dir])||state.getIn(["connections",startpos,dir+""]);
			//console.log("neighbour",startpos,dir,targetpos, targetpos && this.evaluateBoolean(startstate.setIn(["context","target"],targetpos),cond));
			if (targetpos && (!cond || this.evaluateBoolean(startstate.setIn(["context","target"],targetpos),cond))){
				if (tobecounted && tobecounted.contains(targetpos)){
					counttotal++;
				}
				return map.set(dir,targetpos);
			} else {
				return map;
			}
			//return targetpos && (!cond || this.evaluateBoolean(startstate.setIn(["context","target"],targetpos),cond)) ? map.set(dir,targetpos) : map;
		},I.Map(),this);
		return neighbours.reduce(function(recorder,pos,dir){
			return I.pushIn(recorder,["target",pos],I.Map({start:startpos,dir:dir,target:pos,neighbourcount:neighbours.size,counttotal:counttotal}));
		},I.pushIn(recorder,["start",startpos],I.Map({start:startpos,neighbourcount:neighbours.size,counttotal:counttotal})),this);
	},I.fromJS({start:{},target:{}}),this);
	//console.log("NEI",def.toJS(),"ret",ret.toJS());
	return ret;
};

function stopreason(state,max,dir,pos,length,blocks,steps,prioblocks){
	if (max && length === max) {
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
	startstate = startstate.setIn(["context","dir"],dir).setIn(["context","start"],startpos);
	var pos=startpos, walk = [], reason, blockpos,
		blocks = def.has("blocks") && this.evaluatePositionSet(startstate,def.get("blocks")),
		steps = def.has("steps") && this.evaluatePositionSet(startstate,def.get("steps")),
		tobecounted = def.has("count") && this.evaluatePositionSet(startstate,def.get("count")),
		prevcounttotal = 0, counttrack = [],
		max = def.has("max") ? this.evaluateValue(startstate,def.get("max")) : undefined;
	startstate = startstate.setIn(["context","max"],max).setIn(["context","target"],startpos);
	if (def.get("startasstep")){
		walk.push(startpos);
		if (tobecounted){
			counttrack.push(prevcounttotal = (prevcounttotal + (tobecounted.contains(startpos)?1:0)));
		}
	}
	while(!(reason=stopreason(startstate,max,dir,pos,walk.length,blocks,steps,def.get("prioritizeblocksoversteps")))){
		walk.push(pos = startstate.getIn(["connections",pos,dir])||startstate.getIn(["connections",pos,dir+""]));
		if (tobecounted){
			counttrack.push(prevcounttotal = (prevcounttotal + (tobecounted.contains(pos)?1:0)));
		}
	}
	var context = I.Map({start:startpos,dir:dir,linelength:walk.length,stopreason:reason,max:max});
	if (tobecounted){
		context = context.set("counttotal",prevcounttotal);
	}
	if (reason==="hitblock"){
		blockpos = startstate.getIn(["connections",pos,dir])||startstate.getIn(["connections",pos,dir+""]);
		context = context.set("blockpos",blockpos);
		recorder = I.pushIn(recorder,["block",blockpos],context.set("target",blockpos));
	}
	recorder = I.pushIn(recorder,["start",startpos],context);
	_.each(walk,function(step,n){
		var ctx = context.set("target",step).set("step",n+1);
		if (tobecounted){
			ctx = ctx.set("countsofar",counttrack[n]);
		}
		if (n+1===walk.length){
			ctx = ctx.set("laststep",true);
			recorder = I.pushIn(recorder,["last",step],ctx);
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
	var pods = this.evaluatePositionSet(state,def.get("starts")).reduce(function(recorder,startpos){
		return this.generateWalkerPodsFromStart(state,def,recorder,startpos);
	},I.fromJS({}),this);
	return pods.set("all",_.reduce(["steps","block"],function(mem,type){
		return mem.mergeWith(I.concat,pods.get(type)||I.Map());
	},pods.get("start")||I.Map(),this));
};

Algol.applyFilter = function(state,def){
	var matching = def.get("matching"),
		tolayer = def.get("tolayer"),
		condition = def.get("condition"),
		filterlayer = this.evaluateValue(state,def.get("layer"));
	//console.log("applying filter to",filterlayer,(state.getIn(["layers",filterlayer])||I.Map()).toJS());
	return (state.getIn(["layers",filterlayer])||I.Map()).reduce(function(state,list,pos){
		//console.log("position",pos);
		return list.reduce(function(state,obj){
			return (!matching || this.evaluateObjectMatch(state,matching,obj)) && (!condition || this.evaluateBoolean(state,condition)) ? I.pushIn(state,["layers",this.evaluateValue(state,tolayer),pos],obj) : state;
		},state.setIn(["context","start"],pos),this);
	},state,this).set("context",state.get("context"));
};

Algol.applyGenerator = function(state,name){
	if (I.List.isList(name)){
		return this.applyGeneratorList(state,name);
	}
	if (!state.getIn(["gamedef","generators",name])){
		console.log("ALARM",name)
	}
	var def = state.getIn(["gamedef","generators",name]), type = def.get("type"), marklist = def.get("requiredmarks"), marks = state.get("marks"), pods;
	if (!marklist || marklist.every(function(mark){return marks.has(mark);})){
		if (type==="filter") {
			return this.applyFilter(state,def);
		} else {
			pods = this[{walker:"generateWalkerPods",nextto:"generateNeighbourPods",offset:"generateOffsetPods"}[type]](state,def);
			return this.paintSeedPods(state,def.get("draw"),pods);
		}
	} else {
		return state;
	}
};

Algol.applyGeneratorList = function(state,list,when,debug){
	debug && console.log("running generator list",list.toJS())
	return list.reduce(function(state,generatorname){
		debug && console.log("runnning generator",generatorname && generatorname.toJS && generatorname.toJS() || generatorname );
		if (I.List.isList(generatorname) && generatorname.first() === "if"){ // [if,cond,name]
			//console.log("Will we actually run",generatorname.get(2),"cond is",generatorname.get(1).toJS(),"evaluated to",this.evaluateBoolean(state,generatorname.get(1)));
			var bool = this.evaluateBoolean(state,generatorname.get(1));
			debug && console.log("Generator list IF",bool);
			return bool ? this.applyGenerator(state.setIn(["context","when"],when),generatorname.get(2)) : state;
		} else if (I.List.isList(generatorname) && generatorname.first() === "ifelse"){
			var name = this.evaluateBoolean(state,generatorname.get(1)) ? generatorname.get(2) : generatorname.get(3);
			return this.applyGenerator(state,name);
		} else {
			return this.applyGenerator(state,generatorname);
		}
	},state,this).deleteIn(["context","when"]);
};

Algol.generateFilterPods = function(state,def){
	/*var overlapping = def.get("overlapping"),
		matching = def.get("matching");
	return I.Map({start: state.getIn(["layers",def.get("layer")]) })*/
	
	/*var seeds = state.getIn(["layers",def.get("layer")]),
		overlapping = def.get("overlapping"),
		matching = def.get("matching");
	if (overlapping){
		var legal = this.evaluatePositionSet(state,overlapping);
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
	//console.log("painting seed pod",pod)
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
		return pods.get(name) ? this.paintSeedPod(state,painter,pods.get(name)) : state;
	},state,this);
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithGenerateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithGenerateFunctions;
} else {
    window.augmentWithGenerateFunctions = augmentWithGenerateFunctions;
}})();