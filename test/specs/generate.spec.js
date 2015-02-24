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
	generateFilterSeeds: [{
		definition: {layer: "somelayer", matching: {foo:["IS",["VAL","bar"]]}},
		state: {layers: {somelayer: {a:[{foo:"muu"}],b:[{foo:"bar",bin:"baj"}]}}},
		expected: {start: {b: [{START:"b",TOTAL:1 }]}}
	},{
		definition: {layer: "somelayer", overlapping: ["FROMALLINLAYER","someotherlayer"]},
		state: {layers: {somelayer: {a:[{foo:"bar"}],b:[{baz:"bin"}]}, someotherlayer:{q:[{what:"ev"}],b:[{wuu:"meee"}]}}},
		expected: {start: {b: [{START:"b",TOTAL:1}]}}
	},{
		definition: {layer: "somelayer", overlapping: ["FROMALLINLAYER","someotherlayer"], matching: {foo:["IS",["VAL","bar"]]}},
		state: {layers: {somelayer: {aaa:[{foo:"blaj"},{foo:"bar"}],b:[{baz:"bin"}],c:[{foo:"bar"}]}, someotherlayer:{aaa:[{what:"ev"}],b:[{wuu:"meee"}]}}},
		expected: {start:{aaa:[{START:"aaa",TOTAL:1}]}}
	}],
	generateNexttoSeeds: [{
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",4,5,6]},
		state: {marks:{somemark:"foo"},neighbours:{foo:{4:"baz",6:"bin"}}},
		expected: {start: {foo: [{START:"foo",TARGET:"baz",DIR:4},{START:"foo",TARGET:"bin",DIR:6}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4}],bin:[{START:"foo",TARGET:"bin",DIR:6}]}}
	},{
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",1,2,3],["LOOKUP","UNITS",["CONTEXTPOS","START"],"dir"]]},
		state: {layers:{UNITS:{foo:[{dir:4}]}},marks:{somemark:"foo"},neighbours:{foo:{4:"baz",6:"bin"}}},
		expected: {start: {foo: [{START:"foo",TARGET:"baz",DIR:4},{START:"foo",TARGET:"bin",DIR:6}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4}],bin:[{START:"foo",TARGET:"bin",DIR:6}]}}
	},{
		definition: {starts: ["FROMALLINLAYER","somelayer"], dirs: ["DIRS",4,5,6]},
		state: {layers:{somelayer:{foo:"X",foo2:"Y"},UNITS:{foo:[{dir:4}]}},neighbours:{foo:{4:"baz",6:"bin"},foo2:{5:"bin",6:"buh"}}},
		expected: {start: {foo: [{START:"foo",TARGET:"baz",DIR:4},{START:"foo",TARGET:"bin",DIR:6}],foo2:[{START:"foo2",TARGET:"bin",DIR:5},{START:"foo2",TARGET:"buh",DIR:6}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4}],bin:[{START:"foo",TARGET:"bin",DIR:6},{START:"foo2",TARGET:"bin",DIR:5}],buh:[{START:"foo2",TARGET:"buh",DIR:6}]}}
	}],
	generateWalkerSeeds: [{
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",1],["VAL",4]]},
		state: {marks: {somemark:"S"}, neighbours:{S:{4:"lonestep"},lonestep:{}}},
		expected: {start: {S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}] }, step: {lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]}, block: {} }
	},{
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",5], max: 1},
		state: {marks: {somemark:"S"}, neighbours:{S:{5:"step1"},step1:{5:"step2"}}},
		expected: {start: {S: [{START:"S",DIR:5,STEPS:1,STOPREASON:"REACHEDMAX"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:5,STEPS:1,STEP:1,STOPREASON:"REACHEDMAX"}]}, block: {} }
	},{
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",6], steplayer: "pads"},
		state: {marks: {somemark:"S"}, neighbours:{S:{6:"step1"},step1:{6:"step2"}}, layers: {pads: {step1:"X"}}},
		expected: {start: {S: [{START:"S",DIR:6,STEPS:1,STOPREASON:"NOMORESTEPS"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:6,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}]}, block: {} }
	},{
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["DIRS",7], blocklayer: "blocks"},
		state: {marks: {somemark:"S"}, neighbours:{S:{7:"step1"},step1:{7:"step2"}}, layers: {blocks: {step2:"X"}}},
		expected: {start: {S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}] }, step: {step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}]}, block: {step2:[{START:"S",TARGET:"step2",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}]} }
	}],
	paintSeedPod: [{
		definition: {condition:["ANYAT","somelayer",["CONTEXTPOS","TARGET"]], tolayer: ["VAL","newlayer"], include: {myfoo:["CONTEXTVAL","FOO"]}},
		secondarg: {abc: [{FOO:"BAR",TARGET:"abc"}], xyz: [{FOO:"BAZ",TARGET:"xyz"},{FOO:"BIN",TARGET:"xyz"}]},
		state: {layers: {somelayer: {xyz:"X"}, newlayer: {toot:"X"}},context:{poo:"foo"}},
		expected: {layers: {somelayer: {xyz:"X"}, newlayer: {toot:"X",xyz:[{myfoo:"BAZ"},{myfoo:"BIN"}]}},context:{poo:"foo"}}
	},{
		definition: {tolayer: ["VAL","newlayer"]},
		secondarg: {abc: [{FOO:"BAR",TARGET:"abc"}]},
		state: {layers: {newlayer: {toot:"X"}},context:{}},
		expected: {layers: {newlayer: {toot:"X",abc:[{}]}},context:{}},
	}]
};


describe("The generate functions",function(){
	_.each(tests,function(arr,funcname){
		describe("the "+funcname+" function",function(){
			_.each(arr,function(test){
				describe("when called with "+JSON.stringify(test.definition)+" and state is "+JSON.stringify(test.state),function(){
					it("returns "+JSON.stringify(test.expected),function(){
						var result = Algol[funcname](I.fromJS(test.state||{}),I.fromJS(test.definition),test.secondarg && I.fromJS(test.secondarg));
						expect(result.toJS()).toEqual(test.expected);
					});
				});
			});
		});
	});
});