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
		"for normal dirs list": {
			dirdef: ["dirs",[1,2,3,4,5]],
			expected: [1,2,3,4,5]
		},
		"for relativedirs list": {
			dirdef: ["relativedirs",["dirs",[1,2,3]],["val",2]],
			expected: [2,3,4]
		}
	},
	"evaluateValue(state,valuedef)": {
		"for relativedir": {
			valuedef: ["relativedir",["val",2],["val",8]],
			expected: 1
		},
		"for lookup": {
			state: {
				layers: { foolayer: { xyz: [{a:666}] } },
				marks: { somemark: "xyz" }
			},
			valuedef: ["lookup","foolayer",["markpos","somemark"],"a"],
			expected: 666
		},
		"for val": {
			valuedef: ["val",666],
			expected: 666
		},
		"for contextval": {
			state: {context:{somectxval:777}},
			valuedef: ["contextval","somectxval"],
			expected: 777
		},
		"for ifelse with true cond": {
			state: {layers:{somelayer:{}}},
			valuedef: ["ifelse",["isempty","somelayer"],["val","foo"],["val","bar"]],
			expected: "foo"
		},
		"for ifelse with false cond": {
			state: {layers:{somelayer:{}}},
			valuedef: ["ifelse",["notempty","somelayer"],["val","foo"],["val","bar"]],
			expected: "bar"
		},
		"for positionsin": {
			state: {layers:{nicelayer:{foo:[],bar:[],baz:[]}}},
			valuedef: ["positionsin","nicelayer"],
			expected: 3
		},
		"for sum": {
			valuedef: ["sum",["val",2],["val",3]],
			expected: 5
		},
		"for layerobjectcount when nothing": {
			state: { },
			valuedef: ["layerobjectcount",["layername","somelayer"]],
			expected: 0
		},
		"for layerobjectcount when something": {
			state: { layers: { somelayer: {x:[1,1],y:[3]} } },
			valuedef: ["layerobjectcount",["layername","somelayer"]],
			expected: 3
		},
		"for layerpositioncount when something": {
			state: { layers: { somelayer: {x:[1,1],y:[3]} } },
			valuedef: ["layerpositioncount",["layername","somelayer"]],
			expected: 2
		},
		"for layerpositioncount when nothing": {
			state: { layers: { otherlayer: {x:[1,1],y:[3]} } },
			valuedef: ["layerpositioncount",["layername","somelayer"]],
			expected: 0
		},
		"for primitive": {
			valuedef: 666,
			expected: 666
		}
	},
	"evaluatePosition(state,posdef)": {
		"for firstposin": {
			state: { layers: { barlayer: { blah: [{a:666}] }}},
			posdef: ["firstposin","barlayer"],
			expected: "blah"
		},
		"for contextpos": {
			state: {context:{somectxpos:777}},
			posdef: ["contextpos","somectxpos"],
			expected: 777
		},
		"for markinlast": {
			state: {
				steps:[
					{command:"somecmnd",marks:{somemark:"FOO"}},
					{command:"somecmnd",marks:{somemark:"BAR"}},
					{command:"othercmnd",marks:{somemark:"blah"}}
				]
			},
			posdef: ["markinlast","somecmnd","somemark"],
			expected: "BAR"
		}
	},
	"evaluatePositionList(state,poslistdef)": {
		"for allposinlayer": {
			state: { layers: {somelayer: {a:"X",b:"X"}} },
			poslistdef: ["allposinlayer","somelayer"],
			expected: ["a","b"]
		},
		"for allposinlayers": {
			state: {
				layers: {
					somelayer: {a:"X",b:"X"},
					someotherlayer: {b:"Y",c:"Y"}
				}
			},
			poslistdef: ["allposinlayers","somelayer","someotherlayer"],
			expected: ["a","b","c"]
		},
		"for using singlepos": {
			state: { marks: {somemark: "foo"} },
			poslistdef: ["markpos","somemark"],
			expected: ["foo"]
		}
	},
	"evaluateId(state,iddef)": {
		"for idofunitat": {
			state: {
				layers: {units: {xyz:[{ID:"678"}]}},
				marks: {somemark:"xyz"}
			},
			iddef: ["idofunitat",["markpos","somemark"]],
			expected: "678"
		}
	},
	"evaluateBoolean(state,booldef)": {
		"for and with all true": {
			booldef: ["and",[["morethan",["val",3],["val",1]],["morethan",["val",3],["val",1]]]],
			expected: true
		},
		"for and with all false": {
			booldef: ["and",[["morethan",["val",3],["val",1]],["morethan",["val",3],["val",11]]]],
			expected: false
		},
		"for or with one true": {
			booldef: ["or",[["morethan",["val",3],["val",1111]],["morethan",["val",3],["val",1]]]],
			expected: true
		},
		"for or with none true": {
			booldef: ["or",[["morethan",["val",3],["val",1111]],["morethan",["val",3],["val",11]]]],
			expected: false
		},
		"for affected when id in list": {
			state: {
				layers: { units: {xyz:[{ID:"123"}]} },
				marks: {uglymark:"xyz"},
				affected:["3","7","123"]
			},
			booldef: ["affected",["idofunitat",["markpos","uglymark"]]],
			expected: true
		},
		"for affected when id not in list": {
			state: {
				layers: { units: {xyz:[{ID:"123"}]} },
				marks: {uglymark:"xyz"},
				affected:["3","7","321"]
			},
			booldef: ["affected",["idofunitat",["markpos","uglymark"]]],
			expected: false
		},
		"for same when not correct": {
			booldef: ["same",["val","foo"],["val","bar"]],
			expected: false
		},
		"for same when correct": {
			booldef: ["same",["val","foo"],["val","foo"]],
			expected: true
		},
		"for different when correct": {
			booldef: ["different",["val","foo"],["val","bar"]],
			expected: true
		},
		"for different when not correct": {
			booldef: ["different",["val","foo"],["val","foo"]],
			expected: false
		},
		"for anyat when correct": {
			state: {
				layers: {somelayer: {xyz:[{foo:"bar"}]}},
				marks: {somemark:"xyz"}
			},
			booldef: ["anyat","somelayer",["markpos","somemark"]],
			expected: true
		},
		"for anyat when not correct": {
			state: {
				layers: {somelayer: {xyz:[{foo:"bar"}]}},
				marks: {somemark:"abc"}
			},
			booldef: ["anyat","somelayer",["markpos","somemark"]],
			expected: false
		},
		"for noneat when not correct": {
			state: {
				layers: {somelayer: {xyz:[{foo:"bar"}]}},
				marks: {somemark:"xyz"}
			},
			booldef: ["noneat","somelayer",["markpos","somemark"]],
			expected: false
		},
		"for noneat when correct": {
			state: {
				layers: {somelayer: {xyz:[{foo:"bar"}]}},
				marks: {somemark:"abc"}
			},
			booldef: ["noneat","somelayer",["markpos","somemark"]],
			expected: true
		},
		"for not with false arg": {
			booldef: ["not",["morethan",["val",3],["val",7]]],
			expected: true
		},
		"for not with true arg": {
			booldef: ["not",["morethan",["val",7],["val",3]]],
			expected: false
		},
		"for performedanycommand when correct": {
			state: { steps: [{command:"yes"}]},
			booldef: ["performedanycommand"],
			expected: true
		},
		"for performedanycommand when not correct": {
			state: { steps: []},
			booldef: ["performedanycommand"],
			expected: false
		},
		"for hasperformedcommand when correct": {
			state: { steps: [{command:"foo"},{command:"somecommand"}]},
			booldef: ["hasperformedcommand","somecommand"],
			expected: true
		},
		"for hasperformedcommand when not correct": {
			state: { steps: [{command:"foo"},{command:"bar"}]},
			booldef: ["hasperformedcommand","somecommand"],
			expected: false
		},
		"for positionisinlist when correct": {
			state: {
				layers: {foolayer: {a:["X"]}},
				marks: {somemark: "a"}
			},
			booldef: ["positionisinlist",["markpos","somemark"],["allposinlayer","foolayer"]],
			expected: true
		},
		"for positionisinlist when not correct": {
			state: {
				layers: {foolayer: {a:["X"]}},
				marks: {somemark: "b"}
			},
			booldef: ["positionisinlist",["markpos","somemark"],["allposinlayer","foolayer"]],
			expected: false
		},
		"for overlaps when correct": {
			state: {
				layers: {
					somelayer: {x:"foo",y:"foo"},
					otherlayer: {z:"foo",y:"foo"}
				}
			},
			booldef: ["overlaps","somelayer","otherlayer"],
			expected: true
		},
		"for overlaps when false": {
			state: {
				layers: {
					somelayer: {x:"foo",y:"foo"},
					otherlayer: {z:"foo"}
				}
			},
			booldef: ["overlaps","somelayer","otherlayer"],
			expected: false
		}
	}
},I);
