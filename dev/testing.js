var I = require("../src/immutableextensions"),
	Algol = require("../src/index"),
	archers = I.fromJS(require("../games/archers.json")),
	state = Algol.prepareNewGameState(archers,2);

//state = Algol.performOption(state,I.List(["passto",1]));

console.log("--- TURN 1")
state = Algol.performOption(state,state.getIn(["availableMarks",4004]));
state = Algol.performOption(state,state.getIn(["availableCommands","stepforward"]));
state = Algol.performOption(state,state.getIn(["availableCommands","stepforward"]));
state = Algol.performOption(state,state.getIn(["availableCommands","endturn"]));

console.log("--- TURN 2")
state = Algol.performOption(state,state.getIn(["availableMarks",6006]));
state = Algol.performOption(state,state.getIn(["availableCommands","turnleft"]));
state = Algol.performOption(state,state.getIn(["availableCommands","stepforward"]));
state = Algol.performOption(state,state.getIn(["availableCommands","endturn"]));

console.log("--- TURN 3")
state = Algol.performOption(state,state.getIn(["availableMarks",2002]));
state = Algol.performOption(state,state.getIn(["availableCommands","turnleft"]));
state = Algol.performOption(state,state.getIn(["availableCommands","turnleft"]));
state = Algol.performOption(state,state.getIn(["availableCommands","endturn"]));

console.log("--- TURN 4")
state = Algol.performOption(state,state.getIn(["availableMarks",6005]));
state = Algol.performOption(state,state.getIn(["availableCommands","fire"]));


console.log(state.getIn(["layers"]).keySeq());