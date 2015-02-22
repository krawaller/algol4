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
	generateFilter: [{
		definition: {layer: "somelayer", matching: {foo:["IS",["VAL","bar"]]}},
		state: {layers: {somelayer: {a:[{foo:"muu"}],b:[{foo:"bar",bin:"baj"}]}}},
		expected: {b:[{foo:"bar",bin:"baj"}]}
	},{
		definition: {layer: "somelayer", overlapping: "someotherlayer"},
		state: {layers: {somelayer: {a:[{foo:"bar"}],b:[{baz:"bin"}]}, someotherlayer:{q:[{what:"ev"}],b:[{wuu:"meee"}]}}},
		expected: {b:[{baz:"bin"}]}
	},{
		definition: {layer: "somelayer", overlapping: "someotherlayer", matching: {foo:["IS",["VAL","bar"]]}},
		state: {layers: {somelayer: {aaa:[{foo:"blaj"},{foo:"bar"}],b:[{baz:"bin"}],c:[{foo:"bar"}]}, someotherlayer:{aaa:[{what:"ev"}],b:[{wuu:"meee"}]}}},
		expected: {aaa:[{foo:"bar"}]}
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
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",1],["VAL",4]], max: 5},
		state: {marks: {somemark:"S"}, neighbours:{S:{4:"lonestep"},lonestep:{}}},
		expected: {start: {S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}] }, step: {lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]}, block: {} }
	}/*,{
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",1,2,3,4],["VAL",4]], max: 2, steplayer: "steps", blocklayer: "blocks" },
		state: {layers: {blocklayer: {block:"X"}, steplayer: {step:"X",step1:"X",step2:"X",stepA:"X"}}, marks: {somemark:"S"}, neighbours:{S:{5:"step",6:"step1",7:"stepA"},step:{5:"block"},step1:{6:"step2"},step2:{},stepA:{7:"stepB"}}},
		expected: {start: {S: [{START:"S",DIR:4,STEPS:0,STOPREASON:"OUTOFBOUNDS"},{START:"S",DIR:5,STEPS:1,STOPREASON:"HITBLOCK"},{START:"S",DIR:6,STEPS:2,STOPREASON:"REACHEDMAX"},{START:"S",DIR:7,STEPS:1,STOPREASON:"NOMORESTEPS"}] }, step: {step:[{START:"S",STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}]} }
	}*/]
};


describe("The generate functions",function(){
	_.each(tests,function(arr,funcname){
		describe("the "+funcname+" function",function(){
			_.each(arr,function(test){
				describe("when called with "+JSON.stringify(test.definition)+" and state is "+JSON.stringify(test.state),function(){
					it("returns "+JSON.stringify(test.expected),function(){
						var result = Algol[funcname](I.fromJS(test.state||{}),I.fromJS(test.definition));
						expect(result.toJS()).toEqual(test.expected);
					});
				});
			});
		});
	});
});