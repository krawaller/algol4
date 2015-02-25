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
		state: {affected: [], turn: 4, data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["KILLUNIT",["IDAT",["MARKPOS","somemark"]]],
		expected: {affected: ["someid"], turn: 4, data: {units: {"someid":{foo:"muu",STATUS:"dead",AFFECTEDTURN:4}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["MOVEUNIT",["IDAT",["MARKPOS","somemark"]],["MARKPOS","othermark"]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",POS:"abc",AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: ["blah"], turn: 6, data: {units: {"someid":{foo:"bar",POS:"xyz"},"otherid":{foo:"baz",POS:"abc"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} },
		firstarg: ["SWAPUNITPOSITIONS",["IDAT",["MARKPOS","somemark"]],["IDAT",["MARKPOS","othermark"]]],
		expected: {affected: ["blah","someid","otherid"], turn: 6, data: {units: {"someid":{foo:"bar",POS:"abc",AFFECTEDTURN:6},otherid:{foo:"baz",POS:"xyz",AFFECTEDTURN:6}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} }
	},{
		state: {affected: [], turn: 7, data: {units: {"someid":{blah:"notmoo"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["SETUNITDATA",["IDAT",["MARKPOS","somemark"]],"blah",["VAL","moo"]],
		expected: {affected: ["someid"], turn: 7, data: {units: {"someid":{blah:"moo",AFFECTEDTURN:7}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {turn: 8, layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a"},B:{POS:"b"}}},context:{foo:"bar"},affected:["B"]},
		firstarg: ["FORALLIN","somelayer",["SETUNITDATA",["LOOPID"],"doomed",["VAL","yes"]]],
		expected: {turn: 8, layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a",doomed:"yes",AFFECTEDTURN:8},B:{POS:"b"}}},context:{foo:"bar"},affected:["B","A"]}
	},{
		state: {turn: 9, marks:{somemark:"a"},layers:{UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a"},B:{POS:"b"}}},context:{foo:"bar"},affected:["B"]},
		firstarg: ["MULTIEFFECT",[["SETUNITDATA",["IDAT",["MARKPOS","somemark"]],"doomed",["VAL","yes"]],["KILLUNIT",["IDAT",["MARKPOS","somemark"]]]]],
		expected: {turn: 9, marks:{somemark:"a"},layers:{UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a",doomed:"yes",STATUS:"dead",AFFECTEDTURN:9},B:{POS:"b"}}},context:{foo:"bar"},affected:["B","A"]}
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
		expected: false
	},{
		state: {context:{FOO:"bar",CURRENTPLAYER:1}},
		firstarg: {endturn:{condition:["SAME",["CONTEXTVAL","FOO"],["VAL","bar"]]},endgame:{bywuu:{condition:["TRUE"],winner:["CONTEXTVAL","CURRENTPLAYER"]}}},
		expected: ["ENDGAME","bywuu",1]
	},{
		state: {context:{FOO:"bar",CURRENTPLAYER:1}},
		firstarg: {endturn:{condition:["SAME",["CONTEXTVAL","FOO"],["VAL","bar"]],passto:["IFELSE",["SAME",["CONTEXTVAL","CURRENTPLAYER"],["VAL",1]],["VAL",2],["VAL",1]]},endgame:{bywuu:{condition:["DIFFERENT",["CONTEXTVAL","FOO"],["VAL","bar"]],winner:["CONTEXTVAL","CURRENTPLAYER"]}}},
		expected: ["PASSTO",2]
	}],
	listCommandOptions: [{
		state: {},
		firstarg: {endturn:{condition:["TRUE"]},endgame:{bypoo:{condition:["TRUE"],winner:["VAL",1]}},commands:{}},
		expected: {ENDTURN:["ENDGAME","bypoo",1]}
	},{
		state: {previousstep:"BLAH"},
		firstarg: {endturn:{condition:["FALSE"]},commands:{}},
		expected: {UNDO:["BACK","BLAH"]}
	},{
		state: {turn: 5, steps:[],marks:{somemark:"foo"},layers:{UNITS:{foo:[{id:"someid"}]}},data:{units:{someid:{pos:"foo"}}},affected:[]},
		firstarg: {endturn:{condition:["FALSE"]},commands:{mope:{condition:["TRUE"],effect:["KILLUNIT",["IDAT",["MARKPOS","somemark"]]]}}},
		expected: {mope:["NEWSTATE",{turn: 5,steps:[],marks:{somemark:"foo"},layers:{UNITS:{foo:[{id:"someid"}]}},data:{units:{someid:{pos:"foo",STATUS:"dead",AFFECTEDTURN:5}}},affected:["someid"]}]}
	}],
	performOption: [{
		state: {foo:"bar"},
		firstarg: ["BACK",{foo:"baz"}],
		expected: {foo:"baz"}
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


