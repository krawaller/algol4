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

tester("the evaluate methods",Algol,{
	"evaluateDirList(state,dirdef)": {
		"for normal DIRS list": {
			dirdef: ["DIRS",[1,2,3,4,5]],
			expected: [1,2,3,4,5]
		},
		"for RELATIVEDIRS list": {
			dirdef: ["RELATIVEDIRS",["DIRS",[1,2,3]],["VAL",2]],
			expected: [2,3,4]
		}
	},
	"evaluateValue(state,valuedef)": {
		"for RELATIVEDIR": {
			valuedef: ["RELATIVEDIR",["VAL",2],["VAL",8]],
			expected: 1
		},
		"for LOOKUP": {
			state: { layers: { foolayer: { xyz: [{a:666}] } }, marks: { somemark: "xyz" } },
			valuedef: ["LOOKUP","foolayer",["MARKPOS","somemark"],"a"],
			expected: 666
		},
		"for VAL": {
			valuedef: ["VAL",666],
			expected: 666
		},
		"for CONTEXTVAL": {
			state: {context:{somectxval:777}},
			valuedef: ["CONTEXTVAL","somectxval"],
			expected: 777
		},
		"for IFELSE with true cond": {
			state: {layers:{somelayer:{}}},
			valuedef: ["IFELSE",["EMPTY","somelayer"],["VAL","foo"],["VAL","bar"]],
			expected: "foo"
		},
		"for IFELSE with false cond": {
			state: {layers:{somelayer:{}}},
			valuedef: ["IFELSE",["NOTEMPTY","somelayer"],["VAL","foo"],["VAL","bar"]],
			expected: "bar"
		},
		"for POSITIONSIN": {
			state: {layers:{nicelayer:{foo:[],bar:[],baz:[]}}},
			valuedef: ["POSITIONSIN","nicelayer"],
			expected: 3
		},
		"for SUM": {
			valuedef: ["SUM",["VAL",2],["VAL",3]],
			expected: 5
		},
		"for COUNT when nothing": {
			state: { },
			valuedef: ["COUNT",["LAYERNAME","somelayer"]],
			expected: 0
		},
		"for COUNT when something": {
			state: { layers: { somelayer: {x:[1,1],y:[3]} } },
			valuedef: ["COUNT",["LAYERNAME","somelayer"]],
			expected: 3
		},
		"for primitive": {
			valuedef: 666,
			expected: 666
		}
	},
	"evaluatePosition(state,posdef)": {
		"for ONLYPOSIN": {
			state: { layers: { barlayer: { blah: [{a:666}] }}},
			posdef: ["ONLYPOSIN","barlayer"],
			expected: "blah"
		},
		"for CONTEXTPOS": {
			state: {context:{somectxpos:777}},
			posdef: ["CONTEXTPOS","somectxpos"],
			expected: 777
		},
		"for MARKINLAST": {
			state: {steps:[{command:"somecmnd",marks:{somemark:"FOO"}},{command:"somecmnd",marks:{somemark:"BAR"}},{command:"othercmnd",marks:{somemark:"blah"}}]},
			posdef: ["MARKINLAST","somecmnd","somemark"],
			expected: "BAR"
		}
	},
	"evaluatePositionList(state,poslistdef)": {
		"for ALLPOSINLAYER": {
			state: { layers: {somelayer: {a:"X",b:"X"}} },
			poslistdef: ["ALLPOSINLAYER","somelayer"],
			expected: ["a","b"]
		},
		"for ALLPOSINLAYERS": {
			state: { layers: {somelayer: {a:"X",b:"X"}, someotherlayer: {b:"Y",c:"Y"}} },
			poslistdef: ["ALLPOSINLAYERS","somelayer","someotherlayer"],
			expected: ["a","b","c"]
		},
		"for using singlepos": {
			state: { marks: {somemark: "foo"} },
			poslistdef: ["MARKPOS","somemark"],
			expected: ["foo"]
		}
	},
	"evaluateId(state,iddef)": {
		"for IDAT": {
			state: { layers: {UNITS: {xyz:[{id:"678"}]}}, marks: {somemark:"xyz"}},
			iddef: ["IDAT",["MARKPOS","somemark"]],
			expected: "678"
		}
	},
	"evaluateBoolean(state,booldef)": {
		"for AND with all true": {
			booldef: ["AND",[["MORE",["VAL",3],["VAL",1]],["MORE",["VAL",3],["VAL",1]]]],
			expected: true
		},
		"for AND with all false": {
			booldef: ["AND",[["MORE",["VAL",3],["VAL",1]],["MORE",["VAL",3],["VAL",11]]]],
			expected: false
		},
		"for OR with one true": {
			booldef: ["OR",[["MORE",["VAL",3],["VAL",1111]],["MORE",["VAL",3],["VAL",1]]]],
			expected: true
		},
		"for OR with none true": {
			booldef: ["OR",[["MORE",["VAL",3],["VAL",1111]],["MORE",["VAL",3],["VAL",11]]]],
			expected: false
		},
		"for AFFECTED when id in list": {
			state: { layers: { UNITS: {xyz:[{id:"123"}]} }, marks: {uglymark:"xyz"}, affected:["3","7","123"] },
			booldef: ["AFFECTED",["IDAT",["MARKPOS","uglymark"]]],
			expected: true
		},
		"for AFFECTED when id not in list": {
			state: { layers: { UNITS: {xyz:[{id:"123"}]} }, marks: {uglymark:"xyz"}, affected:["3","7","321"] },
			booldef: ["AFFECTED",["IDAT",["MARKPOS","uglymark"]]],
			expected: false
		},
		"for SAME when not correct": {
			booldef: ["SAME",["VAL","foo"],["VAL","bar"]],
			expected: false
		},
		"for SAME when correct": {
			booldef: ["SAME",["VAL","foo"],["VAL","foo"]],
			expected: true
		},
		"for DIFFERENT when correct": {
			booldef: ["DIFFERENT",["VAL","foo"],["VAL","bar"]],
			expected: true
		},
		"for DIFFERENT when not correct": {
			booldef: ["DIFFERENT",["VAL","foo"],["VAL","foo"]],
			expected: false
		},
		"for ANYAT when correct": {
			state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"xyz"}},
			booldef: ["ANYAT","somelayer",["MARKPOS","somemark"]],
			expected: true
		},
		"for ANYAT when not correct": {
			state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"abc"}},
			booldef: ["ANYAT","somelayer",["MARKPOS","somemark"]],
			expected: false
		},
		"for NONEAT when not correct": {
			state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"xyz"}},
			booldef: ["NONEAT","somelayer",["MARKPOS","somemark"]],
			expected: false
		},
		"for NONEAT when correct": {
			state: { layers: {somelayer: {xyz:[{foo:"bar"}]}}, marks: {somemark:"abc"}},
			booldef: ["NONEAT","somelayer",["MARKPOS","somemark"]],
			expected: true
		},
		"for NOT with false arg": {
			booldef: ["NOT",["MORE",["VAL",3],["VAL",7]]],
			expected: true
		},
		"for NOT with true arg": {
			booldef: ["NOT",["MORE",["VAL",7],["VAL",3]]],
			expected: false
		},
		"for PERFORMEDANYCOMMAND when correct": {
			state: { steps: [{command:"yes"}]},
			booldef: ["PERFORMEDANYCOMMAND"],
			expected: true
		},
		"for PERFORMEDANYCOMMAND when not correct": {
			state: { steps: []},
			booldef: ["PERFORMEDANYCOMMAND"],
			expected: false
		},
		"for HASPERFORMEDCOMMAND when correct": {
			state: { steps: [{command:"foo"},{command:"somecommand"}]},
			booldef: ["HASPERFORMEDCOMMAND","somecommand"],
			expected: true
		},
		"for HASPERFORMEDCOMMAND when not correct": {
			state: { steps: [{command:"foo"},{command:"bar"}]},
			booldef: ["HASPERFORMEDCOMMAND","somecommand"],
			expected: false
		},
		"for POSITIONINLIST when correct": {
			state: {layers: {foolayer: {a:["X"]}}, marks: {somemark: "a"}},
			booldef: ["POSITIONINLIST",["MARKPOS","somemark"],["ALLPOSINLAYER","foolayer"]],
			expected: true
		},
		"for POSITIONINLIST when not correct": {
			state: {layers: {foolayer: {a:["X"]}}, marks: {somemark: "b"}},
			booldef: ["POSITIONINLIST",["MARKPOS","somemark"],["ALLPOSINLAYER","foolayer"]],
			expected: false
		}
	}
},I);
