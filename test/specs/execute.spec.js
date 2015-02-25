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
	performCommandEffect: [{
		state: {affected: [], data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["KILLUNIT",["IDAT",["MARKPOS","somemark"]]],
		expected: {affected: ["someid"], data: {units: {"someid":{foo:"muu",status:"dead"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["MOVEUNIT",["IDAT",["MARKPOS","somemark"]],["MARKPOS","othermark"]],
		expected: {affected: ["someid"], data: {units: {"someid":{foo:"muu",pos:"abc"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: ["blah"], data: {units: {"someid":{foo:"bar",pos:"xyz"},"otherid":{foo:"baz",pos:"abc"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} },
		firstarg: ["SWAPUNITPOSITIONS",["IDAT",["MARKPOS","somemark"]],["IDAT",["MARKPOS","othermark"]]],
		expected: {affected: ["blah","someid","otherid"], data: {units: {"someid":{foo:"bar",pos:"abc"},otherid:{foo:"baz",pos:"xyz"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} }
	},{
		state: {affected: [], data: {units: {"someid":{blah:"notmoo"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["SETUNITDATA",["IDAT",["MARKPOS","somemark"]],"blah",["VAL","moo"]],
		expected: {affected: ["someid"], data: {units: {"someid":{blah:"moo"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{pos:"a"},B:{pos:"b"}}},context:{foo:"bar"},affected:["B"]},
		firstarg: ["FORALLIN","somelayer",["SETUNITDATA",["LOOPID"],"doomed",["VAL","yes"]],["KILLUNIT",["LOOPID"]]],
		expected: {layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{pos:"a",doomed:"yes",status:"dead"},B:{pos:"b"}}},context:{foo:"bar"},affected:["B","A"]}
	}],
	canExecuteCommand: [{
		firstarg: {condition:["TRUE"],neededmarks:[]},
		expected: true
	},{
		firstarg: {condition:["FALSE"],neededmarks:[]},
		expected: false
	},{
		state: {marks:{somemark:"xyz"}},
		firstarg: {condition:["TRUE"],neededmarks:["somemark"]},
		expected: true
	},{
		state: {marks:{someothermark:"xyz"}},
		firstarg: {condition:["TRUE"],neededmarks:["somemark"]},
		expected: false
	}],
	testPostCommandState: [{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		firstarg: {data:{c:3}},
		expected: ["BACK",{data:{c:3}}]
	},{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		firstarg: {data:{b:2}},
		expected: ["BACK",{data:{b:2}}]
	},{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		firstarg: {data:{c:666}},
		expected: ["NEWSTATE",{data:{c:666}}]
	}],
	endTurnCheck: [{
		state: {context:{FOO:"bar"}},
		firstarg: {endturn:{condition:["SAME",["CONTEXTVAL","FOO"],["VAL","notbar"]]}},
		expected: ["CANNOTEND"]
	},{
		state: {context:{FOO:"bar",CURRENTPLAYER:1}},
		firstarg: {endturn:{condition:["SAME",["CONTEXTVAL","FOO"],["VAL","bar"]]},endgame:{bywuu:{condition:["TRUE"],winner:["CONTEXTVAL","CURRENTPLAYER"]}}},
		expected: ["ENDGAME","bywuu",1]
	},{
		state: {context:{FOO:"bar",CURRENTPLAYER:1}},
		firstarg: {endturn:{condition:["SAME",["CONTEXTVAL","FOO"],["VAL","bar"]],passto:["IFELSE",["SAME",["CONTEXTVAL","CURRENTPLAYER"],["VAL",1]],["VAL",2],["VAL",1]]},endgame:{bywuu:{condition:["DIFFERENT",["CONTEXTVAL","FOO"],["VAL","bar"]],winner:["CONTEXTVAL","CURRENTPLAYER"]}}},
		expected: ["PASSTO",2]
	}]
};

describe("The execute functions",function(){
	_.each(tests,function(arr,funcname){
		describe("the "+funcname+" function",function(){
			_.each(arr,function(test){
				describe("when called with "+JSON.stringify(test.firstarg)+(test.state ? " and state is "+JSON.stringify(test.state) : ""),function(){
					it("returns "+JSON.stringify(test.expected),function(){
						var res = Algol[funcname](I.fromJS(test.state||{}),I.fromJS(test.firstarg));
						expect(res.toJS ? res.toJS() : res).toEqual(test.expected);
					});
				});
			});
		});
	});
});
