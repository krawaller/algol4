var I = require("../src/immutableextensions"),
	Algol = require("../src/index"),
	archers = I.fromJS(require("../games/archers.json")),
	state = Algol.prepareNewGameState(archers,2);

console.log("--- STARTING GAME")
state = Algol.performOption(state,I.List(["passto",1]));
console.log("--- MARKING ARCHER")
state = Algol.performOption(state,I.List(["setmark","selectunit",4004]));
console.log("--- MOVING FORWARD")
state = Algol.performOption(state,state.getIn(["availableCommands","stepforward"]));
console.log("--- TURNING LEFT")
state = Algol.performOption(state,state.getIn(["availableCommands","turnleft"]));

console.log("MARKS",state.get("marks"))

console.log("what can I mark",state.get("availableMarks"));
console.log("and what can i do?",state.get("availableCommands").keySeq());