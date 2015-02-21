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

var executetests = [{
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
}];

var availabilitytests = [{
	command: {condition:["FALSE"],analysis:{commands:{}}},
	state: {},
	available: false
}];

describe("the execute functions",function(){
	describe("the executeEffect function",function(){
		_.each(executetests,function(test){
			describe("when called with "+JSON.stringify(test.command)+" and state is "+JSON.stringify(test.state),function(){
				it("returns "+JSON.stringify(test.expected),function(){
					var result = Algol.executeEffect(I.fromJS(test.state),I.fromJS(test.command));
					expect(result.toJS()).toEqual(test.expected);
				});
			});
		});
	});
	describe("the canExecuteCommand function",function(){
		_.each(availabilitytests,function(test){
			describe("the '"+test.command+"' command when state is "+JSON.stringify(test.state),function(){
				it((test.available ? "is" : "isnt")+" available",function(){
					var result = Algol.canExecuteCommand(I.fromJS(test.state),I.fromJS(test.command));
					expect(result).toEqual(test.available);
				});
			});
		});
	});
});
