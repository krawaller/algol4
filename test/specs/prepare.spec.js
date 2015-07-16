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
	"prepareTerrainLayerFromEntityList(list)": {
		"for normal call": {
			list: [{POS:666,foo:"bar"},["positions",[777,666],{foo:"baz"}]],
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
		"for positions def": {
			list: ["X","Y"],
			def: ["positions",[666,777],{baz:"bin"}],
			expected: ["X","Y",{baz:"bin","POS":666},{baz:"bin","POS":777}]
		},
		"for RECTANGLE def": {
			list: ["X","Y"],
			def: ["rectangle",3002,4003,{baz:"bin"}],
			expected: ["X","Y",{baz:"bin","POS":3002},{baz:"bin","POS":3003},{baz:"bin","POS":4002},{baz:"bin","POS":4003}]
		}
	},
	"prepareEntitiesFromList(list)": {
		"for a single and an positions": {
			list: ["X",["positions",["Y"],{foo:"bar"}]],
			expected: ["X",{foo:"bar",POS:"Y"}]
		}
	},
	"prepareState(gamedef,players)": {
		"for normal call": {
			gamedef: {
				setup: "SETUP",
				board: "BOARD"
			},
			players: "PLAYERS",
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
					expectedargs: [ ["gamedef","players"] ]
				}
			},
			expected: {
				connections: "CONNECTIONS",
				data: {
					units: "UNITS"
				},
				baselayers: "PREPPED"
			}
		}
	}
},I);



