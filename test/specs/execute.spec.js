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
				previousstep:{
					steps:[1],
					previousstep:{
						last: "TRUE",
						steps:[]
					}
				}
			},
			newstate: "NEWSTATE",
			expected: ["backto",{last: "TRUE",steps:[]}],
			context: {
				areStatesEqual: {
					returnseries: [false,true],
					expectedargs: [[{
						steps:[1],
						previousstep:{
							last: "TRUE",
							steps:[]
						}
					},"NEWSTATE"],[{last: "TRUE",steps:[]},"NEWSTATE"]]
				}
			}
		},
		"when newstate means new step": {
			state: {
				marks:{mark1:"foo",mark2:"bar"},
				steps:[1,2],
				previousstep:{
					steps:[1],
					previousstep:{steps:[]}
				}
			},
			newstate: {data:{c:666},steps:["foo"]},
			commanddef: {name:"somecommand",neededmarks:["mark1"]},
			expected: ["newstep",{
				data:{c:666},
				steps:["foo","stepDATA"]
			},"NEWMARKDATA"],
			context: {
				newMarksAfterCommand: {
					returns: "NEWMARKDATA",
					expectedargs: [["@state","@commanddef"]]
				},
				calculateStepData: {
					returns: "stepDATA",
					expectedargs: [["@state","@commanddef"]]
				},
				areStatesEqual: {
					returns: false
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
	"endTurnOption(state,endturndef)": {
		"when second condition is met and result is win": {
			state: "STATE",
			endturndef: {
				endgame:{
					byfoo:{condition:"FOOCOND"},
					bybar:{condition:"BARCOND",result:"WHATHAPPENS"}
				}
			},
			expected: ["win","bybar"],
			context: {
				evaluateBoolean: {
					returnseries: [ false, true ],
					expectedargs: [ ["@state","FOOCOND"], ["@state","BARCOND"] ]
				},
				evaluateValue: {
					returns: "win",
					expectedargs: [ ["@state","WHATHAPPENS"] ]
				}
			}
		},
		"when first condition is met and result is loseto": {
			state: "STATE",
			endturndef: {
				endgame:{
					byfoo:{condition:"FOOCOND",result:"loseto",who:"theotherguy"},
					bybar:{condition:"BARCOND"}
				}
			},
			expected: ["loseto","byfoo","theotherguy"],
			context: {
				evaluateBoolean: {
					returns: true,
					expectedargs: [ ["@state","FOOCOND"] ]
				},
				evaluateValue: {
					returnsarg: 1,
					expectedargs: [ ["@state","loseto"], ["@state","theotherguy"] ]
				}
			}
		},
		"when first condition is met and result is draw": {
			state: "STATE",
			endturndef: {
				endgame:{
					byfoo:{condition:"FOOCOND",result:"draw"},
					bybar:{condition:"BARCOND"}
				}
			},
			expected: ["draw","byfoo"],
			context: {
				evaluateBoolean: {
					returns: true,
					expectedargs: [ ["@state","FOOCOND"] ]
				},
				evaluateValue: {
					returnsarg: 1,
					expectedargs: [ ["@state","draw"] ]
				}
			}
		},
		"when no wincondition is met": {
			state: {player:"plr1",passto:{plr1:"plr2"}},
			endturndef: {
				endgame:{
					byfoo:{condition:"FOOCOND"},
					bybar:{condition:"BARCOND"}
				}
			},
			expected: ["passto","plr2"],
			context: {
				evaluateBoolean: {
					returns: false,
					expectedargs: [ ["@state","FOOCOND"], ["@state","BARCOND"] ]
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
			state: "STATE",
			optiondef: ["passto","NEXTPLR"],
			context: {
				prepareNewTurnState: {
					returns: "NEWTURN",
					expectedargs: [["@state","NEXTPLR"]]
				},
				setOptions: {
					returns: "WITHOPTIONS",
					expectedargs: [["NEWTURN"]]
				}
			},
			expected: "WITHOPTIONS"
		},
		"when option is win": {
			state: {player:"me",availableCommands:"CMNDS",availableMarks:"MARKS"},
			optiondef: ["win","byfoo"],
			expected: {player:"me",endedby:"byfoo","winner":"me"}
		},
		"when option is draw": {
			state: {baz:"bin",availableCommands:"CMNDS",availableMarks:"MARKS"},
			optiondef: ["draw","byfoo"],
			expected: {baz:"bin",endedby:"byfoo","winner":0}
		},
		"when option is loseto": {
			state: {baz:"bin",availableCommands:"CMNDS",availableMarks:"MARKS"},
			optiondef: ["loseto","byfoo","sirpoo"],
			expected: {baz:"bin",endedby:"byfoo","winner":"sirpoo"}
		},
		"when option is newstep": {
			state: "STATE",
			optiondef: ["newstep","NEWSTATE","NEWMARKS"],
			context: {
				prepareNewStepState: {
					returns: "PREPPEDNEWSTATE",
					expectedargs: [["NEWSTATE","NEWMARKS"]]
				},
				setOptions: {
					returns: "WITHOPTIONS",
					expectedargs: [["PREPPEDNEWSTATE"]]
				}
			},
			expected: "WITHOPTIONS"
		},
		"when option is setmark": {
			state: "STATE",
			optiondef: ["setmark","NEWMARK","somepos"],
			context: {
				setMark: {
					returns: "WITHNEWMARK",
					expectedargs: [["@state","NEWMARK","somepos"]]
				},
				setOptions: {
					returns: "WITHOPTIONS",
					expectedargs: [["WITHNEWMARK"]]
				}
			},
			expected: "WITHOPTIONS"
		},
		"when option is removemark": {
			state: "STATE",
			optiondef: ["removemark","TOBEREMOVED"],
			context: {
				removeMark: {
					returns: "WITHOUTMARK",
					expectedargs: [["@state","TOBEREMOVED"]]
				},
				setOptions: {
					returns: "WITHOPTIONS",
					expectedargs: [["WITHOUTMARK"]]
				}
			},
			expected: "WITHOPTIONS"
		}
	},
	"getAvailableCommands(state,gamedef)": {
		"when no commands": {
			state: {canendturn:true},
			gamedef: {commands:{},endturn:"endturn"},
			expected: {endturn:"endturnOPTION"},
			context: {
				endTurnOption: {
					returns: "endturnOPTION",
					expectedargs: [ ["@state","endturn"] ]
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
					expectedargs: [ ["@state",{commandcap:true}] ]
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
					expectedargs: [ ["@state",{name:"mope",effect:"mopify"}], ["@state",{name:"dope",effect:"dopify"}] ]
				},
				applyEffect: {
					returns: "EFFECT",
					expectedargs: [ ["@state","mopify"] ]
				},
				calculateCommandResult: {
					returns: "RESULT",
					expectedargs: [ ["@state","EFFECT",{name:"mope",effect:"mopify"}] ]
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
				data: {units: {"someid":{foo:"muu"}}}
			},
			effect: ["killunit",["id","someid"]],
			expected: {
				data: {units: {"someid":{foo:"muu",dead:true}}}
			}
		},
		"when using moveunit": {
			state: {
				data: {units: {"someid":{foo:"muu"}}}
			},
			effect: ["moveunit",["id","someid"],["pos","xyz"]],
			expected: {
				data: {units: {"someid":{foo:"muu",pos:"xyz"}}}
			},
		},
		"when using turnunit clockwise": {
			state: {
				data: {units: {"someid":{foo:"muu",dir:3}}}
			},
			effect: ["turnunit",["id","someid"],["val",2]],
			expected: {
				data: {units: {"someid":{foo:"muu",dir:5}}}
			},
		},
		"when using turnunit anticlockwise": {
			state: {
				data: {units: {"someid":{foo:"muu",dir:1}}}
			},
			effect: ["turnunit",["id","someid"],["val",-3]],
			expected: {
				data: {units: {"someid":{foo:"muu",dir:6}}}
			},
		},
		"when using turnunit clockwise with wrap": {
			state: {
				data: {units: {"someid":{foo:"muu",dir:7}}}
			},
			effect: ["turnunit",["id","someid"],["val",4]],
			expected: {
				data: {units: {"someid":{foo:"muu",dir:3}}}
			},
		},
		"when using swapunitpositions": {
			state: {
				data: {units: {"someid":{foo:"bar",pos:"xyz"},otherid:{foo:"baz",pos:"abc"}}}
			},
			effect: ["swapunitpositions",["id","someid"],["id","otherid"]],
			expected: {
				data: {units: {"someid":{foo:"bar",pos:"abc"},otherid:{foo:"baz",pos:"xyz"}}}
			}
		},
		"when using setunitdata": {
			state: {
				data: {units: {"someid":{blah:"notmoo"}}}
			},
			effect: ["setunitdata",["id","someid"],"blah",["val","moo"]],
			expected: {
				data: {units: {"someid":{blah:"moo"}}}
			},
		},
		"when using forallin": {
			state: {
				layers:{
					somelayer:{a:"X"}
				},
				data:{
					units:{
						A:{pos:"a"},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"}
			},
			effect: ["forallin",["layername","somelayer"],["setunitdata",["loopid"],"doomed",["val","yes"]]],
			expected: {
				layers:{
					somelayer:{a:"X"}
				},
				data:{
					units:{
						A:{pos:"a",doomed:"yes"},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"}
			}
		},
		"when using multieffect": {
			state: {
				data:{
					units:{
						A:{pos:"a"},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"}
			},
			effect: ["multieffect",[
				["setunitdata",["id","A"],"doomed",["val","yes"]],
				["killunit",["id","A"]]
			]],
			expected: {
				data:{
					units:{
						A:{pos:"a",doomed:"yes",dead:true},
						B:{pos:"b"}
					}
				},
				context:{foo:"bar"}
			}
		},
		"when using setcontextval": {
			state: {
				context: {foo:"bar",bin:"baz"}
			},
			effect: ["setcontextval",["val","bin"],["val","boo"]],
			expected: {
				context: {foo:"bar",bin:"boo"}
			}
		},
		"when using addtocontextval on existing var": {
			state: {
				context: {foo:"bar",bin:4}
			},
			effect: ["addtocontextval",["val","bin"],3],
			expected: {
				context: {foo:"bar",bin:7}
			}
		},
		"when using addtocontextval on new var": {
			state: {
				context: {foo:"bar"}
			},
			effect: ["addtocontextval",["val","bin"],3],
			expected: {
				context: {foo:"bar",bin:3}
			}
		}
	},
	"setOptions(state)": {
		"for normal call": {
			state: {foo:"bar","gamedef":"GAMEDEF"},
			context: {
				getAvailableCommands: {
					returns: "COMMANDS",
					expectedargs: [["@state","GAMEDEF"]]
				},
				getAvailableMarks: {
					returns: "MARKS",
					expectedargs: [["@state"]]
				}
			},
			expected: {foo:"bar","gamedef":"GAMEDEF",availableMarks:"MARKS",availableCommands:"COMMANDS"}
		}
	}
},I);



