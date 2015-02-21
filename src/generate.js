(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithGenerateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ G E N E R A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

Algol.generateNexttoSeedsFromPos = function(state,def,pos){

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