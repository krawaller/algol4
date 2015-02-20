(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithGenerateFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ G E N E R A T E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


/*
def has `layer` and `overlapping` and/or `matching`
returns the new layer
*/
Algol.generate_filter = function(state,def){
	var layer = state.getIn(["layers",def.layer]);
	if (def.overlapping){
		layer = layer.filter(I.keyInMap(state.getIn(["layers",def.overlapping])));
	}
	if (def.matching){
		layer = layer.map(function(list,pos){
			return list.filter(function(map){
				return this.evaluateObjectMatch(state,def,map);
			},this);
		},this).filter(I.notUndefined);
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