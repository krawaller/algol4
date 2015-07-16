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

tester("The entitice methods",Algol,{
	"addUnitLayersFromData(layers,unitsdata,currentplr)": {
		"for normal call": {
			layers: 1,
			unitsdata: {
				id1: {group:"dorks"},
				id2: {baz:"bin"}
			},
			currentplr: "owner",
			context: {
				sortEntity: {
					method: function(r){ return r+1; },
					expectedargs: [ [1,{group:"dorks"},["units","dorks"],"owner"],[2,{baz:"bin"},["units"],"owner"] ]
				}
			},
			expected: 3
		}
	},
	"sortEntity(layers,entity,groups,currentplr)": {
		"for unit belonging to currentplr": {
			layers: {
				kings: {pos:["foo"]}
			},
			entity: {owner: "ME",pos: "pos"},
			groups: ["kings","units"],
			currentplr: "ME",
			expected: {
				kings: {pos:["foo",{owner: "ME",pos: "pos"}]},
				mykings: {pos:[{owner: "ME",pos: "pos"}]},
				units: {pos:[{owner: "ME",pos: "pos"}]},
				myunits: {pos:[{owner: "ME",pos: "pos"}]}
			}
		},
		"for unit belonging to opponent": {
			layers: {
				kings: {pos:["foo"]}
			},
			entity: {owner: "OPP",pos: "pos"},
			groups: ["kings","units"],
			currentplr: "ME",
			expected: {
				kings: {pos:["foo",{owner: "OPP",pos: "pos"}]},
				oppkings: {pos:[{owner: "OPP",pos: "pos"}]},
				units: {pos:[{owner: "OPP",pos: "pos"}]},
				oppunits: {pos:[{owner: "OPP",pos: "pos"}]}
			}
		},
		"for neutral unit": {
			layers: {
				kings: {pos:["foo"]}
			},
			entity: {owner: 0,pos: "pos"},
			groups: ["kings","units"],
			currentplr: "ME",
			expected: {
				kings: {pos:["foo",{owner: 0,pos: "pos"}]},
				neutralkings: {pos:[{owner: 0,pos: "pos"}]},
				units: {pos:[{owner: 0,pos: "pos"}]},
				neutralunits: {pos:[{owner: 0,pos: "pos"}]},
			}
		},
		"for dead unit belonging to currentplr": {
			layers: {
				deadkings: {pos:["foo"]}
			},
			entity: {status: "dead", owner: "ME",pos: "pos"},
			groups: ["kings","units"],
			currentplr: "ME",
			expected: {
				deadkings: {pos:["foo",{status: "dead", owner: "ME",pos: "pos"}]},
				mydeadkings: {pos:[{status: "dead", owner: "ME",pos: "pos"}]},
				deadunits: {pos:[{status: "dead", owner: "ME",pos: "pos"}]},
				mydeadunits: {pos:[{status: "dead", owner: "ME",pos: "pos"}]}
			}
		},
		"for dead unit belonging to opponent": {
			layers: {
				deadkings: {pos:["foo"]}
			},
			entity: {status: "dead", owner: "OPP",pos: "pos"},
			groups: ["kings","units"],
			currentplr: "ME",
			expected: {
				deadkings: {pos:["foo",{status: "dead", owner: "OPP",pos: "pos"}]},
				oppdeadkings: {pos:[{status: "dead", owner: "OPP",pos: "pos"}]},
				deadunits: {pos:[{status: "dead", owner: "OPP",pos: "pos"}]},
				oppdeadunits: {pos:[{status: "dead", owner: "OPP",pos: "pos"}]}
			}
		},
		"for dead neutral unit": {
			layers: {
				deadkings: {pos:["foo"]}
			},
			entity: {status: "dead", owner: 0, pos: "pos"},
			groups: ["kings","units"],
			currentplr: "ME",
			expected: {
				deadkings: {pos:["foo",{status: "dead", owner: 0,pos: "pos"}]},
				neutraldeadkings: {pos:[{status: "dead", owner: 0,pos: "pos"}]},
				deadunits: {pos:[{status: "dead", owner: 0,pos: "pos"}]},
				neutraldeadunits: {pos:[{status: "dead", owner: 0,pos: "pos"}]}
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
	}
},I);



