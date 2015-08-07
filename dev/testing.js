var I = require("../src/immutableextensions"),
	Algol = require("../src/index"),
	archers = I.fromJS(require("../games/archers.json")),
	state = Algol.prepareNewGameState(archers,2);

console.log("--- STARTING GAME")
state = Algol.performOption(state,I.List(["passto",1]));
console.log("--- MARKING ARCHER")
state = Algol.performOption(state,state.getIn(["availableMarks",4004]));
console.log("--- MOVING FORWARD")
state = Algol.performOption(state,state.getIn(["availableCommands","stepforward"]));
console.log("--- TURNING LEFT")
state = Algol.performOption(state,state.getIn(["availableCommands","turnleft"]));
console.log("--- ENDING TURN",state.getIn(["availableCommands","endturn"]))
state = Algol.performOption(state,state.getIn(["availableCommands","endturn"]));

console.log("beforemark",state.getIn(["layers","units"]).keySeq());

console.log("*** MARKING ARCHER",state.getIn(["availableMarks"]).keySeq())
state = Algol.performOption(state,state.getIn(["availableMarks",6006]));

console.log("now i can",state.getIn(["availableCommands"]).keySeq())

console.log("SO",state.getIn(["canendturn"]));
console.log("SO",state.getIn(["layers"]).keySeq());

/*console.log("*** MOVING FORWARD",state.getIn(["availableCommands"]).keySeq())
state = Algol.performOption(state,state.getIn(["availableCommands","stepforward"]));
console.log("*** TURNING LEFT")
state = Algol.performOption(state,state.getIn(["availableCommands","turnleft"]));
console.log("*** ENDING TURN")
state = Algol.performOption(state,state.getIn(["availableCommands","endturn"]));*/


console.log("who am I?",state.get("player"));
console.log("my units", state.getIn(["layers","myunits"]).keySeq());
console.log("mytrees", state.getIn(["layers","mytrees"]).keySeq());

console.log("base",state.getIn(["baselayers"]).keySeq());