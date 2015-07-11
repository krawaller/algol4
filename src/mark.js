(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithMarkFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ M A R K   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

Algol.isMarkAvailable = function(state,markname){
	if (state.getIn(["marks",markname])){
		return "alreadyset";
	}
}



// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithMarkFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithMarkFunctions;
} else {
    window.augmentWithMarkFunctions = augmentWithMarkFunctions;
}})();
