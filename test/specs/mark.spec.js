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
				gamedef: { marks: {
					somemark:{fromlayer:"somelayer"},
					othermark:{fromlayer:"otherlayer"},
					sillymark:{from:"somelayer"}
				} },
				layers: { somelayer: {foo:1,bar:1}, otherlayer: {baz:1,bin:1} }
			},
			context: {
				isMarkAvailable: {
					method: function(s,n){ return n === "sillymark"; },
					expectedargs: [["@state","somemark"],["@state","othermark"],["@state","sillymark"]]
				}
			},
			expected: {foo:"somemark",bar:"somemark",baz:"othermark",bin:"othermark"}
		}
	},
	"removeMark(state,markname)": {
		"when nothing else affected": {
			state: {
				marks: {somemark:"foo",othermark:"bar"},
				gamedef: {marks:{somemark:{}}},
				marksat: {foo:"somemark",bar:"othermark"}
			},
			markname: "somemark",
			expected: {
				marks: {othermark:"bar"},
				gamedef: {marks:{somemark:{}}},
				marksat: {bar:"othermark"}
			}
		},
		"when we have some requiredby marks": {
			state: {
				marks: {somemark:"foo",othermark:"bar",thirdmark:"baz"},
				gamedef: {marks:{somemark:{requiredby:["thirdmark"]}}},
				marksat: {foo:"somemark",bar:"othermark",baz:"thirdmark"}
			},
			markname: "somemark",
			context: {
				removeMark: {
					returns: "withmarksremoved",
					expectedargs: [[{
						marks: {othermark:"bar",thirdmark:"baz"},
						marksat: {bar:"othermark",baz:"thirdmark"},
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
				layers: {somelayer:"FOO",otherlayer:"BAR"},
				marksat: {foo:"somemark",bar:"othermark"}
			},
			markname: "somemark",
			expected: {
				marks: {othermark:"bar"},
				gamedef: {marks:{somemark:{cleanse:["somelayer"]}}},
				layers: {otherlayer:"BAR"},
				marksat: {bar:"othermark"}
			}
		}
	},
	"setMark(state,markname,position)": {
		"when nothing else affected": {
			state: {
				marks: {othermark:"foo"},
				gamedef: {marks:{somemark:{}}},
				marksat: {foo:"othermark"}
			},
			markname: "somemark",
			position: "somepos",
			expected: {
				marks: {somemark:"somepos",othermark:"foo"},
				gamedef: {marks:{somemark:{}}},
				marksat: {foo:"othermark",somepos:"somemark"}
			}
		},
		"when we have some notwith": {
			state: {
				marks: {othermark:"foo",thirdmark:"baz"},
				gamedef: {marks:{somemark:{notwith:["othermark"]}}},
				marksat: {foo:"othermark",baz:"thirdmark"}
			},
			markname: "somemark",
			position: "somepos",
			context: {
				removeMark: {
					returnsarg: 0,
					expectedargs: [[{
						marks: {somemark:"somepos",othermark:"foo",thirdmark:"baz"},
						gamedef: {marks:{somemark:{notwith:["othermark"]}}},
						marksat: {somepos:"somemark",foo:"othermark",baz:"thirdmark"}
					},"othermark"]]
				}
			},
			expected: {
				marks: {somemark:"somepos",othermark:"foo",thirdmark:"baz"},
				gamedef: {marks:{somemark:{notwith:["othermark"]}}},
				marksat: {somepos:"somemark",foo:"othermark",baz:"thirdmark"}
			}
		},
		"when we have some generators": {
			state: {
				marks: {othermark:"foo",thirdmark:"baz"},
				marksat: {foo:"othermark",baz:"thirdmark"},
				gamedef: { marks:{somemark:{rungenerators:"GENERATorLisT"}} }
			},
			markname: "somemark",
			position: "somepos",
			context: {
				applyGeneratorList: {
					returns: "statewithgeneratorsran",
					expectedargs: [[{
						marks: {othermark:"foo",thirdmark:"baz",somemark:"somepos"},
						gamedef: { marks:{somemark:{rungenerators:"GENERATorLisT"}}},
						marksat: {somepos:"somemark",foo:"othermark",baz:"thirdmark"}
					},"GENERATorLisT"]]
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
					expectedargs: [["@state","SOMECOND"]]
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
					condition: ["true"]
				}}},
				marks: {foomark:"somepos"},
				layers: {somelayer:{foo:"bar"}}
			},
			markname: "somemark",
			expected: undefined
		}
	},
	"newMarksAfterCommand(state,commanddef)": {
		"when has def": {
			state: "STATE",
			commanddef: {setmarks:{
				foo: "FOOPOS",
				bar: "BARPOS"
			}},
			expected: { foo: "1st", bar: "2nd" },
			context: {
				evaluatePosition: {
					returnseries: ["1st","2nd"],
					expectedargs: [["@state","FOOPOS"],["@state","BARPOS"]]
				}
			}
		},
		"when no def": {
			commanddef: {},
			expected: {}
		}
	}
},I);



