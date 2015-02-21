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

var filtertests = [{
	filter: {layer: "somelayer", matching: {foo:["IS",["VAL","bar"]]}},
	state: {layers: {somelayer: {a:[{foo:"muu"}],b:[{foo:"bar",bin:"baj"}]}}},
	expected: {b:[{foo:"bar",bin:"baj"}]}
},{
	filter: {layer: "somelayer", overlapping: "someotherlayer"},
	state: {layers: {somelayer: {a:[{foo:"bar"}],b:[{baz:"bin"}]}, someotherlayer:{q:[{what:"ev"}],b:[{wuu:"meee"}]}}},
	expected: {b:[{baz:"bin"}]}
},{
	filter: {layer: "somelayer", overlapping: "someotherlayer", matching: {foo:["IS",["VAL","bar"]]}},
	state: {layers: {somelayer: {aaa:[{foo:"blaj"},{foo:"bar"}],b:[{baz:"bin"}],c:[{foo:"bar"}]}, someotherlayer:{aaa:[{what:"ev"}],b:[{wuu:"meee"}]}}},
	expected: {aaa:[{foo:"bar"}]}
}];

describe("the generateFilter function",function(){
	_.each(filtertests,function(test){
		describe("when called with "+JSON.stringify(test.filter)+" and state is "+JSON.stringify(test.state),function(){
			it("returns "+JSON.stringify(test.expected),function(){
				var result = Algol.generateFilter(I.fromJS(test.state||{}),I.fromJS(test.filter));
				expect(result.toJS()).toEqual(test.expected);
			});
		});
	});
});