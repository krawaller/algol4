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
				matching: {foo:["isnt",["contextval","forbidden"]]},
				tolayer:["ifelse",
					["same",["lookup","muppets",["contextpos","start"],"foo"],["val","bar"]],
					["val","knorks"],
					["val","badorks"]
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
				matching: {foo:["is",["contextval","shouldbe"]]},
				tolayer: ["val","knorks"],
				condition: ["anyat","foos",["contextpos","start"]]
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
					foo: [{start:"foo",neighbourcount:2}],
					foo2:[{start:"foo2",neighbourcount:2}]
				},
				target: {
					baz:[{start:"foo",target:"baz",dir:4,neighbourcount:2}],
					bin:[{start:"foo",target:"bin",dir:6,neighbourcount:2},{start:"foo2",target:"bin",dir:5,neighbourcount:2}],
					buh:[{start:"foo2",target:"buh",dir:6,neighbourcount:2}]
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
							context:{start:"foo",something:"other"},
							connections:{foo:{nextto:{4:"baz",6:"bin"}},foo2:{nextto:{5:"bin",6:"buh"}}}
						},"DIRSDEF"],
						[{
							context:{start:"foo2",something:"other"},
							connections:{foo:{nextto:{4:"baz",6:"bin"}},foo2:{nextto:{5:"bin",6:"buh"}}}
						},"DIRSDEF"]
					]
				}
			}
		},
		"for condition": {
			state: {
				context:{something:"other"},
				connections:{foo:{nextto:{4:"baz",6:"bin"}}}
			},
			nexttodef: {starts:"STARTSDEF",dirs:"DIRSDEF",condition:"COND"},
			expected: {
				start: {
					foo: [{start:"foo",neighbourcount:1}]
				},
				target: {
					bin:[{start:"foo",target:"bin",dir:6,neighbourcount:1}],
				}
			},
			context: {
				evaluatePositionList: {
					returns: ["foo"],
					expectedargs: [["state","STARTSDEF"]]
				},
				evaluateDirList: {
					returns: [4,6],
					expectedargs: [
						[{
							context:{start:"foo",something:"other"},
							connections:{foo:{nextto:{4:"baz",6:"bin"}}}
						},"DIRSDEF"]
					]
				},
				evaluateBoolean: {
					returnseries: [false,true],
					expectedargs: [
						[{
							context:{something:"other",target:"baz"},
							connections:{foo:{nextto:{4:"baz",6:"bin"}}}
						},"COND"],
						[{
							context:{something:"other",target:"bin"},
							connections:{foo:{nextto:{4:"baz",6:"bin"}}}
						},"COND"]
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
				starts: ["markpos","somemark"],
				dirs: ["relativedirs",["dirs",[1]],["val",4]]
			},
			expected: {
				start: {S: [{start:"S",dir:4,linelength:1,stopreason:"outofbounds"}] },
				step: {lonestep:[{start:"S",target:"lonestep",dir:4,linelength:1,step:1,stopreason:"outofbounds"}]},
				all: {
					S: [{start:"S",dir:4,linelength:1,stopreason:"outofbounds"}],
					lonestep:[{start:"S",target:"lonestep",dir:4,linelength:1,step:1,stopreason:"outofbounds"}]
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
				starts: ["markpos","somemark"],
				dirs: ["dirs",[5]],
				max: 1
			},
			expected: {
				start: {S: [{start:"S",dir:5,linelength:1,stopreason:"reachedmax"}] },
				step: {step1:[{start:"S",target:"step1",dir:5,linelength:1,step:1,stopreason:"reachedmax"}]},
				all: {
					S: [{start:"S",dir:5,linelength:1,stopreason:"reachedmax"}],
					step1:[{start:"S",target:"step1",dir:5,linelength:1,step:1,stopreason:"reachedmax"}]
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
				starts: ["markpos","somemark"],
				dirs: ["dirs",[6]],
				steps: ["allposinlayer","pads"]
			},
			expected: {
				start: {S: [{start:"S",dir:6,linelength:1,stopreason:"nomoresteps"}] },
				step: {step1:[{start:"S",target:"step1",dir:6,linelength:1,step:1,stopreason:"nomoresteps"}]},
				all: {
					S: [{start:"S",dir:6,linelength:1,stopreason:"nomoresteps"}],
					step1:[{start:"S",target:"step1",dir:6,linelength:1,step:1,stopreason:"nomoresteps"}]
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
				starts: ["markpos","somemark"],
				dirs: ["dirs",[7]],
				blocks: ["allposinlayer","blocks"]
			},
			expected: {
				start: {S: [{start:"S",dir:7,linelength:1,stopreason:"hitblock"}]},
				step: {step1:[{start:"S",target:"step1",dir:7,linelength:1,step:1,stopreason:"hitblock"}]},
				block: {step2:[{start:"S",target:"step2",dir:7,linelength:1,stopreason:"hitblock"}]},
				all: {
					S: [{start:"S",dir:7,linelength:1,stopreason:"hitblock"}],
					step1:[{start:"S",target:"step1",dir:7,linelength:1,step:1,stopreason:"hitblock"}],
					step2:[{start:"S",target:"step2",dir:7,linelength:1,stopreason:"hitblock"}]
				}
			}
		},
		"when hit block and ran out of steps": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{7:"step1"}},step1:{nextto:{7:"step2"}}},
				layers: {blocks: {step2:"X"}, "pads": {"step1":"X"}}
			},
			walkerdef: {
				starts: ["markpos","somemark"],
				dirs: ["dirs",[7]],
				steps: ["allposinlayer","pads"],
				blocks: ["allposinlayer","blocks"]
			},
			expected: {
				start: {S: [{start:"S",dir:7,linelength:1,stopreason:"nomoresteps"}] },
				step: {step1:[{start:"S",target:"step1",dir:7,linelength:1,step:1,stopreason:"nomoresteps"}]},
				all: {
					S: [{start:"S",dir:7,linelength:1,stopreason:"nomoresteps"}],
					step1:[{start:"S",target:"step1",dir:7,linelength:1,step:1,stopreason:"nomoresteps"}],
				}
			}	
		},
		"when hit block and ran out of steps and prioritizing blocks": {
			state: {
				marks: {somemark:"S"},
				connections: {S:{nextto:{7:"step1"}},step1:{nextto:{7:"step2"}}},
				layers: {blocks: {step2:"X"}, "pads": {"step1":"X"}}
			},
			walkerdef: {
				starts: ["markpos","somemark"],
				dirs: ["dirs",[7]],
				steps: ["allposinlayer","pads"],
				blocks: ["allposinlayer","blocks"],
				prioritizeblocksoversteps: true
			},
			expected: {
				start: {S: [{start:"S",dir:7,linelength:1,stopreason:"hitblock"}] },
				step: {step1:[{start:"S",target:"step1",dir:7,linelength:1,step:1,stopreason:"hitblock"}]},
				block: {step2:[{start:"S",target:"step2",dir:7,linelength:1,stopreason:"hitblock"}]},
				all: {
					S: [{start:"S",dir:7,linelength:1,stopreason:"hitblock"}],
					step1:[{start:"S",target:"step1",dir:7,linelength:1,step:1,stopreason:"hitblock"}],
					step2:[{start:"S",target:"step2",dir:7,linelength:1,stopreason:"hitblock"}]
				}
			}	
		}
	},
	"paintSeedPod(state,painter,pod)": {
		"with entities owned by currentplayer": {
			state: {
				layers: {
					kings: {xyz:["X"]}
				},
				context: {poo:"foo",currentplayer:1}
			},
			painter: {
				tolayer: "kings",
				include: {owner:1}
			},
			pod: {
				xyz: [{FOO:"BIN",target:"xyz"}]
			},
			expected: {
				layers: {
					kings: {
						xyz: ["X",{owner:1,pos:"xyz"}],
					},
					mykings: {
						xyz: [{owner:1,pos:"xyz"}]
					}
				},
				context: {poo:"foo",currentplayer:1}
			}
		},
		"with condition and include": {
			state: {
				layers: {somelayer: {xyz:"X"}, newlayer: {toot:"X"}},
				context: {poo:"foo"}
			},
			painter: {
				condition:["anyat","somelayer",["contextpos","target"]],
				tolayer: "newlayer",
				include: {myfoo:["contextval","FOO"]}
			},
			pod: {
				abc: [{FOO:"BAR",target:"abc"}],
				xyz: [{FOO:"BAZ",target:"xyz"},{FOO:"BIN",target:"xyz"}]
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
				tolayer: ["ifelse",
					["same",["contextval","FOO"],["val","x1"]],
					["val","newlayer"],
					["val","otherlayer"]
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
					tolayer: ["val","newlayer"],
					include: {myfoo:["contextval","FOO"]}
				},
				HUM: {
					tolayer: ["val","newlayer"],
					include: {mybar:["contextval","BAR"]}
				}
			},
			pods: {
				FLUM: {
					abc: [{FOO:"BAR",target:"abc"}],
					xyz: [{FOO:"BAZ",target:"xyz"},{FOO:"BIN",target:"xyz"}]
				},
				HUM: {xyz:[{BAR:"BOO",target:"def"}]},
				KKK: {moo:[{FOO:"HOOOO",target:"moo"}]}
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
				layers:{},
				marks:{foo:"bar"},
				connections:{bar:{nextto:{1:"bar2"}}},
				context:{blaj:"paj"}
			},
			gendef: {
				neededmarks:["foo"],
				type:"nextto",
				starts:["markpos","foo"],
				dirs:["dirs",[1]],
				draw:{
					target:{
						tolayer:"newlayer",
						include:{prop:["val","snopp"]}
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
				layers:{},
				marks:{foo:"bar"},
				connections:{bar:{nextto:{1:"bar2"}}},
				context:{blaj:"paj"},
				gamedef:{
					generators:{
						somegen:{
							neededmarks:["foo"],
							type:"nextto",
							starts:["markpos","foo"],
							dirs:["dirs",[1]],
							draw:{
								target:{
									tolayer:["val","newlayer"],
									include:{prop:["val","snopp"]}
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
							starts:["markpos","foo"],
							dirs:["dirs",[1]],
							draw:{
								target:{
									tolayer:["val","newlayer"],
									include:{prop:["val","snopp"]}
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

