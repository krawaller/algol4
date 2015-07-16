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

tester("The mark methods",Algol,{
	"getAvailableMarks(state)": {
		"when nothing strange going on": {
			state: {
				gamedef: { marks: {somemark:{fromlayer:"somelayer"},othermark:{fromlayer:"otherlayer"}} },
				layers: { somelayer: {foo:1,bar:1}, otherlayer: {baz:1,bin:1} }
			},
			context: {
				isMarkAvailable: {
					method: function(s,n){ return n === "othermark"; },
					expectedargs: [["state","somemark"],["state","othermark"]]
				}
			},
			expected: {somemark:["foo","bar"]}
		}
	},
	"removeMark(state,markname)": {
		"when nothing else affected": {
			state: {
				marks: {somemark:"foo",othermark:"bar"},
				gamedef: {marks:{somemark:{}}}
			},
			markname: "somemark",
			expected: {
				marks: {othermark:"bar"},
				gamedef: {marks:{somemark:{}}}
			}
		},
		"when we have some requiredby marks": {
			state: {
				marks: {somemark:"foo",othermark:"bar",thirdmark:"baz"},
				gamedef: {marks:{somemark:{requiredby:["thirdmark"]}}}
			},
			markname: "somemark",
			context: {
				removeMark: {
					returns: "withmarksremoved",
					expectedargs: [[{
						marks: {othermark:"bar",thirdmark:"baz"},
						gamedef: {marks:{somemark:{requiredby:["thirdmark"]}}}
					},"thirdmark"]]
				}
			},
			expected: "withmarksremoved"
		},
		"when we have some layers to be cleared": {
			state: {
				marks: {somemark:"foo",othermark:"bar"},
				gamedef: {marks:{somemark:{cleanse:["somelayer"]}}},
				layers: {somelayer:"FOO",otherlayer:"BAR"}
			},
			markname: "somemark",
			expected: {
				marks: {othermark:"bar"},
				gamedef: {marks:{somemark:{cleanse:["somelayer"]}}},
				layers: {otherlayer:"BAR"}
			}
		}
	},
	"setMark(state,markname,position)": {
		"when nothing else affected": {
			state: {
				marks: {othermark:"foo"},
				gamedef: {marks:{somemark:{}}}
			},
			markname: "somemark",
			position: "somepos",
			expected: {
				marks: {somemark:"somepos",othermark:"foo"},
				gamedef: {marks:{somemark:{}}}
			}
		},
		"when we have some notwith": {
			state: {
				marks: {othermark:"foo",thirdmark:"baz"},
				gamedef: {marks:{somemark:{notwith:["othermark"]}}}
			},
			markname: "somemark",
			position: "somepos",
			context: {
				removeMark: {
					returns: "statewithremovednotwiths",
					expectedargs: [[{
						marks: {somemark:"somepos",othermark:"foo",thirdmark:"baz"},
						gamedef: {marks:{somemark:{notwith:["othermark"]}}}
					},"othermark"]]
				}
			},
			expected: "statewithremovednotwiths"
		},
		"when we have some generators": {
			state: {
				marks: {othermark:"foo",thirdmark:"baz"},
				gamedef: { marks:{somemark:{generators:"GENERATORLIST"}} }
			},
			markname: "somemark",
			position: "somepos",
			context: {
				applyGeneratorList: {
					returns: "statewithgeneratorsran",
					expectedargs: [[{
						marks: {othermark:"foo",thirdmark:"baz",somemark:"somepos"},
						gamedef: { marks:{somemark:{generators:"GENERATORLIST"}}}
					},"GENERATORLIST"]]
				}
			},
			expected: "statewithgeneratorsran"
		}
	},
	"isMarkAvailable(state,markname)": {
		"when mark is already set": {
			state: {
				marks:{somemark:"foo"},
				gamedef:{marks:{somemark:{}}}
			},
			markname: "somemark",
			expected: "alreadyset"
		},
		"when condition fails": {
			state: {
				marks:{},
				gamedef:{
					marks: {
						somemark: {
							condition: "SOMECOND"
						}
					}
				}
			},
			markname: "somemark",
			context: {
				evaluateBoolean: {
					returns: false,
					expectedargs: [["state","SOMECOND"]]
				}
			},
			expected: "conditionnotmet"
		},
		"when layer doesn't exist": {
			state: {
				marks:{},
				gamedef:{marks:{somemark:{fromlayer:"foolayer"}}}
			},
			markname: "somemark",
			expected: "nopositions"
		},
		"when layer is empty": {
			state: {
				gamedef:{marks:{somemark:{fromlayer:"foolayer"}}},
				layers: {foolayer:{}},
				marks:{}
			},
			markname: "somemark",
			expected: "nopositions"
		},
		"when some requiredmarks are missing": {
			state: {
				gamedef:{marks:{somemark:{fromlayer:"somelayer",requiredmarks:["foomark","barmark"]}}},
				marks: {foomark:"somepos"},
				layers: {somelayer:{foo:"bar"}}
			},
			markname: "somemark",
			expected: "missingrequiredmarks"
		},
		"when there are positions and no requiredmarks or condition": {
			state: {
				marks:{},
				gamedef:{marks:{somemark:{fromlayer:"somelayer"}}},
				layers: {somelayer:{foo:"bar"}}
			},
			markname: "somemark",
			expected: undefined
		},
		"when conditions and requiredmark and positions are all met": {
			state: {
				gamedef:{marks:{somemark:{
					fromlayer:"somelayer",
					requiredmarks:["foomark"],
					condition: ["TRUE"]
				}}},
				marks: {foomark:"somepos"},
				layers: {somelayer:{foo:"bar"}}
			},
			markname: "somemark",
			expected: undefined
		}
	}
},I);



