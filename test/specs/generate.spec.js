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

/*
tester("generate",{
	applyFilter: [{
		state: {layers: {badorks: {xxx:"X",b:["MOO"]}, muppets:{a:[{foo:"bar"}],b:[{foo:"baz"},{foo:"bin"}]}},context:{forbidden:"baz"}},
		firstarg: {layer: "muppets", matching: {foo:["ISNT",["CONTEXTVAL","forbidden"]]},tolayer:["IFELSE",["SAME",["LOOKUP","muppets",["CONTEXTPOS","START"],"foo"],["VAL","bar"]],["VAL","knorks"],["VAL","badorks"]]},
		expected: {layers: {knorks: {a: [{foo:"bar"}]}, badorks: {b:["MOO",{foo:"bin"}],xxx:"X"}, muppets:{a:[{foo:"bar"}],b:[{foo:"baz"},{foo:"bin"}]}},context:{forbidden:"baz"}}
	},{
		state: {layers: {foos:{b:"X"},muppets:{a:[{foo:"bar"}],b:[{foo:"bar"},{foo:"notbar"}]}},context:{shouldbe:"bar"}},
		firstarg: {layer: "muppets", matching: {foo:["IS",["CONTEXTVAL","shouldbe"]]},tolayer:["VAL","knorks"],condition:["ANYAT","foos",["CONTEXTPOS","START"]]},
		expected: {layers: {foos:{b:"X"},knorks: {b: [{foo:"bar"}]},muppets:{a:[{foo:"bar"}],b:[{foo:"bar"},{foo:"notbar"}]}},context:{shouldbe:"bar"}}
	}],
	generateNeighbourPods: [{
		state: {marks:{somemark:"foo"},board:{foo:{nextto:{4:"baz",6:"bin"}}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",[4,5,6]]},
		expected: {start: {foo: [{START:"foo",NEIGHBOURS:2}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4,NEIGHBOURS:2}],bin:[{START:"foo",TARGET:"bin",DIR:6,NEIGHBOURS:2}]}}
	},{
		state: {layers:{UNITS:{foo:[{dir:4}]}},marks:{somemark:"foo"},board:{foo:{nextto:{4:"baz",6:"bin"}}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",[1,2,3]],["LOOKUP","UNITS",["CONTEXTPOS","START"],"dir"]]},
		expected: {start: {foo: [{START:"foo",NEIGHBOURS:2}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4,NEIGHBOURS:2}],bin:[{START:"foo",TARGET:"bin",DIR:6,NEIGHBOURS:2}]}}
	},{
		state: {layers:{somelayer:{foo:"X",foo2:"Y"},UNITS:{foo:[{dir:4}]}},board:{foo:{nextto:{4:"baz",6:"bin"}},foo2:{nextto:{5:"bin",6:"buh"}}}},
		firstarg: {starts: ["FROMALLINLAYER","somelayer"], dirs: ["DIRS",[4,5,6]]},
		expected: {start: {foo: [{START:"foo",NEIGHBOURS:2}],foo2:[{START:"foo2",NEIGHBOURS:2}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4,NEIGHBOURS:2}],bin:[{START:"foo",TARGET:"bin",DIR:6,NEIGHBOURS:2},{START:"foo2",TARGET:"bin",DIR:5,NEIGHBOURS:2}],buh:[{START:"foo2",TARGET:"buh",DIR:6,NEIGHBOURS:2}]}}
	}],
	generateWalkerPods: [{
		state: {marks: {somemark:"S"}, board:{S:{nextto:{4:"lonestep"}},lonestep:{nextto:{}}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",[1]],["VAL",4]]},
		expected: {start: {S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}] }, step: {lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]}, block: {}, all: {S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}], lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]} }
	},{
		state: {marks: {somemark:"S"}, board:{S:{nextto:{5:"step1"}},step1:{nextto:{5:"step2"}}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",[5]], max: 1},
		expected: {start: {S: [{START:"S",DIR:5,STEPS:1,STOPREASON:"REACHEDMAX"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:5,STEPS:1,STEP:1,STOPREASON:"REACHEDMAX"}]}, block: {}, all: {S: [{START:"S",DIR:5,STEPS:1,STOPREASON:"REACHEDMAX"}],step1:[{START:"S",TARGET:"step1",DIR:5,STEPS:1,STEP:1,STOPREASON:"REACHEDMAX"}]} }
	},{
		state: {marks: {somemark:"S"}, board:{S:{nextto:{6:"step1"}},step1:{nextto:{6:"step2"}}}, layers: {pads: {step1:"X"}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",[6]], steps: ["FROMALLINLAYER","pads"]},
		expected: {start: {S: [{START:"S",DIR:6,STEPS:1,STOPREASON:"NOMORESTEPS"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:6,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}]}, block: {}, all: {S: [{START:"S",DIR:6,STEPS:1,STOPREASON:"NOMORESTEPS"}],step1:[{START:"S",TARGET:"step1",DIR:6,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}] } }
	},{
		state: {marks: {somemark:"S"}, board:{S:{nextto:{7:"step1"}},step1:{nextto:{7:"step2"}}}, layers: {blocks: {step2:"X"}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",[7]], blocks: ["FROMALLINLAYER","blocks"]},
		expected: {start: {S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}]}, block: {step2:[{START:"S",TARGET:"step2",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}]}, all: {S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}],step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}],step2:[{START:"S",TARGET:"step2",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}] } }
	}],
	paintSeedPod: [{
		state: {layers: {somelayer: {xyz:"X"}, newlayer: {toot:"X"}},context:{poo:"foo"}},
		firstarg: {condition:["ANYAT","somelayer",["CONTEXTPOS","TARGET"]], tolayer: ["VAL","newlayer"], include: {myfoo:["CONTEXTVAL","FOO"]}},
		secondarg: {abc: [{FOO:"BAR",TARGET:"abc"}], xyz: [{FOO:"BAZ",TARGET:"xyz"},{FOO:"BIN",TARGET:"xyz"}]},
		expected: {layers: {somelayer: {xyz:"X"}, newlayer: {toot:"X",xyz:[{myfoo:"BAZ"},{myfoo:"BIN"}]}},context:{poo:"foo"}}
	},{
		state: {layers: {newlayer: {toot:"X"}},context:{}},
		firstarg: {tolayer: ["IFELSE",["SAME",["CONTEXTVAL","FOO"],["VAL","x1"]],["VAL","newlayer"],["VAL","otherlayer"]]},
		secondarg: {abc: [{FOO:"x1"},{FOO:"x2"}]},
		expected: {layers: {newlayer: {toot:"X",abc:[{}]}, otherlayer: {abc:[{}]}},context:{}},
	}],
	paintSeedPods: [{
		state: {layers: {}, context: {poo:"foo"}},
		firstarg: {FLUM: {tolayer: ["VAL","newlayer"], include: {myfoo:["CONTEXTVAL","FOO"]}},HUM: {tolayer: ["VAL","newlayer"], include: {mybar:["CONTEXTVAL","BAR"]}}},
		secondarg: {FLUM: {abc: [{FOO:"BAR",TARGET:"abc"}], xyz: [{FOO:"BAZ",TARGET:"xyz"},{FOO:"BIN",TARGET:"xyz"}]}, HUM: {xyz:[{BAR:"BOO",TARGET:"def"}]}, KKK: {moo:[{FOO:"HOOOO",TARGET:"moo"}]}},
		expected: {layers: {newlayer: {abc: [{myfoo:"BAR"}], xyz:[{myfoo:"BAZ"},{myfoo:"BIN"},{mybar:"BOO"}]}},context:{poo:"foo"}}
	}],
	generateUnitLayersFromState: [{
		state: {player: 1, layers: {UNITS:"foo"}, data: {units: {id1: {POS:"pos1",PLR:1}, id2: {POS:"pos2",PLR:2}, id3: {POS:"pos2",STATUS:"DEAD",PLR:1}}}},
		expected: {player: 1, layers: {DEADUNITS:{pos2:[{POS:"pos2",STATUS:"DEAD",PLR:1}]},UNITS:{pos1:[{POS:"pos1",PLR:1}],pos2:[{POS:"pos2",PLR:2}]},MYUNITS:{pos1:[{POS:"pos1",PLR:1}]},OPPUNITS:{pos2:[{POS:"pos2",PLR:2}]}}, data: {units: {id1: {POS:"pos1",PLR:1}, id2: {POS:"pos2",PLR:2}, id3: {POS:"pos2",STATUS:"DEAD",PLR:1}}}}
	}],
	generateInitialDataFromGameDef: [{
		state: {},
		firstarg: {setup: [{foo:"bar"},{baz:"bin"}]},
		expected: {units: {unit1: {foo:"bar",id:"unit1"}, unit2: {baz:"bin",id:"unit2"}}}
	}],
	generateBoardInfoFromGameDef: [{
		state: {},
		firstarg: {height: 2, width: 3},
		expected: {
			1001: {x:1,y:1,nextto:{3: 1002, 4: 2002, 5: 2001}},
			1002: {x:2,y:1,nextto:{3: 1003, 4: 2003, 5: 2002, 6: 2001, 7: 1001}},
			1003: {x:3,y:1,nextto:{5: 2003, 6: 2002, 7: 1002}},
			2001: {x:1,y:2,nextto:{1: 1001, 2: 1002, 3: 2002}},
			2002: {x:2,y:2,nextto:{1: 1002, 2: 1003, 3: 2003, 7: 2001, 8: 1001}},
			2003: {x:3,y:2,nextto:{1: 1003, 7: 2002, 8: 1002}}
		}
	}],
	generateTerrainFromTerrainDef: [{
		state: {},
		firstarg: {"3005":{foo:"bar"}},
		expected: {3005:{POS:3005,foo:"bar"}}
	}],
	applyGenerator: [{
		state: {marks:{}},
		firstarg: {neededmarks:["foo"]},
		expected: {marks:{}}
	},{
		state: {marks:{foo:"bar"},board:{bar:{nextto:{1:"bar2"}}},context:{blaj:"paj"}},
		firstarg: {neededmarks:["foo"],type:"nextto",starts:["FROMSINGLEPOS",["MARKPOS","foo"]],dirs:["DIRS",[1]],draw:{target:{tolayer:["VAL","newlayer"],include:{prop:["VAL","snopp"]}}}},
		expected: {marks:{foo:"bar"},board:{bar:{nextto:{1:"bar2"}}},layers:{newlayer:{bar2:[{prop:"snopp"}]}},context:{blaj:"paj"}}
	}],
	applyGeneratorList: [{
		state: {marks:{foo:"bar"},board:{bar:{nextto:{1:"bar2"}}},context:{blaj:"paj"},gamedef:{generators:{somegen:{neededmarks:["foo"],type:"nextto",starts:["FROMSINGLEPOS",["MARKPOS","foo"]],dirs:["DIRS",[1]],draw:{target:{tolayer:["VAL","newlayer"],include:{prop:["VAL","snopp"]}}}}}}},
		firstarg: ["somegen"],
		expected: {marks:{foo:"bar"},board:{bar:{nextto:{1:"bar2"}}},layers:{newlayer:{bar2:[{prop:"snopp"}]}},context:{blaj:"paj"},gamedef:{generators:{somegen:{neededmarks:["foo"],type:"nextto",starts:["FROMSINGLEPOS",["MARKPOS","foo"]],dirs:["DIRS",[1]],draw:{target:{tolayer:["VAL","newlayer"],include:{prop:["VAL","snopp"]}}}}}}}
	}]
});
*/