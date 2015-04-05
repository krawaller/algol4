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
tester("evaluate",{
	evaluateDirList: [{
		firstarg: ["DIRS",[1,2,3,4,5]],
		expected: [1,2,3,4,5]
	},{
		firstarg: ["RELATIVEDIRS",["DIRS",[1,2,3]],["VAL",2]],
		expected: [2,3,4]
	}],
	evaluateValue: [{
		firstarg: ["RELATIVEDIR",["VAL",2],["VAL",8]],
		expected: 1
	},{
		state: { layers: { foolayer: { xyz: [{a:666}] } }, marks: { somemark: "xyz" } },
		firstarg: ["LOOKUP","foolayer",["MARKPOS","somemark"],"a"],
		expected: 666
	},{
		firstarg: ["VAL",666],
		expected: 666
	},{
		state: {context:{somectxval:777}},
		firstarg: ["CONTEXTVAL","somectxval"],
		expected: 777
	},{
		state: {layers:{somelayer:{}}},
		firstarg: ["IFELSE",["EMPTY","somelayer"],["VAL","foo"],["VAL","bar"]],
		expected: "foo"
	},{
		state: {layers:{somelayer:{}}},
		firstarg: ["IFELSE",["NOTEMPTY","somelayer"],["VAL","foo"],["VAL","bar"]],
		expected: "bar"
	},{
		state: {layers:{nicelayer:{foo:[],bar:[],baz:[]}}},
		firstarg: ["POSITIONSIN","nicelayer"],
		expected: 3
	},{
		firstarg: ["SUM",["VAL",2],["VAL",3]],
		expected: 5
	}],
	evaluatePosition: [{
		state: { layers: { barlayer: { blah: [{a:666}] }}},
		firstarg: ["ONLYPOSIN","barlayer"],
		expected: "blah"
	},{
		state: {context:{somectxpos:777}},
		firstarg: ["CONTEXTPOS","somectxpos"],
		expected: 777
	},{
		state: {steps:[{command:"somecmnd",marks:{somemark:"FOO"}},{command:"somecmnd",marks:{somemark:"BAR"}},{command:"othercmnd",marks:{somemark:"blah"}}]},
		firstarg: ["MARKINLAST","somecmnd","somemark"],
		expected: "BAR"
	}],
	evaluatePositionList: [{
		state: { layers: {somelayer: {a:"X",b:"X"}} },
		firstarg: ["FROMALLINLAYER","somelayer"],
		expected: ["a","b"]
	},{
		state: { layers: {somelayer: {a:"X",b:"X"}, someotherlayer: {b:"Y",c:"Y"}} },
		firstarg: ["FROMALLINLAYERS","somelayer","someotherlayer"],
		expected: ["a","b","c"]
	},{
		state: { marks: {somemark: "foo"} },
		firstarg: ["FROMSINGLEPOS",["MARKPOS","somemark"]],
		expected: ["foo"]
	}],
	evaluateId: [{
		state: { layers: {UNITS: {xyz:[{id:"678"}]}}, marks: {somemark:"xyz"}},
		firstarg: ["IDAT",["MARKPOS","somemark"]],
		expected: "678"
	}],
	evaluateBoolean: [{
		firstarg: ["AND",[["MORE",["VAL",3],["VAL",1]],["MORE",["VAL",3],["VAL",1]]]],
		expected: true
	},{
		firstarg: ["AND",[["MORE",["VAL",3],["VAL",1]],["MORE",["VAL",3],["VAL",11]]]],
		expected: false
	},{
		firstarg: ["OR",[["MORE",["VAL",3],["VAL",1111]],["MORE",["VAL",3],["VAL",1]]]],
		expected: true
	},{
		firstarg: ["OR",[["MORE",["VAL",3],["VAL",1111]],["MORE",["VAL",3],["VAL",11]]]],
		expected: false
	},{
		state: { layers: { UNITS: {xyz:[{id:"123"}]} }, marks: {uglymark:"xyz"}, affected:["3","7","123"] },
		firstarg: ["AFFECTED",["IDAT",["MARKPOS","uglymark"]]],
		expected: true
	},{
		state: { layers: { UNITS: {xyz:[{id:"123"}]} }, marks: {uglymark:"xyz"}, affected:["3","7","321"] },
		firstarg: ["AFFECTED",["IDAT",["MARKPOS","uglymark"]]],
		expected: false
	},{
		firstarg: ["SAME",["VAL","foo"],["VAL","bar"]],
		expected: false
	},{
		firstarg: ["SAME",["VAL","foo"],["VAL","foo"]],
		expected: true
	},{
		firstarg: ["DIFFERENT",["VAL","foo"],["VAL","bar"]],
		expected: true
	},{
		firstarg: ["DIFFERENT",["VAL","foo"],["VAL","foo"]],
		expected: false
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"xyz"}},
		firstarg: ["ANYAT","somelayer",["MARKPOS","somemark"]],
		expected: true
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"abc"}},
		firstarg: ["ANYAT","somelayer",["MARKPOS","somemark"]],
		expected: false
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"xyz"}},
		firstarg: ["NONEAT","somelayer",["MARKPOS","somemark"]],
		expected: false
	},{
		state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"abc"}},
		firstarg: ["NONEAT","somelayer",["MARKPOS","somemark"]],
		expected: true
	},{
		firstarg: ["NOT",["MORE",["VAL",3],["VAL",7]]],
		expected: true
	},{
		firstarg: ["NOT",["MORE",["VAL",7],["VAL",3]]],
		expected: false
	},{
		state: { steps: [{command:"yes"}]},
		firstarg: ["PERFORMEDANYCOMMAND"],
		expected: true
	},{
		state: { steps: []},
		firstarg: ["PERFORMEDANYCOMMAND"],
		expected: false
	},{
		state: { steps: [{command:"foo"},{command:"somecommand"}]},
		firstarg: ["HASPERFORMEDCOMMAND","somecommand"],
		expected: true
	},{
		state: { steps: [{command:"foo"},{command:"bar"}]},
		firstarg: ["HASPERFORMEDCOMMAND","somecommand"],
		expected: false
	},{
		state: {layers: {foolayer: {a:["X"]}}, marks: {somemark: "a"}},
		firstarg: ["POSITIONINLIST",["MARKPOS","somemark"],["FROMALLINLAYER","foolayer"]],
		expected: true
	},{
		state: {layers: {foolayer: {a:["X"]}}, marks: {somemark: "b"}},
		firstarg: ["POSITIONINLIST",["MARKPOS","somemark"],["FROMALLINLAYER","foolayer"]],
		expected: false
	}]
});
*/