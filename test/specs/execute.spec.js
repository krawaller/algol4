/* jshint jasmine: true */

var sinon,jasmineSinon,Algol,_,I,tester;
if (typeof require === 'function' && typeof module === 'object') {
	sinon = require('sinon');
	jasmineSinon = require('jasmine-sinon');
	Algol = require("../../src/");
	_ = require("../../src/lodashmixins");
	I = require("../../src/immutableextensions");
	tester = require("../tester");
} else {
	I = window.Immutable;
	_ = window._;
	sinon = window.sinon;
	tester = window.tester;
}

tester("execute",{
	applyEffect: [{
		state: {affected: [], turn: 4, data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["KILLUNIT",["IDAT",["MARKPOS","somemark"]]],
		expected: {affected: ["someid"], turn: 4, data: {units: {"someid":{foo:"muu",STATUS:"DEAD",AFFECTEDTURN:4}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["MOVEUNIT",["IDAT",["MARKPOS","somemark"]],["MARKPOS","othermark"]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",POS:"abc",AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu",DIR:3}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["TURNUNIT",["IDAT",["MARKPOS","somemark"]],["VAL",2]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",DIR:5,AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu",DIR:1}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["TURNUNIT",["IDAT",["MARKPOS","somemark"]],["VAL",-3]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",DIR:6,AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu",DIR:7}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["TURNUNIT",["IDAT",["MARKPOS","somemark"]],["VAL",4]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",DIR:3,AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: ["blah"], turn: 6, data: {units: {"someid":{foo:"bar",POS:"xyz"},"otherid":{foo:"baz",POS:"abc"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} },
		firstarg: ["SWAPUNITPOSITIONS",["IDAT",["MARKPOS","somemark"]],["IDAT",["MARKPOS","othermark"]]],
		expected: {affected: ["blah","someid","otherid"], turn: 6, data: {units: {"someid":{foo:"bar",POS:"abc",AFFECTEDTURN:6},otherid:{foo:"baz",POS:"xyz",AFFECTEDTURN:6}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} }
	},{
		state: {affected: [], turn: 7, data: {units: {"someid":{blah:"notmoo"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["SETUNITDATA",["IDAT",["MARKPOS","somemark"]],"blah",["VAL","moo"]],
		expected: {affected: ["someid"], turn: 7, data: {units: {"someid":{blah:"moo",AFFECTEDTURN:7}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {turn: 8, layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a"},B:{POS:"b"}}},context:{foo:"bar"},affected:["B"]},
		firstarg: ["FORALLIN","somelayer",["SETUNITDATA",["LOOPID"],"doomed",["VAL","yes"]]],
		expected: {turn: 8, layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a",doomed:"yes",AFFECTEDTURN:8},B:{POS:"b"}}},context:{foo:"bar"},affected:["B","A"]}
	},{
		state: {turn: 9, marks:{somemark:"a"},layers:{UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a"},B:{POS:"b"}}},context:{foo:"bar"},affected:["B"]},
		firstarg: ["MULTIEFFECT",[["SETUNITDATA",["IDAT",["MARKPOS","somemark"]],"doomed",["VAL","yes"]],["KILLUNIT",["IDAT",["MARKPOS","somemark"]]]]],
		expected: {turn: 9, marks:{somemark:"a"},layers:{UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a",doomed:"yes",STATUS:"DEAD",AFFECTEDTURN:9},B:{POS:"b"}}},context:{foo:"bar"},affected:["B","A"]}
	}],
	canExecuteCommand: [{
		firstarg: {condition:["TRUE"],neededmarks:[]},
		expected: true
	},{
		firstarg: {condition:["FALSE"],neededmarks:[]},
		expected: false
	},{
		state: {marks:{somemark:"xyz"}},
		firstarg: {condition:["TRUE"],neededmarks:["somemark"]},
		expected: true
	},{
		state: {marks:{someothermark:"xyz"}},
		firstarg: {condition:["TRUE"],neededmarks:["somemark"]},
		expected: false
	}],
	calculateStepData: [{
		state: {marks: {mark1:"foo",mark2:"bar"}},
		firstarg: {name:"somecommand",neededmarks:["mark1"]},
		expected: {command:"somecommand",marks:{mark1:"foo"}}
	}],
	calculateCommandResult: [{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		firstarg: {data:{c:3}},
		expected: ["BACK",{steps:[],data:{c:3}}]
	},{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		firstarg: {data:{b:2}},
		expected: ["BACK",{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}]
	},{
		state: {marks:{mark1:"foo",mark2:"bar"},steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}},context:{PERFORMEDSTEPS:4}},
		firstarg: {data:{c:666},steps:["foo"]},
		secondarg: {name:"somecommand",neededmarks:["mark1"]},
		expected: ["NEWSTEP",{marks:"NEWMARKDATA",data:{c:666},steps:["foo","STEPDATA"],previousstep: {marks:{mark1:"foo",mark2:"bar"},steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}},context:{PERFORMEDSTEPS:4}},context:{PERFORMEDSTEPS:5} }],
		context: {
			updateMarksFromCommand: {
				returns: "NEWMARKDATA",
				expectedargs: [["state","secondarg"]]
			},
			calculateStepData: {
				returns: "STEPDATA",
				expectedargs: [["state","secondarg"]]
			}
		}
	}],
	endTurnOption: [{
		state: "STATE",
		firstarg: {endgame:{byfoo:{condition:"FOOCOND",winner:"FOOWINNER"},bybar:{condition:"BARCOND",winner:"BARWINNER"}}},
		expected: ["ENDGAME","bybar","WINNER"],
		context: {
			evaluateBoolean: {
				method: function(s,c){ return c==="BARCOND"; },
				expectedargs: [ ["state","FOOCOND"], ["state","BARCOND"] ]
			},
			evaluateValue: {
				returns: "WINNER",
				expectedargs: [ ["state","BARWINNER"] ]
			}
		}
	},{
		state: "STATE",
		firstarg: {endgame:{byfoo:{condition:"FOOCOND",winner:"FOOWINNER"},bybar:{condition:"BARCOND",winner:"BARWINNER"}}},
		expected: ["ENDGAME","byfoo","WINNER"],
		context: {
			evaluateBoolean: {
				returns: true,
				expectedargs: [ ["state","FOOCOND"] ]
			},
			evaluateValue: {
				returns: "WINNER",
				expectedargs: [ ["state","FOOWINNER"] ]
			}
		}
	},{
		state: "STATE",
		firstarg: {passto:"NEXTPLR",endgame:{byfoo:{condition:"FOOCOND",winner:"FOOWINNER"},bybar:{condition:"BARCOND",winner:"BARWINNER"}}},
		expected: ["PASSTO","NEXT"],
		context: {
			evaluateBoolean: {
				returns: false,
				expectedargs: [ ["state","FOOCOND"], ["state","BARCOND"] ]
			},
			evaluateValue: {
				returns: "NEXT",
				expectedargs: [ ["state","NEXTPLR"] ]
			}
		}
	}],
	listCommandOptions: [{
		state: {canendturn:true},
		firstarg: {commands:{},endturn:"ENDTURN"},
		expected: {ENDTURN:"ENDTURNOPTION"},
		context: {
			endTurnOption: {
				returns: "ENDTURNOPTION",
				expectedargs: [ ["state","ENDTURN"] ]
			}
		}
	},{
		state: {canendturn:true},
		firstarg: {commands:{mope:{name:"mope",effect:"mopify"}},endturn:{commandcap:true}},
		expected: {ENDTURN:"ENDTURNOPTION"},
		context: {
			endTurnOption: {
				returns: "ENDTURNOPTION",
				expectedargs: [ ["state",{commandcap:true}] ]
			}
		}
	},{
		state: {previousstep:"BLAH"},
		firstarg: {commands:{}},
		expected: {UNDO:["BACK","BLAH"]}
	},{
		state: {},
		firstarg: {commands:{mope:{name:"mope",effect:"mopify"},dope:{name:"dope",effect:"dopify"}}},
		expected: {mope:"RESULT"},
		context: {
			canExecuteCommand: {
				method: function(s,c){ return c.get("name") === "mope"; },
				expectedargs: [ ["state",{name:"mope",effect:"mopify"}], ["state",{name:"dope",effect:"dopify"}] ]
			},
			applyEffect: {
				returns: "EFFECT",
				expectedargs: [ ["state","mopify"] ]
			},
			calculateCommandResult: {
				returns: "RESULT",
				expectedargs: [ ["state","EFFECT",{name:"mope",effect:"mopify"}] ]
			}
		}
	},{
		state: {previousstep:"PREV",canendturn:true},
		firstarg: {commands:{mope:{name:"mope",effect:"mopify"},dope:{name:"dope",effect:"dopify"}},endturn:{}},
		context: {
			canExecuteCommand: { returns: true },
			applyEffect: { returns: "EFFECT" },
			calculateCommandResult: { returns: "RESULT" },
			endTurnOption: { returns: "ENDTURNOPT" }
		},
		expected: {mope:"RESULT",dope:"RESULT",UNDO:["BACK","PREV"],ENDTURN:"ENDTURNOPT"}
	}],
	performOption: [{
		state: {foo:"bar"},
		firstarg: ["BACK",{foo:"baz"}],
		expected: {foo:"baz"}
	},{
		state: {turn: 6, foo: "bar", save: [["BLAH"]], steps: ["1st","2nd"]},
		firstarg: ["PASSTO",3],
		expected: "HYDRATED",
		context: {
			hydrateStateAfterCommand: {
				returns: "HYDRATED",
				expectedargs: [ ["NEWTURN"] ]
			},
			newTurnState: {
				returns: "NEWTURN",
				expectedargs: [ ["state",3] ]
			}
		}
	},{
		state: {foo:"bar"},
		firstarg: ["ENDGAME","somecond",2],
		expected: {foo:"bar",status:"somecond", player:2}
	},{
		state: {foo:"bar"},
		firstarg: ["NEWSTEP",{some:"other"}],
		expected: "HYDRATEDSTATE",
		context: {
			hydrateStateAfterCommand: {
				returns: "HYDRATEDSTATE",
				expectedargs: [ [{some:"other"}] ]
			}
		}
	}],
	hydrateStateAfterCommand: [{
		state: {gamedef:{hydration:"LIIIST",endturn:{condition:"COND"}}},
		aftereval: {gamedef:{hydration:"LIIIST",endturn:{condition:"COND"}},canendturn:false},
		expected: {gamedef:{hydration:"LIIIST",endturn:{condition:"COND"}},canendturn:false,commands:"COMOPTS"},
		context: {
			evaluateBoolean: {
				returns: false,
				expectedargs: [ ["state","COND"] ]
			},
			applyGeneratorList: {
				method: function(s){ return s; },
				expectedargs: [ ["state","LIIIST"] ]
			},
			listCommandOptions: {
				returns: "COMOPTS",
				expectedargs: [ ["aftereval",{hydration:"LIIIST",endturn:{condition:"COND"}}] ]
			}
		}
	},{
		state: {gamedef:{hydration:"LIST",endturn:{condition:"COND",hydration:"LIST2"}}},
		aftereval: {gamedef:{hydration:"LIST",endturn:{condition:"COND",hydration:"LIST2"}},canendturn:true},
		expected: {gamedef:{hydration:"LIST",endturn:{condition:"COND",hydration:"LIST2"}},canendturn:true,commands:"COMOPTS"},
		context: {
			evaluateBoolean: {
				returns: true,
				expectedargs: [ ["state","COND"] ]
			},
			applyGeneratorList: {
				method: function(s){ return s; },
				expectedargs: [ ["state","LIST"],["aftereval","LIST2"] ]
			},
			listCommandOptions: {
				returns: "COMOPTS",
				expectedargs: [ ["aftereval",{hydration:"LIST",endturn:{condition:"COND",hydration:"LIST2"}}] ]
			}
		}
	}],
	updateMarksFromCommand: [],
	newTurnState: [{
		state: {
			steps: ["foo","bar"],
			save: ["FOO"],
			marks: "FOO",
			turn: 666,
			context: "FOO",
			player: 333
		},
		firstarg: 777,
		expected: {
			steps: [],
			save: ["FOO",[333,"foo","bar"]],
			previousstep: { player: 333, steps: ["foo","bar"],save: ["FOO"],marks: "FOO",turn: 666,context: "FOO"},
			previousturn: { player: 333, steps: ["foo","bar"],save: ["FOO"],marks: "FOO",turn: 666,context: "FOO"},
			marks: {},
			turn: 667,
			player: 777,
			context: {CURRENTPLAYER:777,PERFORMEDSTEPS:0},
			affected: [],
			status: "ONGOING"
		}
	},{
		state: {
			steps: ["foo","bar"],
			marks: "FOO",
			turn: 666,
			context: "FOO",
			player: 333
		},
		firstarg: 777,
		expected: {
			steps: [],
			save: [],
			previousstep: { player: 333, steps: ["foo","bar"],marks: "FOO",turn: 666,context: "FOO"},
			previousturn: { player: 333, steps: ["foo","bar"],marks: "FOO",turn: 666,context: "FOO"},
			marks: {},
			turn: 667,
			player: 777,
			context: {CURRENTPLAYER:777,PERFORMEDSTEPS:0},
			affected: [],
			status: "ONGOING"
		}
	}]
});


