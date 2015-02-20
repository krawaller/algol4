
var Algol = {};
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
	require("./evaluate")(Algol);
	module.exports = Algol;
} else {
	window.augmentWithEvaluateFunctions(Algol);
}