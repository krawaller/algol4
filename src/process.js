(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithProcessFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ P R O C E S S   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/



// def is game object, state has settings prop. 
Algol.populateGameWithSettings = function(state,def){
	return I.List.isList(def) && def.first() === "settings" ? state.getIn(["settings",def.get(1)])
	: def.map ? def.map(this.populateGameWithSettings.bind(this,state)) : def;
};




// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithProcessFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithProcessFunctions;
} else {
    window.augmentWithProcessFunctions = augmentWithProcessFunctions;
}})();