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
	"prepareUnitLayersFromData(unitsdata,plr)": {
		"for normal call": {
			unitsdata: {
				id1: {POS:"pos1",PLR:1},
				id2: {POS:"pos2",PLR:2},
				id3: {POS:"pos2",STATUS:"DEAD",PLR:1},
				id4: {POS:"pos2",PLR:0}
			},
			plr: 1,
			expected: {
				DEADUNITS:{pos2:[{POS:"pos2",STATUS:"DEAD",PLR:1}]},
				UNITS:{pos1:[{POS:"pos1",PLR:1}],pos2:[{POS:"pos2",PLR:2},{POS:"pos2",PLR:0}]},
				MYUNITS:{pos1:[{POS:"pos1",PLR:1}]},
				OPPUNITS:{pos2:[{POS:"pos2",PLR:2}]},
				NEUTRALS:{pos2:[{POS:"pos2",PLR:0}]}
			}
		}
	},
	"prepareInitialUnitDataFromSetup(setup)": {
		"for normal call": {
			setup: "SETUP",
			context: {
				prepareEntitiesFromList: {
					returns: [{foo:"bar"},{baz:"bin"}],
					expectedargs: [["SETUP"]],
				}
			},
			expected: {
				unit1: {foo:"bar",ID:"unit1"},
				unit2: {baz:"bin",ID:"unit2"}
			}
		},
	},
	"prepareConnectionsFromBoardDef(boarddef)": {
		"for normal board": {
			boarddef: {height: 2, width: 3},
			expected: {
				1001: {x:1,y:1,nextto:{3: 1002, 4: 2002, 5: 2001}},
				1002: {x:2,y:1,nextto:{3: 1003, 4: 2003, 5: 2002, 6: 2001, 7: 1001}},
				1003: {x:3,y:1,nextto:{5: 2003, 6: 2002, 7: 1002}},
				2001: {x:1,y:2,nextto:{1: 1001, 2: 1002, 3: 2002}},
				2002: {x:2,y:2,nextto:{1: 1002, 2: 1003, 3: 2003, 7: 2001, 8: 1001}},
				2003: {x:3,y:2,nextto:{1: 1003, 7: 2002, 8: 1002}}
			}
		},
	},
	"prepareBoardLayersFromBoardDef(boarddef)": {
		"for normal call": {
			"boarddef": {height:2,width:3},
			"expected": {
				"LIGHT": {
					1001: [{COLOUR:"light",X:1,Y:1,POS:1001}],
					1003: [{COLOUR:"light",X:3,Y:1,POS:1003}],
					2002: [{COLOUR:"light",X:2,Y:2,POS:2002}]
				},
				"DARK": {
					1002: [{COLOUR:"dark",X:2,Y:1,POS:1002}],
					2001: [{COLOUR:"dark",X:1,Y:2,POS:2001}],
					2003: [{COLOUR:"dark",X:3,Y:2,POS:2003}]
				},
				"BOARD": {
					1001: [{COLOUR:"light",X:1,Y:1,POS:1001}],
					1002: [{COLOUR:"dark",X:2,Y:1,POS:1002}],
					1003: [{COLOUR:"light",X:3,Y:1,POS:1003}],
					2001: [{COLOUR:"dark",X:1,Y:2,POS:2001}],
					2002: [{COLOUR:"light",X:2,Y:2,POS:2002}],
					2003: [{COLOUR:"dark",X:3,Y:2,POS:2003}]
				}
			}
		}
	},
	"prepareTerrainLayerFromEntityList(list)": {
		"for normal call": {
			list: [{POS:666,foo:"bar"},["ALL",[777,666],{foo:"baz"}]],
			expected: {
				666: [{foo:"bar",POS:666},{foo:"baz",POS:666}],
				777: [{foo:"baz",POS:777}]
			}
		}
	},
	"addEntitiesFromDef(list,def)": {
		"for single entity": {
			list: ["X"],
			def: {foo:"bar"},
			expected: ["X",{foo:"bar"}]
		},
		"for ALL def": {
			list: ["X","Y"],
			def: ["ALL",[666,777],{baz:"bin"}],
			expected: ["X","Y",{baz:"bin","POS":666},{baz:"bin","POS":777}]
		}
	},
	"prepareEntitiesFromList(list)": {
		"for a single and an ALL": {
			list: ["X",["ALL",["Y"],{foo:"bar"}]],
			expected: ["X",{foo:"bar",POS:"Y"}]
		}
	},
	"prepareState(gamedef,players)": {
		"for normal call": {
			gamedef: {
				setup: "SETUP",
				board: "BOARD",
				terrain: {
					swamp: "SWAMP",
					marsh: "MARSH"
				}
			},
			players: "PLAYERS",
			context: {
				prepareTerrainLayerFromEntityList: {
					method: function(e){ return "prepped"+e;}
				},
				prepareConnectionsFromBoardDef: {
					returns: "CONNECTIONS",
					expectedargs: [ ["BOARD"] ]
				},
				prepareInitialUnitDataFromSetup: {
					returns: "UNITS",
					expectedargs: [ ["SETUP"] ]
				},
				prepareBoardLayersFromBoardDef: {
					returns: {light:"LIGHT",dark:"DARK"},
					expectedargs: [ ["BOARD"] ]
				}
			},
			expected: {
				connections: "CONNECTIONS",
				data: {
					units: "UNITS"
				},
				baselayers: {
					light: "LIGHT",
					dark: "DARK",
					swamp: "preppedSWAMP",
					marsh: "preppedMARSH"
				}
			}
		}
	}
},I);



