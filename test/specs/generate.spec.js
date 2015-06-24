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

tester("the generate methods",Algol,{
	"applyFilter(state,filterdef)": {
		"for just matching": {
			state: {
				layers: {
					badorks: {xxx:"X",b:["MOO"]},
					muppets: {a:[{foo:"bar"}],b:[{foo:"baz"},{foo:"bin"}]}
				},
				context:{forbidden:"baz"}
			},
			filterdef: {
				layer: "muppets",
				matching: {foo:["ISNT",["CONTEXTVAL","forbidden"]]},
				tolayer:["IFELSE",
					["SAME",["LOOKUP","muppets",["CONTEXTPOS","START"],"foo"],["VAL","bar"]],
					["VAL","knorks"],
					["VAL","badorks"]
				]
			},
			expected: {
				layers: {
					knorks: {a: [{foo:"bar"}]},
					badorks: {b:["MOO",{foo:"bin"}],xxx:"X"},
					muppets: {a:[{foo:"bar"}],b:[{foo:"baz"},{foo:"bin"}]}
				},
				context:{forbidden:"baz"}
			}
		},
		"for matching and conditioning": {
			state: {
				layers: {
					foos:{b:"X"},
					muppets:{a:[{foo:"bar"}],b:[{foo:"bar"},{foo:"notbar"}]}
				},
				context:{shouldbe:"bar"}
			},
			filterdef: {
				layer: "muppets",
				matching: {foo:["IS",["CONTEXTVAL","shouldbe"]]},
				tolayer: ["VAL","knorks"],
				condition: ["ANYAT","foos",["CONTEXTPOS","START"]]
			},
			expected: {
				layers: {
					foos:{b:"X"},
					knorks: {b: [{foo:"bar"}]},
					muppets: {a:[{foo:"bar"}],b:[{foo:"bar"},{foo:"notbar"}]}
				},
				context:{shouldbe:"bar"}
			}
		}
	},
	"generateNeighbourPods(state,nexttodef)": {
		"for many starts": {
			state: {
				context:{something:"other"},
				connections:{foo:{nextto:{4:"baz",6:"bin"}},foo2:{nextto:{5:"bin",6:"buh"}}}
			},
			nexttodef: {starts:"STARTSDEF",dirs:"DIRSDEF"},
			expected: {
				start: {
					foo: [{START:"foo",NEIGHBOURS:2}],
					foo2:[{START:"foo2",NEIGHBOURS:2}]
				},
				target: {
					baz:[{START:"foo",TARGET:"baz",DIR:4,NEIGHBOURS:2}],
					bin:[{START:"foo",TARGET:"bin",DIR:6,NEIGHBOURS:2},{START:"foo2",TARGET:"bin",DIR:5,NEIGHBOURS:2}],
					buh:[{START:"foo2",TARGET:"buh",DIR:6,NEIGHBOURS:2}]
				}
			},
			context: {
				evaluatePositionList: {
					returns: ["foo","foo2"],
					expectedargs: [["state","STARTSDEF"]]
				},
				evaluateDirList: {
					returns: [4,5,6],
					expectedargs: [
						[{
							context:{START:"foo",something:"other"},
							connections:{foo:{nextto:{4:"baz",6:"bin"}},foo2:{nextto:{5:"bin",6:"buh"}}}
						},"DIRSDEF"],
						[{
							context:{START:"foo2",something:"other"},
							connections:{foo:{nextto:{4:"baz",6:"bin"}},foo2:{nextto:{5:"bin",6:"buh"}}}
						},"DIRSDEF"]
					]
				}
			}
		}
	},
	"generateWalkerPods(state,walkerdef)": {
		"when goes out of bounds": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{4:"lonestep"}},lonestep:{nextto:{}}}
			},
			walkerdef: {
				starts: ["MARKPOS","somemark"],
				dirs: ["RELATIVEDIRS",["DIRS",[1]],["VAL",4]]
			},
			expected: {
				start: {S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}] },
				step: {lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]},
				all: {
					S: [{START:"S",DIR:4,STEPS:1,STOPREASON:"OUTOFBOUNDS"}],
					lonestep:[{START:"S",TARGET:"lonestep",DIR:4,STEPS:1,STEP:1,STOPREASON:"OUTOFBOUNDS"}]
				}
			}
		},
		"when reaches max": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{5:"step1"}},
				step1: {nextto:{5:"step2"}}}
			},
			walkerdef: {
				starts: ["MARKPOS","somemark"],
				dirs: ["DIRS",[5]],
				max: 1
			},
			expected: {
				start: {S: [{START:"S",DIR:5,STEPS:1,STOPREASON:"REACHEDMAX"}] },
				step: {step1:[{START:"S",TARGET:"step1",DIR:5,STEPS:1,STEP:1,STOPREASON:"REACHEDMAX"}]},
				all: {
					S: [{START:"S",DIR:5,STEPS:1,STOPREASON:"REACHEDMAX"}],
					step1:[{START:"S",TARGET:"step1",DIR:5,STEPS:1,STEP:1,STOPREASON:"REACHEDMAX"}]
				}
			}
		},
		"when run out of steps": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{6:"step1"}},step1:{nextto:{6:"step2"}}},
				layers: {pads: {step1:"X"}}
			},
			walkerdef: {
				starts: ["MARKPOS","somemark"],
				dirs: ["DIRS",[6]],
				steps: ["ALLPOSINLAYER","pads"]
			},
			expected: {
				start: {S: [{START:"S",DIR:6,STEPS:1,STOPREASON:"NOMORESTEPS"}] },
				step: {step1:[{START:"S",TARGET:"step1",DIR:6,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}]},
				all: {
					S: [{START:"S",DIR:6,STEPS:1,STOPREASON:"NOMORESTEPS"}],
					step1:[{START:"S",TARGET:"step1",DIR:6,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}]
				}
			}
		},
		"when hit a block": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{7:"step1"}},step1:{nextto:{7:"step2"}}},
				layers: {blocks: {step2:"X"}}
			},
			walkerdef: {
				starts: ["MARKPOS","somemark"],
				dirs: ["DIRS",[7]],
				blocks: ["ALLPOSINLAYER","blocks"]
			},
			expected: {
				start: {S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}]},
				step: {step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}]},
				block: {step2:[{START:"S",TARGET:"step2",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}]},
				all: {
					S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}],
					step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}],
					step2:[{START:"S",TARGET:"step2",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}]
				}
			}
		},
		"when hit block AND ran out of steps": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{7:"step1"}},step1:{nextto:{7:"step2"}}},
				layers: {blocks: {step2:"X"}, "pads": {"step1":"X"}}
			},
			walkerdef: {
				starts: ["MARKPOS","somemark"],
				dirs: ["DIRS",[7]],
				steps: ["ALLPOSINLAYER","pads"],
				blocks: ["ALLPOSINLAYER","blocks"]
			},
			expected: {
				start: {S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"NOMORESTEPS"}] },
				step: {step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}]},
				all: {
					S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"NOMORESTEPS"}],
					step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"NOMORESTEPS"}],
				}
			}	
		},
		"when hit block AND ran out of steps AND prioritizing blocks": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{7:"step1"}},step1:{nextto:{7:"step2"}}},
				layers: {blocks: {step2:"X"}, "pads": {"step1":"X"}}
			},
			walkerdef: {
				starts: ["MARKPOS","somemark"],
				dirs: ["DIRS",[7]],
				steps: ["ALLPOSINLAYER","pads"],
				blocks: ["ALLPOSINLAYER","blocks"],
				prioritizeblocksoversteps: true
			},
			expected: {
				start: {S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}] },
				step: {step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}]},
				block: {step2:[{START:"S",TARGET:"step2",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}]},
				all: {
					S: [{START:"S",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}],
					step1:[{START:"S",TARGET:"step1",DIR:7,STEPS:1,STEP:1,STOPREASON:"HITBLOCK"}],
					step2:[{START:"S",TARGET:"step2",DIR:7,STEPS:1,STOPREASON:"HITBLOCK"}]
				}
			}	
		}
	},
	"paintSeedPod(state,painter,pod)": {
		"with condition and include": {
			state: {
				layers: {somelayer: {xyz:"X"}, newlayer: {toot:"X"}},
				context: {poo:"foo"}
			},
			painter: {
				condition:["ANYAT","somelayer",["CONTEXTPOS","TARGET"]],
				tolayer: ["VAL","newlayer"],
				include: {myfoo:["CONTEXTVAL","FOO"]}
			},
			pod: {
				abc: [{FOO:"BAR",TARGET:"abc"}],
				xyz: [{FOO:"BAZ",TARGET:"xyz"},{FOO:"BIN",TARGET:"xyz"}]
			},
			expected: {
				layers: {
					somelayer: {xyz:"X"},
					newlayer: {toot:"X",xyz:[{myfoo:"BAZ"},{myfoo:"BIN"}]}
				},
				context:{poo:"foo"}
			}
		},
		"with ifelse target layer": {
			state: {
				layers: {newlayer: {toot:"X"}},
				context:{}
			},
			painter: {
				tolayer: ["IFELSE",
					["SAME",["CONTEXTVAL","FOO"],["VAL","x1"]],
					["VAL","newlayer"],
					["VAL","otherlayer"]
				]
			},
			pod: {abc: [{FOO:"x1"},{FOO:"x2"}]},
			expected: {
				layers: {
					newlayer: {toot:"X",abc:[{}]},
					otherlayer: {abc:[{}]}},
				context:{}
			},
		}
	},
	"paintSeedPods(state,draw,pods)": {
		"with two painters": {
			state: {layers: {}, context: {poo:"foo"}},
			draw: {
				FLUM: {
					tolayer: ["VAL","newlayer"],
					include: {myfoo:["CONTEXTVAL","FOO"]}
				},
				HUM: {
					tolayer: ["VAL","newlayer"],
					include: {mybar:["CONTEXTVAL","BAR"]}
				}
			},
			pods: {
				FLUM: {
					abc: [{FOO:"BAR",TARGET:"abc"}],
					xyz: [{FOO:"BAZ",TARGET:"xyz"},{FOO:"BIN",TARGET:"xyz"}]
				},
				HUM: {xyz:[{BAR:"BOO",TARGET:"def"}]},
				KKK: {moo:[{FOO:"HOOOO",TARGET:"moo"}]}
			},
			expected: {
				layers: {
					newlayer: {
						abc: [{myfoo:"BAR"}],
						xyz:[{myfoo:"BAZ"},{myfoo:"BIN"},{mybar:"BOO"}]
					}
				},
				context:{poo:"foo"}}
		}
	},
	"applyGenerator(state,gendef)": {
		"when lacking neededmarks": {
			state: {marks:{}},
			gendef: {neededmarks:["foo"]},
			expected: {marks:{}}
		},
		"when running nextto which is applicable": {
			state: {
				marks:{foo:"bar"},
				connections:{bar:{nextto:{1:"bar2"}}},
				context:{blaj:"paj"}
			},
			gendef: {
				neededmarks:["foo"],
				type:"nextto",
				starts:["MARKPOS","foo"],
				dirs:["DIRS",[1]],
				draw:{
					target:{
						tolayer:["VAL","newlayer"],
						include:{prop:["VAL","snopp"]}
					}
				}
			},
			expected: {
				marks:{foo:"bar"},
				connections:{bar:{nextto:{1:"bar2"}}},
				layers:{newlayer:{bar2:[{prop:"snopp"}]}},
				context:{blaj:"paj"}
			}
		}
	},
	"applyGeneratorList(state,list)": {
		"for list": {
			state: {
				marks:{foo:"bar"},
				connections:{bar:{nextto:{1:"bar2"}}},
				context:{blaj:"paj"},
				gamedef:{
					generators:{
						somegen:{
							neededmarks:["foo"],
							type:"nextto",
							starts:["MARKPOS","foo"],
							dirs:["DIRS",[1]],
							draw:{
								target:{
									tolayer:["VAL","newlayer"],
									include:{prop:["VAL","snopp"]}
								}
							}
						}
					}
				}
			},
			list: ["somegen"],
			expected: {
				marks:{foo:"bar"},
				connections:{bar:{nextto:{1:"bar2"}}},
				layers:{newlayer:{bar2:[{prop:"snopp"}]}},
				context:{blaj:"paj"},
				gamedef:{
					generators:{
						somegen:{
							neededmarks:["foo"],
							type:"nextto",
							starts:["MARKPOS","foo"],
							dirs:["DIRS",[1]],
							draw:{
								target:{
									tolayer:["VAL","newlayer"],
									include:{prop:["VAL","snopp"]}
								}
							}
						}
					}
				}
			}
		},
		"with faked contexts": {
			"state": {"gamedef":{"generators":{"gen1":"gen1def","gen2":"gen2def"}}},
			"list": ["gen1","gen2"],
			"expected": {
				"gamedef": {"generators":{"gen1":"gen1def","gen2":"gen2def"}},
				"gen1def": true,
				"gen2def": true,
			},
			"context": {
				"applyGenerator": {
					"method": function(s,d){ return s.set(d,true); },
					"expectedargs": [
						[{"gamedef":{"generators":{"gen1":"gen1def","gen2":"gen2def"}}},"gen1def"],
						[{"gamedef":{"generators":{"gen1":"gen1def","gen2":"gen2def"}},"gen1def":true},"gen2def"]
					]
				}
			}
		}
	}
},I);

