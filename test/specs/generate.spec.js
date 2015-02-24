/* jshint jasmine: true */

if (typeof require === 'function' && typeof module === 'object') {
	var sinon = require('sinon'),
		jasmineSinon = require('jasmine-sinon'),
		Algol = require("../../src/"),
		_ = require("../../src/lodashmixins"),
		I = require("../../src/immutableextensions");
} else {
	var I = window.Immutable, _ = window._;
}

var tests = {
	generateFilterPods: [{
		state: {layers: {somelayer: {a:[{foo:"muu"}],b:[{foo:"bar",bin:"baj"}]}}},
		firstarg: {layer: "somelayer", matching: {foo:["IS",["VAL","bar"]]}},
		expected: {start: {b: [{START:"b",TOTAL:1 }]}}
	},{
		state: {layers: {somelayer: {a:[{foo:"bar"}],b:[{baz:"bin"}]}, someotherlayer:{q:[{what:"ev"}],b:[{wuu:"meee"}]}}},
		firstarg: {layer: "somelayer", overlapping: ["FROMALLINLAYER","someotherlayer"]},
		expected: {start: {b: [{START:"b",TOTAL:1}]}}
	},{
		state: {layers: {somelayer: {aaa:[{foo:"blaj"},{foo:"bar"}],b:[{baz:"bin"}],c:[{foo:"bar"}]}, someotherlayer:{aaa:[{what:"ev"}],b:[{wuu:"meee"}]}}},
		firstarg: {layer: "somelayer", overlapping: ["FROMALLINLAYER","someotherlayer"], matching: {foo:["IS",["VAL","bar"]]}},
		expected: {start:{aaa:[{START:"aaa",TOTAL:1}]}}
	}],
	generateNeighbourPods: [{
		state: {marks:{somemark:"foo"},neighbours:{foo:{4:"baz",6:"bin"}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",4,5,6]},
		expected: {start: {foo: [{START:"foo",NEIGHBOURS:2}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4,NEIGHBOURS:2}],bin:[{START:"foo",TARGET:"bin",DIR:6,NEIGHBOURS:2}]}}
	},{
		state: {layers:{UNITS:{foo:[{dir:4}]}},marks:{somemark:"foo"},neighbours:{foo:{4:"baz",6:"bin"}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",1,2,3],["LOOKUP","UNITS",["CONTEXTPOS","START"],"dir"]]},
		expected: {start: {foo: [{START:"foo",NEIGHBOURS:2}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4,NEIGHBOURS:2}],bin:[{START:"foo",TARGET:"bin",DIR:6,NEIGHBOURS:2}]}}
	},{
		state: {layers:{somelayer:{foo:"X",foo2:"Y"},UNITS:{foo:[{dir:4}]}},neighbours:{foo:{4:"baz",6:"bin"},foo2:{5:"bin",6:"buh"}}},
		firstarg: {starts: ["FROMALLINLAYER","somelayer"], dirs: ["DIRS",4,5,6]},
		expected: {start: {foo: [{START:"foo",NEIGHBOURS:2}],foo2:[{START:"foo2",NEIGHBOURS:2}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4,NEIGHBOURS:2}],bin:[{START:"foo",TARGET:"bin",DIR:6,NEIGHBOURS:2},{START:"foo2",TARGET:"bin",DIR:5,NEIGHBOURS:2}],buh:[{START:"foo2",TARGET:"buh",DIR:6,NEIGHBOURS:2}]}}
	}],
	generateWalkerPods: [{
		state: {marks: {somemark:"S"}, neighbours:{S:{4:"lonestep"},lonestep:{}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",1],["VAL",4]]},
		expected: {start: {S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}] }, step: {lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]}, block: {}, all: {S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}], lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]} }
	},{
		state: {marks: {somemark:"S"}, neighbours:{S:{5:"step1"},step1:{5:"step2"}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",5], max: 1},
		expected: {start: {S: [{START:"S",DIR:5,STEPS:1,STOPREASON:"REACHEDMAX"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:5,STEPS:1,STEP:1,STOPREASON:"REACHEDMAX"}]}, block: {}, all: {S: [{START:"S",DIR:5,STEPS:1,STOPREASON:"REACHEDMAX"}],step1:[{START:"S",TARGET:"step1",DIR:5,STEPS:1,STEP:1,STOPREASON:"REACHEDMAX"}]} }
	},{
		state: {marks: {somemark:"S"}, neighbours:{S:{6:"step1"},step1:{6:"step2"}}, layers: {pads: {step1:"X"}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",6], steplayer: "pads"},
		expected: {start: {S: [{START:"S",DIR:6,STEPS:1,STOPREASON:"NOMORESTEPS"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:6,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}]}, block: {}, all: {S: [{START:"S",DIR:6,STEPS:1,STOPREASON:"NOMORESTEPS"}],step1:[{START:"S",TARGET:"step1",DIR:6,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}] } }
	},{
		state: {marks: {somemark:"S"}, neighbours:{S:{7:"step1"},step1:{7:"step2"}}, layers: {blocks: {step2:"X"}}},
		firstarg: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",7], blocklayer: "blocks"},
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
	}]
};


describe("The generate functions",function(){
	_.each(tests,function(arr,funcname){
		describe("the "+funcname+" function",function(){
			_.each(arr,function(test){
				describe("when called with "+JSON.stringify(test.firstarg)+" and state is "+JSON.stringify(test.state),function(){
					it("returns "+JSON.stringify(test.expected),function(){
						var result = Algol[funcname](I.fromJS(test.state||{}),I.fromJS(test.firstarg),test.secondarg && I.fromJS(test.secondarg));
						expect(result.toJS()).toEqual(test.expected);
					});
				});
			});
		});
	});
});