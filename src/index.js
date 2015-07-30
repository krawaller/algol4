
var Algol = {};
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
	require("./evaluate")(Algol);
	require("./generate")(Algol);
	require("./execute")(Algol);
	require("./prepare")(Algol);
	require("./mark")(Algol);
	require("./entitice")(Algol);
	module.exports = Algol;
} else {
	window.augmentWithEvaluateFunctions(Algol);
	window.augmentWithGenerateFunctions(Algol);
	window.augmentWithExecuteFunctions(Algol);
	window.augmentWithPrepareFunctions(Algol);
	window.augmentWithMarkFunctions(Algol);
	window.augmentWithEntiticeFunctions(Algol);
}