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
	if (!(state.getIn(["neighbours",pos,dir])||state.getIn(["neighbours",pos,dir+""]))){
		return "OUTOFBOUNDS";
	} else if (def.get("max") && length === def.get("max")) {
		return "REACHEDMAX";
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
			_.each(steps,function(step,n){
				recorder = recorder.set("step", I.addToList(recorder.get("step"),step,context.set("TARGET",step).set("STEP",n+1) ) );
			});
			return recorder;
		},recorder,this);
	},I.fromJS({start:{},step:{},block:{}}),this);
};

/*
def has `layer` and `overlapping` and/or `matching`
returns the new layer
*/
Algol.generateFilter = function(state,def){
	var layer = state.getIn(["layers",def.get("layer")]);
	if (def.get("overlapping")){
		layer = layer.filter(I.keyInMap(state.getIn(["layers",def.get("overlapping")])));
	}
	if (def.get("matching")){
		layer = layer.map(function(list,pos){
			return list.filter(function(map){
				return this.evaluateObjectMatch(state,def.get("matching"),map);
			},this);
		},this).filter(I.notEmpty);
	}
	return layer;
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithGenerateFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = augmentWithGenerateFunctions;
else
    window.augmentWithGenerateFunctions = augmentWithGenerateFunctions;

})();