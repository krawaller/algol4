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
		definition: {starts: ["FROMSINGLEPOS",["MARKPOS","somemark"]], dirs: ["RELATIVEDIRS",["DIRS",1,2,3],["VAL",4]]},
		state: {marks:{somemark:"foo"},neighbours:{foo:{4:"baz",6:"bin"}}},
		expected: {start: {foo: [{START:"foo",TARGET:"baz",DIR:4},{START:"foo",TARGET:"bin",DIR:6}]},target:{baz:[{START:"foo",TARGET:"baz",DIR:4}],bin:[{START:"foo",TARGET:"bin",DIR:6}]}}
	}]
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