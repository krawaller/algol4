// manual node tests

var Algol = require("../src/"),
	amazons = require("../games/amazons.json"),
	archers = require("../games/archers.json"),
	daggers = require("../games/daggers.json"),
	_ = require('lodash');

Algol.validate_game(Algol.reporter("amazons"),{},amazons);
Algol.validate_game(Algol.reporter("archers"),{},archers);
Algol.validate_game(Algol.reporter("daggers"),{},daggers);

//console.log(require('prettyjson').render(Algol.defaultifyGame(archers)));

var game = Algol.defaultifyGame(archers),
	analysis = Algol.analyze_game(game),
	comp = Algol.compileContext({
		def: game,
		A: analysis,
		save: {
			setup: "standard",
			board: "standard"
		}
	});

console.log(require('prettyjson').render(comp.compdefs[2]));

/*var a = Algol.analyze_game(archers);
_.each(a,function(o,kind){
	console.log("-------",kind,"--------");
	_.each(o,function(val,key){
		console.log(key,val);
	});
});
*/