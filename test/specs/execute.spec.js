/* jshint jasmine: true */

if (typeof require === 'function' && typeof module === 'object') {
	var sinon = require('sinon'),
		jasmineSinon = require('jasmine-sinon'),
		Algol = require("../../src/"),
		_ = require("../../src/lodashmixins"),
		I = require("../../src/immutableextensions");
} else {
	var I = window.Immutable, _ = window._;
	var sinon = window.sinon;
}

var tests = {
	applyEffect: [{
		state: {affected: [], turn: 4, data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["KILLUNIT",["IDAT",["MARKPOS","somemark"]]],
		expected: {affected: ["someid"], turn: 4, data: {units: {"someid":{foo:"muu",STATUS:"DEAD",AFFECTEDTURN:4}}}, marks: {somemark:"xyz"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu"}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["MOVEUNIT",["IDAT",["MARKPOS","somemark"]],["MARKPOS","othermark"]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",POS:"abc",AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu",DIR:3}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["TURNUNIT",["IDAT",["MARKPOS","somemark"]],["VAL",2]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",DIR:5,AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu",DIR:1}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["TURNUNIT",["IDAT",["MARKPOS","somemark"]],["VAL",-3]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",DIR:6,AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
	},{
		state: {affected: [], turn: 5, data: {units: {"someid":{foo:"muu",DIR:7}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
		firstarg: ["TURNUNIT",["IDAT",["MARKPOS","somemark"]],["VAL",4]],
		expected: {affected: ["someid"], turn: 5, data: {units: {"someid":{foo:"muu",DIR:3,AFFECTEDTURN:5}}}, marks: {somemark:"xyz",othermark:"abc"}, layers: {"UNITS": {"xyz": [{id:"someid"}]}} },
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
		expected: {turn: 9, marks:{somemark:"a"},layers:{UNITS:{a:[{id:"A"}],b:[{id:"B"}]}},data:{units:{A:{POS:"a",doomed:"yes",STATUS:"DEAD",AFFECTEDTURN:9},B:{POS:"b"}}},context:{foo:"bar"},affected:["B","A"]}
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
	calculateCommandResult: [{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		firstarg: {data:{c:3}},
		expected: ["BACK",{steps:[],data:{c:3}}]
	},{
		state: {steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}},
		firstarg: {data:{b:2}},
		expected: ["BACK",{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}}]
	},{
		state: {marks:{mark1:"foo",mark2:"bar"},steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}},context:{PERFORMEDSTEPS:4}},
		firstarg: {data:{c:666},steps:["foo"]},
		secondarg: {name:"somecommand",neededmarks:["mark1"]},
		expected: ["NEWSTEP",{marks:{},data:{c:666},steps:["foo",{command:"somecommand",marks:{mark1:"foo"}}],previousstep: {marks:{mark1:"foo",mark2:"bar"},steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}},context:{PERFORMEDSTEPS:4}},context:{PERFORMEDSTEPS:5} }]
	},{
		state: {marks:{mark1:"foo",mark2:"bar"},steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}},context:{PERFORMEDSTEPS:4}},
		firstarg: {data:{c:666},steps:["foo"]},
		secondarg: {name:"somecommand",neededmarks:["mark1"],setmarks:{mark1:["VAL","somepos"]}},
		expected: ["NEWSTEP",{marks:{mark1:"somepos"},data:{c:666},steps:["foo",{command:"somecommand",marks:{mark1:"foo"}}],previousstep: {marks:{mark1:"foo",mark2:"bar"},steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}},context:{PERFORMEDSTEPS:4}},context:{PERFORMEDSTEPS:5} }]
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
		state: {turn: 5, steps:[],marks:{somemark:"foo"},layers:{UNITS:{foo:[{id:"someid"}]}},data:{units:{someid:{pos:"foo"}}},affected:[],context:{PERFORMEDSTEPS:5}},
		firstarg: {endturn:{condition:["FALSE"]},commands:{mope:{condition:["TRUE"],neededmarks:[],name:"mope",effect:["KILLUNIT",["IDAT",["MARKPOS","somemark"]]]}}},
		expected: {mope:["NEWSTEP",{turn: 5,steps:[{command:"mope",marks:{}}],marks:{},layers:{UNITS:{foo:[{id:"someid"}]}},data:{units:{someid:{pos:"foo",STATUS:"DEAD",AFFECTEDTURN:5}}},affected:["someid"],previousstep:{turn: 5, steps:[],marks:{somemark:"foo"},layers:{UNITS:{foo:[{id:"someid"}]}},data:{units:{someid:{pos:"foo"}}},affected:[],context:{PERFORMEDSTEPS:5}},context:{PERFORMEDSTEPS:6}}]}
	}],
	performOption: [{
		state: {foo:"bar"},
		firstarg: ["BACK",{foo:"baz"}],
		expected: {foo:"baz"}
	},{
		state: {turn: 6, foo: "bar"},
		firstarg: ["PASSTO",3],
		beforehydration: {marks: {}, affected: [], previousstep: {turn: 6, foo: "bar"}, previousturn: {turn: 6, foo: "bar"}, steps: [], turn: 7, player: 3, status: "ONGOING", foo: "bar", context: {CURRENTPLAYER: 3,PERFORMEDSTEPS:0}},
		expected: "FOO",
		context: {
			hydrateState: {
				method: function(s){ return "FOO"; },
				expectedargs: [ ["beforehydration"] ]
			}
		}
	},{
		state: {foo:"bar"},
		firstarg: ["ENDGAME","somecond",2],
		expected: {foo:"bar",status:"somecond", player:2}
	},{
		state: {foo:"bar"},
		firstarg: ["NEWSTEP",{some:"other"}],
		expected: {some:"other"}
	}]
};


describe("The execute functions",function(){
	_.each(tests,function(arr,funcname){
		describe("the "+funcname+" function",function(){
			_.each(arr,function(test){
				describe("when called with "+JSON.stringify(test.firstarg)+(test.state ? " and state is "+JSON.stringify(test.state) : ""),function(){
					var result;
					beforeEach(function(){
						_.each(test.context||{},function(stubdef,stubname){
							sinon.stub(Algol,stubname,stubdef.method);
						});
						result = Algol[funcname](I.fromJS(test.state||{}),I.fromJS(test.firstarg),test.secondarg && I.fromJS(test.secondarg));
					});
					it("returns "+JSON.stringify(test.expected),function(){
						expect(result.toJS ? result.toJS() : result).toEqual(test.expected);
					});
					if (test.context){
						describe("the dependency usage",function(){
							_.each(test.context||{},function(stubdef,stubname){
								it("called "+stubname+" correctly",function(){
									expect(Algol[stubname].callCount).toEqual(stubdef.expectedargs.length);
									_.each(stubdef.expectedargs,function(args,n){
										console.log("what is callcount",Algol[stubname].callCount);
										if (Algol[stubname].callCount>n) {
											var usedargs = I.List(Algol[stubname].getCall(n).args).toJS();
											expect(usedargs.length).toEqual(args.length);
											_.each(usedargs,function(usedarg,u){
												expect(usedarg).toEqual(test[args[u]]||args[u]);
											});
										}
									});
								});
							});
						});
					}
					afterEach(function(){
						_.each(test.context||{},function(stubdef,stubname){
							Algol[stubname].restore();
						});
					});
				});
			});
		});
	});
});


