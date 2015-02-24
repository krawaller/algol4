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
	executeEffect: [{
		command: ["KILLUNIT",["IDAT",["MARKPOS","somemark"]]],
		state: {affected: [], data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		expected: {affected: ["someid"], data: {units: {"someid":{foo:"muu",status:"dead"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		command: ["MOVEUNIT",["IDAT",["MARKPOS","somemark"]],["MARKPOS","othermark"]],
		state: {affected: [], data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		expected: {affected: ["someid"], data: {units: {"someid":{foo:"muu",pos:"abc"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		command: ["SWAPUNITPOSITIONS",["IDAT",["MARKPOS","somemark"]],["IDAT",["MARKPOS","othermark"]]],
		state: {affected: ["blah"], data: {units: {"someid":{foo:"bar",pos:"xyz"},"otherid":{foo:"baz",pos:"abc"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} },
		expected: {affected: ["blah","someid","otherid"], data: {units: {"someid":{foo:"bar",pos:"abc"},otherid:{foo:"baz",pos:"xyz"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}], "abc":[{id:"otherid"}]}} }
	},{
		command: ["SETUNITDATA",["IDAT",["MARKPOS","somemark"]],"blah",["VAL","moo"]],
		state: {affected: [], data: {units: {"someid":{blah:"notmoo"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		expected: {affected: ["someid"], data: {units: {"someid":{blah:"moo"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		command: ["FORALLIN","somelayer",["SETUNITDATA",["LOOPID"],"doomed",["VAL","yes"]],["KILLUNIT",["LOOPID"]]],
		state: {layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{pos:"a"},B:{pos:"b"}}},context:{foo:"bar"},affected:["B"]},
		expected: {layers:{somelayer:{a:"X"},UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{pos:"a",doomed:"yes",status:"dead"},B:{pos:"b"}}},context:{foo:"bar"},affected:["B","A"]}
	}],
	canExecuteCommand: [{
		command: {condition:["TRUE"],neededmarks:[]},
		expected: true
	},{
		command: {condition:["FALSE"],neededmarks:[]},
		expected: false
	},{
		command: {condition:["TRUE"],neededmarks:["somemark"]},
		state: {marks:{somemark:"xyz"}},
		expected: true
	},{
		command: {condition:["TRUE"],neededmarks:["somemark"]},
		state: {marks:{someothermark:"xyz"}},
		expected: false
	}],
	testPostCommandState: [{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		command: {data:{c:3}},
		expected: ["BACK",2]
	},{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		command: {data:{b:2}},
		expected: ["BACK",1]
	},{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		command: {data:{c:666}},
		expected: ["NEWSTATE"]
	}]
};

describe("The execute functions",function(){
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
