var I = require("../src/immutableextensions"),
	Algol = require("../src/index"),
	game = I.fromJS(require("../games/amazons.json")),
	state = Algol.prepareNewGameState(game,2);

//state = Algol.performOption(state,I.List(["passto",1]));

