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

tester("execute",{
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
	calculateStepData: [{
		state: {marks: {mark1:"foo",mark2:"bar"}},
		firstarg: {name:"somecommand",neededmarks:["mark1"]},
		expected: {command:"somecommand",marks:{mark1:"foo"}}
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
		expected: ["NEWSTEP",{marks:"NEWMARKDATA",data:{c:666},steps:["foo","STEPDATA"],previousstep: {marks:{mark1:"foo",mark2:"bar"},steps:[1,2],data:{a:1},previousstep:{steps:[1],data:{b:2},previousstep:{steps:[],data:{c:3}}},context:{PERFORMEDSTEPS:4}},context:{PERFORMEDSTEPS:5} }],
		context: {
			updateMarksFromCommand: {
				method: function(){ return "NEWMARKDATA"; },
				expectedargs: [["state","secondarg"]]
			},
			calculateStepData: {
				method: function(){ return "STEPDATA"; },
				expectedargs: [["state","secondarg"]]
			}
		}
	}],
	endTurnOption: [{
		state: {context:{FOO:"bar",CURRENTPLAYER:1}},
		firstarg: {endturn:{},endgame:{bywuu:{condition:["TRUE"],winner:["CONTEXTVAL","CURRENTPLAYER"]}}},
		expected: ["ENDGAME","bywuu",1]
	},{
		state: {context:{FOO:"bar",CURRENTPLAYER:1}},
		firstarg: {endturn:{passto:["IFELSE",["SAME",["CONTEXTVAL","CURRENTPLAYER"],["VAL",1]],["VAL",2],["VAL",1]]},endgame:{bywuu:{condition:["DIFFERENT",["CONTEXTVAL","FOO"],["VAL","bar"]],winner:["CONTEXTVAL","CURRENTPLAYER"]}}},
		expected: ["PASSTO",2]
	}],
	listCommandOptions: [{
		state: {},
		firstarg: {endgame:{bypoo:{condition:["TRUE"],winner:["VAL",1]}},commands:{}},
		secondarg: true,
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
		state: {turn: 6, foo: "bar", save: [["BLAH"]], steps: ["1st","2nd"]},
		firstarg: ["PASSTO",3],
		expected: "HYDRATED",
		context: {
			hydrateState: {
				method: function(){ return "HYDRATED"; },
				expectedargs: [ ["NEWTURN"] ]
			},
			newTurnState: {
				method: function(){ return "NEWTURN"; },
				expectedargs: [ ["state",3] ]
			}
		}
	},{
		state: {foo:"bar"},
		firstarg: ["ENDGAME","somecond",2],
		expected: {foo:"bar",status:"somecond", player:2}
	},{
		state: {foo:"bar"},
		firstarg: ["NEWSTEP",{some:"other"}],
		expected: "hydratedstate",
		context: {
			hydrateState: {
				method: function(){ return "hydratedstate"; },
				expectedargs: [ [{some:"other"}] ]
			}
		}
	}],
	/*buildSaveEntryFromStep: [{
		state: {gamedef:{commands:{somecommand:{neededmarks:["bar","foo"],id:"MYID"}}}},
		firstarg: {command:"somecommand",marks:{foo:1,bar:2}},
		expected: "MYID_2_1"
	}],*/
	hydrateState: [{
		state: {hydration: "LIST",gamedef: {baz:"bin",endturn:{condition:["FALSE"]}}, foo:"bar"},
		expected: {ranlist: "LIST", hydration:"LIST",gamedef:{baz:"bin",endturn:{condition:["FALSE"]}}, commands: "barLISTbinfalse", foo:"bar"},
		context: {
			applyGeneratorList: {
				method: function(s,list){ return s.set("ranlist",list); }
			},
			listCommandOptions: {
				method: function(s,gamedef,t){ return s.get("foo")+s.get("ranlist")+gamedef.get("baz")+t; }
			}
		}
	},{
		state: {hydration: "LIST", hydrationturnend: "LIST2", gamedef: {baz:"bin",endturn:{condition:["TRUE"]}}, foo:"bar"},
		expected: {ranlist: "LISTLIST2", hydration:"LIST", hydrationturnend: "LIST2", gamedef:{baz:"bin",endturn:{condition:["TRUE"]}}, commands: "barLISTLIST2bintrue", foo:"bar"},
		context: {
			applyGeneratorList: {
				method: function(s,list){ return s.set("ranlist",(s.get("ranlist")||"")+list); }
			},
			listCommandOptions: {
				method: function(s,gamedef,t){ return s.get("foo")+s.get("ranlist")+gamedef.get("baz")+t; }
			}
		}
	}],
	updateMarksFromCommand: [],
	newTurnState: [{
		state: {
			steps: ["foo","bar"],
			save: ["FOO"],
			marks: "FOO",
			turn: 666,
			context: "FOO",
			player: 333
		},
		firstarg: 777,
		expected: {
			steps: [],
			save: ["FOO",[333,"foo","bar"]],
			previousstep: { player: 333, steps: ["foo","bar"],save: ["FOO"],marks: "FOO",turn: 666,context: "FOO"},
			previousturn: { player: 333, steps: ["foo","bar"],save: ["FOO"],marks: "FOO",turn: 666,context: "FOO"},
			marks: {},
			turn: 667,
			player: 777,
			context: {CURRENTPLAYER:777,PERFORMEDSTEPS:0},
			affected: [],
			status: "ONGOING"
		}
	}]
});


