(function(){

var _ = (typeof require !== "undefined" ? require("../src/lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("../src/immutableextensions.js") : window.Immutable);
var Algol = (typeof require !== "undefined" ? require("../src/index.js") : window.Algol);
var sinon = (typeof require !== "undefined" ? require("sinon") : window.sinon);


function tester(name,tests){


describe("The "+name+" functions",function(){
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
					_.each(test.context||{},function(stubdef,stubname){
						describe("the usage of "+stubname,function(){
							it("called "+stubname+" correct number of times",function(){
								expect(Algol[stubname].callCount).toEqual(stubdef.expectedargs.length);
							});
							_.each(stubdef.expectedargs,function(args,n){
								describe("call number "+n,function(){
									it("used the correct number of arguments",function(){
										expect(Algol[stubname].getCall(n).args.length).toEqual(args.length);
									});
									_.each(args,function(arg,a){
										it("used correct parameter "+a,function(){
											var usedargs = I.List(Algol[stubname].getCall(n).args).toJS();
											expect(usedargs[a]).toEqual(test[arg]||arg);
										});
									});
								});
							});
						});
					});
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

}

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = tester;
else
    window.tester = tester;

})();
