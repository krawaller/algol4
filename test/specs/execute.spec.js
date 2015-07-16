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

tester("The execute methods",Algol,{
	"calculateStepData(state,stepdata)": {
		"a normal call": {
			state: {marks: {mark1:"foo",mark2:"bar"}},
			stepdata: {name:"somecommand",neededmarks:["mark1"]},
			expected: {command:"somecommand",marks:{mark1:"foo"}}		
		}
	},
	"calculateCommandResult(state,newstate,commanddef)": {
		"when data matches two steps back": {
			state: {
				steps:[1,2],
				data:{a:1},
				previousstep:{
					steps:[1],
					data:{b:2},
					previousstep:{
						steps:[],
						data:{c:3}
					}
				}
			},
			newstate: {data:{c:3}},
			expected: ["backto",{
				steps:[],
				data:{c:3}
			}]
		},
		"when newstate matches one step back": {
			state: {
				steps:[1,2],
				data:{a:1},
				previousstep:{
					steps:[1],
					data:{b:2},
					previousstep:{
						steps:[],
						data:{c:3}
					}
				}
			},
			newstate: {data:{b:2}},
			expected: ["backto",{
				steps:[1],
				data:{b:2},
				previousstep:{
					steps:[],
					data:{c:3}
				}
			}]
		},
		"when newstate means new step": {
			state: {
				marks:{mark1:"foo",mark2:"bar"},
				steps:[1,2],
				data:{a:1},
				previousstep:{
					steps:[1],
					data:{b:2},
					previousstep:{
						steps:[],
						data:{c:3}
					}
				},
				context:{performedsteps:4}
			},
			newstate: {data:{c:666},steps:["foo"]},
			commanddef: {name:"somecommand",neededmarks:["mark1"]},
			expected: ["newstep",{
				marks:"NEWMARKDATA",
				data:{c:666},
				steps:["foo","stepDATA"],
				previousstep: {
					marks:{mark1:"foo",mark2:"bar"},
					steps:[1,2],
					data:{a:1},
					previousstep:{
						steps:[1],
						data:{b:2},
						previousstep:{
							steps:[],
							data:{c:3}
						}
					},
					context:{performedsteps:4}
				},
				context:{performedsteps:5}
			}],
			context: {
				updateMarksFromCommand: {
					returns: "NEWMARKDATA",
					expectedargs: [["state","commanddef"]]
				},
				calculateStepData: {
					returns: "stepDATA",
					expectedargs: [["state","commanddef"]]
				}
			}
		}
	},
	"canExecuteCommand(state,commanddef)": {
		"when condition is true and no needed marks": {
			commanddef: {condition:["true"],neededmarks:[]},
			expected: true
		},
		"when condition is false": {
			commanddef: {condition:["false"],neededmarks:[]},
			expected: false
		},
		"when condition is true and needed marks are set": {
			state: {marks:{somemark:"xyz"}},
			commanddef: {condition:["true"],neededmarks:["somemark"]},
			expected: true
		},
		"when condition is true but needed marks aren't set": {
			state: {marks:{someothermark:"xyz"}},
			commanddef: {condition:["true"],neededmarks:["somemark"]},
			expected: false
		}
	},
	"newTurnState(state,nextplayer)": {
		"when there is a save array in state": {
			state: {
				steps: ["foo","bar"],
				save: ["FOO"],
				marks: "FOO",
				turn: 666,
				context: "FOO",
				player: 333
			},
			nextplayer: 777,
			expected: {
				steps: [],
				save: ["FOO",[333,"foo","bar"]],
				previousstep: {
					player: 333,
					steps: ["foo","bar"],
					save: ["FOO"],
					marks: "FOO",
					turn: 666,
					context: "FOO"
				},
				previousturn: {
					player: 333,
					steps: ["foo","bar"],
					save: ["FOO"],
					marks: "FOO",
					turn: 666,
					context: "FOO"
				},
				marks: {},
				turn: 667,
				player: 777,
				context: {currentplayer:777,performedsteps:0},
				affected: [],
				status: "ongoing"
			}
		},
		"when there isn't a save array (first turn)": {
			state: {
				steps: ["foo","bar"],
				marks: "FOO",
				turn: 666,
				context: "FOO",
				player: 333
			},
			nextplayer: 777,
			expected: {
				steps: [],
				save: [],
				previousstep: {
					player: 333,
					steps: ["foo","bar"],
					marks: "FOO",
					turn: 666,
					context: "FOO"
				},
				previousturn: {
					player: 333,
					steps: ["foo","bar"],
					marks: "FOO",
					turn: 666,
					context: "FOO"
				},
				marks: {},
				turn: 667,
				player: 777,
				context: {currentplayer:777,performedsteps:0},
				affected: [],
				status: "ongoing"
			}
		}
	},
	"endTurnOption(state,endturndef)": {
		"when second wincondition is met": {
			state: "STATE",
			endturndef: {
				endgame:{
					byfoo:{condition:"FOOCOND",winner:"FOOWINNER"},
					bybar:{condition:"BARCOND",winner:"BARWINNER"}
				}
			},
			expected: ["endgame","bybar","WINNER"],
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
		},
		"when first wincondition is met": {
			state: "STATE",
			endturndef: {
				endgame:{
					byfoo:{condition:"FOOCOND",winner:"FOOWINNER"},
					bybar:{condition:"BARCOND",winner:"BARWINNER"}
				}
			},
			expected: ["endgame","byfoo","WINNER"],
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
		},
		"when no wincondition is met": {
			state: "STATE",
			endturndef: {
				passto:"NEXTowner",
				endgame:{
					byfoo:{condition:"FOOCOND",winner:"FOOWINNER"},
					bybar:{condition:"BARCOND",winner:"BARWINNER"}
				}
			},
			expected: ["passto","NEXT"],
			context: {
				evaluateBoolean: {
					returns: false,
					expectedargs: [ ["state","FOOCOND"], ["state","BARCOND"] ]
				},
				evaluateValue: {
					returns: "NEXT",
					expectedargs: [ ["state","NEXTowner"] ]
				}
			}
		}
	},
	"hydrateStateAfterCommand(state)": {
		"when cannot end turn": {
			state: {
				gamedef:{
					hydration:"LIIisT",
					endturn:{condition:"COND"}
				}
			},
			aftereval: {
				gamedef:{
					hydration:"LIIisT",
					endturn:{condition:"COND"}
				},
				canendturn:false
			},
			expected: {
				gamedef:{
					hydration:"LIIisT",
					endturn:{condition:"COND"}
				},
				canendturn:false,
				commands:"COMOPTS"
			},
			context: {
				evaluateBoolean: {
					returns: false,
					expectedargs: [ ["state","COND"] ]
				},
				applyGeneratorList: {
					method: function(s){ return s; },
					expectedargs: [ ["state","LIIisT"] ]
				},
				listCommandOptions: {
					returns: "COMOPTS",
					expectedargs: [ ["aftereval",{hydration:"LIIisT",endturn:{condition:"COND"}}] ]
				}
			}
		},
		"when can end turn": {
			state: {
				gamedef:{
					hydration: "LisT",
					endturn: {condition:"COND",hydration:"LisT2"}
				}
			},
			aftereval: {
				gamedef:{
					hydration: "LisT",
					endturn: {condition:"COND",hydration:"LisT2"}
				},
				canendturn:true
			},
			expected: {
				gamedef:{
					hydration:"LisT",
					endturn:{condition:"COND",hydration:"LisT2"}
				},
				canendturn:true,
				commands:"COMOPTS"
			},
			context: {
				evaluateBoolean: {
					returns: true,
					expectedargs: [ ["state","COND"] ]
				},
				applyGeneratorList: {
					method: function(s){ return s; },
					expectedargs: [ ["state","LisT"],["aftereval","LisT2"] ]
				},
				listCommandOptions: {
					returns: "COMOPTS",
					expectedargs: [ ["aftereval",{hydration:"LisT",endturn:{condition:"COND",hydration:"LisT2"}}] ]
				}
			}
		}
	},
	"performOption(state,optiondef)": {
		"when option is backto": {
			state: {foo:"bar"},
			optiondef: ["backto",{foo:"baz"}],
			expected: {foo:"baz"}
		},
		"when option is passto": {
			state: {
				turn: 6,
				foo: "bar",
				save: [["BLAH"]],
				steps: ["1st","2nd"]
			},
			optiondef: ["passto",3],
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
		},
		"when option is endgame": {
			state: {foo:"bar"},
			optiondef: ["endgame","somecond",2],
			expected: {foo:"bar",status:"somecond", player:2}
		},
		"when option is newstep": {
			state: {foo:"bar"},
			optiondef: ["newstep",{some:"other"}],
			expected: "HYDRATEDSTATE",
			context: {
				hydrateStateAfterCommand: {
					returns: "HYDRATEDSTATE",
					expectedargs: [ [{some:"other"}] ]
				}
			}
		}
	},
	"listCommandOptions(state,gamedef)": {
		"when no commands": {
			state: {canendturn:true},
			gamedef: {commands:{},endturn:"endturn"},
			expected: {endturn:"endturnOPTION"},
			context: {
				endTurnOption: {
					returns: "endturnOPTION",
					expectedargs: [ ["state","endturn"] ]
				}
			}
		},
		"when commands but commandcap and can end turn": {
			state: {canendturn:true},
			gamedef: {
				commands:{
					mope:{name:"mope",effect:"mopify"}
				},
				endturn:{commandcap:true}
			},
			expected: {endturn:"endturnOPTION"},
			context: {
				endTurnOption: {
					returns: "endturnOPTION",
					expectedargs: [ ["state",{commandcap:true}] ]
				}
			}
		},
		"when no commands but a previous step": {
			state: {previousstep:"BLAH"},
			gamedef: {commands:{}},
			expected: {undo:["backto","BLAH"]}
		},
		"when an available command and nothing else": {
			state: {},
			gamedef: {
				commands:{
					mope:{name:"mope",effect:"mopify"},
					dope:{name:"dope",effect:"dopify"}
				}
			},
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
		},
		"when everything available": {
			state: {previousstep:"PREV",canendturn:true},
			gamedef: {
				commands:{
					mope:{name:"mope",effect:"mopify"},
					dope:{name:"dope",effect:"dopify"}
				},
				endturn:{}
			},
			context: {
				canExecuteCommand: { returns: true },
				applyEffect: { returns: "EFFECT" },
				calculateCommandResult: { returns: "RESULT" },
				endTurnOption: { returns: "endturnOPT" }
			},
			expected: {mope:"RESULT",dope:"RESULT",undo:["backto","PREV"],endturn:"endturnOPT"}
		}
	},
	"applyEffect(state,effect)": {
		"when using KILL": {
			state: {
				affected: [],
				turn: 4,
				data: {units: {"someid":{foo:"muu"}}},
				marks: {somemark:"xyz"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
			effect: ["killunit",["idofunitat",["markpos","somemark"]]],
			expected: {
				affected: ["someid"],
				turn: 4,
				data: {units: {"someid":{foo:"muu",status:"dead",affectedturn:4}}},
				marks: {somemark:"xyz"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			}
		},
		"when using moveunit": {
			state: {
				affected: [],
				turn: 5,
				data: {units: {"someid":{foo:"muu"}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
			effect: ["moveunit",["idofunitat",["markpos","somemark"]],["markpos","othermark"]],
			expected: {
				affected: ["someid"],
				turn: 5,
				data: {units: {"someid":{foo:"muu",pos:"abc",affectedturn:5}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
		},
		"when using turnunit clockwise": {
			state: {
				affected: [],
				turn: 5,
				data: {units: {"someid":{foo:"muu",dir:3}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
			effect: ["turnunit",["idofunitat",["markpos","somemark"]],["val",2]],
			expected: {
				affected: ["someid"],
				turn: 5,
				data: {units: {"someid":{foo:"muu",dir:5,affectedturn:5}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
		},
		"when using turnunit anticlockwise": {
			state: {
				affected: [],
				turn: 5,
				data: {units: {"someid":{foo:"muu",dir:1}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
			effect: ["turnunit",["idofunitat",["markpos","somemark"]],["val",-3]],
			expected: {
				affected: ["someid"],
				turn: 5,
				data: {units: {"someid":{foo:"muu",dir:6,affectedturn:5}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
		},
		"when using turnunit clockwise with wrap": {
			state: {
				affected: [],
				turn: 5,
				data: {units: {"someid":{foo:"muu",dir:7}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
			effect: ["turnunit",["idofunitat",["markpos","somemark"]],["val",4]],
			expected: {
				affected: ["someid"],
				turn: 5,
				data: {units: {"someid":{foo:"muu",dir:3,affectedturn:5}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
		},
		"when using swapunitpositions": {
			state: {
				affected: ["blah"],
				turn: 6,
				data: {units: {"someid":{foo:"bar",pos:"xyz"},"otherid":{foo:"baz",pos:"abc"}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}], "abc":[{ID:"otherid"}]}}
			},
			effect: ["swapunitpositions",["idofunitat",["markpos","somemark"]],["idofunitat",["markpos","othermark"]]],
			expected: {
				affected: ["blah","someid","otherid"],
				turn: 6,
				data: {units: {"someid":{foo:"bar",pos:"abc",affectedturn:6},
				otherid:{foo:"baz",pos:"xyz",affectedturn:6}}},
				marks: {somemark:"xyz",othermark:"abc"},
				layers: {"units": {"xyz": [{ID:"someid"}], "abc":[{ID:"otherid"}]}}
			}
		},
		"when using setunitdata": {
			state: {
				affected: [],
				turn: 7,
				data: {units: {"someid":{blah:"notmoo"}}},
				marks: {somemark:"xyz"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
			effect: ["setunitdata",["idofunitat",["markpos","somemark"]],"blah",["val","moo"]],
			expected: {
				affected: ["someid"],
				turn: 7,
				data: {units: {"someid":{blah:"moo",affectedturn:7}}},
				marks: {somemark:"xyz"},
				layers: {"units": {"xyz": [{ID:"someid"}]}}
			},
		},
		"when using forallin": {
			state: {
				turn: 8,
				layers:{
					somelayer:{a:"X"},
					units:{a:[{ID:"A"}],b:[{ID:"B"}]}
				},
				data:{
					units:{
						A:{pos:"a"},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"},
				affected:["B"]
			},
			effect: ["forallin",["layername","somelayer"],["setunitdata",["loopid"],"doomed",["val","yes"]]],
			expected: {
				turn: 8,
				layers:{
					somelayer:{a:"X"},
					units:{a:[{ID:"A"}],b:[{ID:"B"}]}
				},
				data:{
					units:{
						A:{pos:"a",doomed:"yes",affectedturn:8},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"},
				affected:["B","A"]}
		},
		"when using multieffect": {
			state: {
				turn: 9,
				marks:{somemark:"a"},
				layers:{units:{a:[{ID:"A"}],b:[{ID:"B"}]}},
				data:{
					units:{
						A:{pos:"a"},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"},
				affected:["B"]
			},
			effect: ["multieffect",[
				["setunitdata",["idofunitat",["markpos","somemark"]],"doomed",["val","yes"]],
				["killunit",["idofunitat",["markpos","somemark"]]]]
			],
			expected: {
				turn: 9,
				marks:{somemark:"a"},
				layers:{units:{a:[{ID:"A"}],b:[{ID:"B"}]}},
				data:{
					units:{
						A:{pos:"a",doomed:"yes",status:"dead",affectedturn:9},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"},
				affected:["B","A"]
			}
		}
	},
	"updateMarksFromCommand(state,commanddef)": {}
},I);



