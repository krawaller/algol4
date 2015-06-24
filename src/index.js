
var Algol = {};
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
	require("./evaluate")(Algol);
	require("./generate")(Algol);
	require("./execute")(Algol);
	require("./process")(Algol);
	require("./prepare")(Algol);
	module.exports = Algol;
} else {
	window.augmentWithEvaluateFunctions(Algol);
	window.augmentWithGenerateFunctions(Algol);
	window.augmentWithExecuteFunctions(Algol);
	window.augmentWithProcessFunctions(Algol);
	window.augmentWithPrepareFunctions(Algol);
}