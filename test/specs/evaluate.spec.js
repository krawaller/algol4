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
	evaluateDirList: [{
		command: ["DIRS",1,2,3,4,5],
		expected: [1,2,3,4,5]
	},{
		command: ["RELATIVEDIRS",["DIRS",1,2,3],["VAL",2]],
		expected: [2,3,4]
	}],
	evaluateValue: [{
		command: ["RELATIVEDIR",["VAL",2],["VAL",8]],
		expected: 1
	},{
		state: { layers: { foolayer: { xyz: [{a:666}] } }, marks: { somemark: "xyz" } },
		command: ["LOOKUP","foolayer",["MARKPOS","somemark"],"a"],
		expected: 666
	},{
		command: ["VAL",666],
		expected: 666
	},{
		state: {context:{somectxval:777}},
		command: ["CONTEXTVAL","somectxval"],
		expected: 777
	},{
		state: {layers:{somelayer:{}}},
		command: ["IFELSE",["EMPTY","somelayer"],["VAL","foo"],["VAL","bar"]],
		expected: "foo"
	},{
		state: {layers:{somelayer:{}}},
		command: ["IFELSE",["NOTEMPTY","somelayer"],["VAL","foo"],["VAL","bar"]],
		expected: "bar"
	},{
		state: {layers:{nicelayer:{foo:[],bar:[],baz:[]}}},
		command: ["POSITIONSIN","nicelayer"],
		expected: 3
	},{
		command: ["SUM",["VAL",2],["VAL",3]],
		expected: 5
	}],
	evaluatePosition: [{
		state: { layers: { barlayer: { blah: [{a:666}] }}},
		command: ["ONLYPOSIN","barlayer"],
		expected: "blah"
	},{
		state: {context:{somectxpos:777}},
		command: ["CONTEXTPOS","somectxpos"],
		expected: 777
	},{
		state: {steps:[{command:"somecmnd",marks:{somemark:"FOO"}},{command:"somecmnd",marks:{somemark:"BAR"}},{command:"othercmnd",marks:{somemark:"blah"}}]},
		command: ["MARKINLAST","somecmnd","somemark"],
		expected: "BAR"
	}],
	evaluatePositionList: [{
		state: { layers: {somelayer: {a:"X",b:"X"}} },
		command: ["FROMALLINLAYER","somelayer"],
		expected: ["a","b"]
	},{
		state: { layers: {somelayer: {a:"X",b:"X"}, someotherlayer: {b:"Y",c:"Y"}} },
		command: ["FROMALLINLAYERS","somelayer","someotherlayer"],
		expected: ["a","b","c"]
	}],
	evaluateId: [{
		state: { layers: {UNITS: {xyz:[{id:"678"}]}}, marks: {somemark:"xyz"}},
		command: ["IDAT",["MARKPOS","somemark"]],
		expected: "678"
	}],
	evaluateBoolean: [{
		command: ["AND",["MORE",["VAL",3],["VAL",1]],["MORE",["VAL",3],["VAL",1]]],
		expected: true
	},{
		command: ["AND",["MORE",["VAL",3],["VAL",1]],["MORE",["VAL",3],["VAL",11]]],
		expected: false
	},{
		command: ["OR",["MORE",["VAL",3],["VAL",1111]],["MORE",["VAL",3],["VAL",1]]],
		expected: true
	},{
		command: ["OR",["MORE",["VAL",3],["VAL",1111]],["MORE",["VAL",3],["VAL",11]]],
		expected: false
	},{
		state: { layers: { UNITS: {xyz:[{id:"123"}]} }, marks: {uglymark:"xyz"}, affected:["3","7","123"] },
		command: ["AFFECTED",["IDAT",["MARKPOS","uglymark"]]],
		expected: true
	},{
		state: { layers: { UNITS: {xyz:[{id:"123"}]} }, marks: {uglymark:"xyz"}, affected:["3","7","321"] },
		command: ["AFFECTED",["IDAT",["MARKPOS","uglymark"]]],
		expected: false
	},{
		command: ["SAME",["VAL","foo"],["VAL","bar"]],
		expected: false
	},{
		command: ["SAME",["VAL","foo"],["VAL","foo"]],
		expected: true
	},{
		command: ["DIFFERENT",["VAL","foo"],["VAL","bar"]],
		expected: true
	},{
		command: ["DIFFERENT",["VAL","foo"],["VAL","foo"]],
		expected: false
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"xyz"}},
		command: ["ANYAT","somelayer",["MARKPOS","somemark"]],
		expected: true
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"abc"}},
		command: ["ANYAT","somelayer",["MARKPOS","somemark"]],
		expected: false
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"xyz"}},
		command: ["NONEAT","somelayer",["MARKPOS","somemark"]],
		expected: false
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"abc"}},
		command: ["NONEAT","somelayer",["MARKPOS","somemark"]],
		expected: true
	},{
		command: ["NOT",["MORE",["VAL",3],["VAL",7]]],
		expected: true
	},{
		command: ["NOT",["MORE",["VAL",7],["VAL",3]]],
		expected: false
	},{
		state: { steps: [{command:"yes"}]},
		command: ["PERFORMEDANYCOMMAND"],
		expected: true
	},{
		state: { steps: []},
		command: ["PERFORMEDANYCOMMAND"],
		expected: false
	},{
		state: { steps: [{command:"foo"},{command:"somecommand"}]},
		command: ["HASPERFORMEDCOMMAND","somecommand"],
		expected: true
	},{
		state: { steps: [{command:"foo"},{command:"bar"}]},
		command: ["HASPERFORMEDCOMMAND","somecommand"],
		expected: false
	}]
};

describe("The evaluate functions",function(){
	_.each(tests,function(arr,funcname){
		describe("the "+funcname+" function",function(){
			_.each(arr,function(test){
				describe("when called with "+JSON.stringify(test.command)+(test.state ? " and state is "+JSON.stringify(test.state) : ""),function(){
					it("returns "+test.expected,function(){
						var res = Algol[funcname](I.fromJS(test.state||{}),I.fromJS(test.command));
						expect(res.toJS ? res.toJS() : res).toEqual(test.expected);
					});
				});
			});
		});
	});
});