/* jshint jasmine: true */

(function(){

var _ = (typeof require !== "undefined" ? require("../src/lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("../src/immutableextensions.js") : window.Immutable);
var sinon = (typeof require !== "undefined" ? require("sinon") : window.sinon);


function tester(description,lib,methodtests){


describe(description,function(){
	_.each(methodtests,function(signaturetests,methodname){
		describe("the "+methodname+" function",function(){
			_.each(signaturetests,function(tests,signature){
				describe("with signature "+signature,function(){
					signature = signature.replace(/^\[/,"").replace(/\]$/,"").split(",");
					_.each(tests,function(test,testdesc){
						describe(testdesc,function(){
							var result;
							beforeEach(function(){
								_.each(test.context||{},function(stubdef,stubname){
									sinon.stub(lib,stubname,stubdef.method || function(){return test[stubdef.returns]||stubdef.returns;});
								});
								result = lib[methodname].apply(lib,signature.map(function(param){return I.fromJS(test[param]);}));    //(I.fromJS(test.state||{}),I.fromJS(test.firstarg),test.secondarg && I.fromJS(test.secondarg));
							});
							it("returns "+JSON.stringify(test.expected),function(){
								expect(result.toJS ? result.toJS() : result).toEqual(test.expected);
							});
							_.each(test.context||{},function(stubdef,stubname){
								if (stubdef.expectedargs){
									describe("the usage of "+stubname,function(){
										it("called "+stubname+" correct number of times",function(){
											expect(lib[stubname].callCount).toEqual(stubdef.expectedargs.length);
										});
										_.each(stubdef.expectedargs,function(args,n){
											describe("call number "+n,function(){
												it("used the correct number of arguments",function(){
													expect((lib[stubname].getCall(n)||{args:[]}).args.length).toEqual(args.length);
												});
												_.each(args,function(arg,a){
													it("used correct parameter "+a,function(){
														var usedargs = I.List((lib[stubname].getCall(n)||{args:[]}).args).toJS();
														expect(usedargs[a]).toEqual(test[arg]||arg);
													});
												});
											});
										});
									});
								}
							});
							afterEach(function(){
								_.each(test.context||{},function(stubdef,stubname){
									lib[stubname].restore();
								});
							});
						});
					});
				});
			});
		});
	});
});

}

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = tester;
} else {
    window.tester = tester;
}

})();
