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

tester("the process methods",Algol,{
	"populateGameWithSettings(state,def)": {
		"for simple test": {
			state: {settings:{foo:"bar"}},
			def: {so:["why",["am","i",["SETTINGS","foo"]]]},
			expected: {so:["why",["am","i","bar"]]},
		}
	},
},I);
