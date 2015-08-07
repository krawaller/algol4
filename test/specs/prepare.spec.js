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

tester("The prepare methods",Algol,{
	"addPersonalisedTerrainVersions(layers,terrains,forplr)": {
		"for normal call": {
			layers: "X",
			terrains: {trees:["t1"],stones:["s1","s2"]},
			forplr: 1,
			expected: "Xt1s1s2",
			context: {
				sortEntity: {
					method: function(layers,terrainentity,groups,forplr){
						return layers+terrainentity;
					},
					expectedargs: [
						["X","t1",["trees"],1],
						["Xt1","s1",["stones"],1],
						["Xt1s1","s2",["stones"],1],
					]
				}
			}
		}
	},
	"prepareConnectionsFromBoardDef(boarddef)": {
		"for normal board": {
			boarddef: {height: 2, width: 3},
			expected: {
				1001: {3: 1002, 4: 2002, 5: 2001},
				1002: {3: 1003, 4: 2003, 5: 2002, 6: 2001, 7: 1001},
				1003: {5: 2003, 6: 2002, 7: 1002},
				2001: {1: 1001, 2: 1002, 3: 2002},
				2002: {1: 1002, 2: 1003, 3: 2003, 7: 2001, 8: 1001},
				2003: {1: 1003, 7: 2002, 8: 1002}
			}
		},
	},
	"prepareBoardLayersFromBoardDef(boarddef)": {
		"for normal call": {
			"boarddef": {height:2,width:3},
			"expected": {
				"light": {
					1001: [{colour:"light",x:1,y:1,pos:1001}],
					1003: [{colour:"light",x:3,y:1,pos:1003}],
					2002: [{colour:"light",x:2,y:2,pos:2002}]
				},
				"dark": {
					1002: [{colour:"dark",x:2,y:1,pos:1002}],
					2001: [{colour:"dark",x:1,y:2,pos:2001}],
					2003: [{colour:"dark",x:3,y:2,pos:2003}]
				},
				"board": {
					1001: [{colour:"light",x:1,y:1,pos:1001}],
					1002: [{colour:"dark",x:2,y:1,pos:1002}],
					1003: [{colour:"light",x:3,y:1,pos:1003}],
					2001: [{colour:"dark",x:1,y:2,pos:2001}],
					2002: [{colour:"light",x:2,y:2,pos:2002}],
					2003: [{colour:"dark",x:3,y:2,pos:2003}]
				}
			}
		}
	},
	"addEntitiesFromDef(list,def)": {
		"for single entity": {
			list: ["X"],
			def: {foo:"bar"},
			expected: ["X",{foo:"bar"}]
		},
		"for positions def": {
			list: ["X","Y"],
			def: ["positions",[666,777],{baz:"bin"}],
			expected: ["X","Y",{baz:"bin","pos":666},{baz:"bin","pos":777}]
		},
		"for RECTANGLE def": {
			list: ["X","Y"],
			def: ["rectangle",3002,4003,{baz:"bin"}],
			expected: ["X","Y",{baz:"bin","pos":3002},{baz:"bin","pos":3003},{baz:"bin","pos":4002},{baz:"bin","pos":4003}]
		}
	},
	"prepareEntitiesFromList(list)": {
		"for a single and an positions": {
			list: ["X",["positions",["Y"],{foo:"bar"}]],
			expected: ["X",{foo:"bar",pos:"Y"}]
		}
	},
	"prepareNewGameState(gamedef,players)": {
		"for normal call": {
			gamedef: {
				setup: "SETUP",
				board: "BOARD",
				commands: {"foo":{},"bar":{}}
			},
			players: 2,
			context: {
				prepareConnectionsFromBoardDef: {
					returns: "CONNECTIONS",
					expectedargs: [ ["BOARD"] ]
				},
				prepareInitialUnitDataFromSetup: {
					returns: "UNITS",
					expectedargs: [ ["SETUP"] ]
				},
				prepareBaseLayers: {
					returns: "PREPPED",
					expectedargs: [ ["@gamedef","@players"] ]
				},
				performOption: {
					returns: "READYFORFIRSTSTEP",
					expectedargs: [[{
						gamedef: {
							setup: "SETUP",
							board: "BOARD",
							commands: {"foo":{number:2},"bar":{number:1}}
						},
						commandsinorder: ["bar","foo"],
						connections: "CONNECTIONS",
						data: {
							units: "UNITS"
						},
						baselayers: "PREPPED",
						basecontext: {
							nbrofplayers: 2
						},
						status: "ongoing",
						passto: {1:2,2:1}
					},["passto",1]]]
				}
			},
			expected: "READYFORFIRSTSTEP"
		}
	},
	"prepareNewTurnState(state,nextplayer)": {
		"for call with effect": {
			nextplayer: 777,
			state: {
				steps: "SOMETHING",
				marks: "FOO",
				baselayers: {777:"basefor777"},
				turn: 666,
				context: "FOO",
				player: 333,
				passto: {777:999},
				basecontext: {base:true}
			},
			expected: {
				steps: [],
				TURNSTART: "RANSTEP!",
				marks: {},
				baselayers: {777:"basefor777"},
				baselayer: "basefor777",
				turn: 667,
				player: 777,
				passto: {777:999},
				basecontext: {base:true},
				context: {currentplayer:777,performedsteps:0,nextplayer:999,base:true}
			},
			context: {
				prepareNewStepState: {
					method: function(s){ return s.set("TURNSTART","RANSTEP!") }
				}
			}
		}
	},
	"prepareNewStepState(state,newmarks)": {
		"when state has empty steps array": {
			state: {
				gamedef: {
					startturn: {rungenerators:"TURNSTART",applyeffect:"EFFECTS"},
					startstep: {rungenerators:"STEPSTART"}
				},
				data: {units:"UNITSDATA"},
				player: "PLAYER",
				steps: [],
				baselayer: {BASE:true},
			},
			context: {
				applyGeneratorList: {
					method: function(s,l){ return s.set(l,"yeah"); }
				},
				applyEffect: {
					method: function(s,l){ return s.set(l,"yeah"); }	
				},
				addUnitLayersFromData: {
					method: function(layers,unitdata,plr){ return layers.set("WITHUNITS",true)},
					expectedargs: [[{BASE:true},"UNITSDATA","PLAYER"],[{BASE:true},"UNITSDATA","PLAYER"]]
				}
			},
			expected: {
				gamedef: {
					startturn: {rungenerators:"TURNSTART",applyeffect:"EFFECTS"},
					startstep: {rungenerators:"STEPSTART"}
				},
				data: {units:"UNITSDATA"},
				player: "PLAYER",
				steps: [],
				baselayer: {BASE:true},
				layers: {BASE:true,WITHUNITS:true},
				STEPSTART: "yeah",
				EFFECTS: "yeah",
				marks: {}
			}
		},
		"when state has previous steps array and new marks": {
			state: {
				gamedef: {
					startstep: {rungenerators:"STEPSTART"},
					endturn: {condition:"ENDTURNCOND"}
				},
				data: {units:"UNITSDATA"},
				player: "PLAYER",
				steps: ["STEP"],
				baselayer: {BASE:true}
			},
			newmarks: {mark1:"MARK1POS",mark2:"MARK2POS"},
			context: {
				setMark: {
					method: function(state,markname,pos){
						return state.set(markname,pos);
					}
				},
				applyGeneratorList: {
					method: function(s,l){ return s.set(l,"yeah"); }
				},
				applyEffect: {
					method: function(s,l){ return s.set(l,"yeah"); }	
				},
				addUnitLayersFromData: {
					method: function(layers,unitdata,plr){ return layers.set("WITHUNITS",true)},
					expectedargs: [[{BASE:true},"UNITSDATA","PLAYER"]]
				},
				evaluateBoolean: {
					returns: "trueorfalse",
					/*expectedargs: [[{
						gamedef: {
							startstep: {rungenerators:"STEPSTART"},
							endturn: {condition:"ENDTURNCOND"}
						},
						steps: ["STEPS"],
						baselayer: "BASE",
						layers: "BASE",
						STEPSTART: "yeah"
					},"ENDTURNCOND"]]*/
				}
			},
			expected: {
				previousstep: {
					gamedef: {
						startstep: {rungenerators:"STEPSTART"},
						endturn: {condition:"ENDTURNCOND"}
					},
					data: {units:"UNITSDATA"},
					player: "PLAYER",
					steps: ["STEP"],
					baselayer: {BASE:true}
				},
				gamedef: {
					startstep: {rungenerators:"STEPSTART"},
					endturn: {condition:"ENDTURNCOND"}
				},
				steps: ["STEP"],
				baselayer: {BASE:true},
				layers: {BASE:true,WITHUNITS:true},
				STEPSTART: "yeah",
				canendturn: "trueorfalse",
				data : { units : 'UNITSDATA' },
				player : 'PLAYER',
				mark1: "MARK1POS",
				mark2: "MARK2POS",
				marks: {}
			}
		}
	},
	"populateGameWithSettings(state,gamedef)": {
		"for simple test": {
			state: {settings:{foo:"bar"}},
			gamedef: {so:["why",["am","i",["settings","foo"]]]},
			expected: {so:["why",["am","i","bar"]]},
		}
	}
},I);



