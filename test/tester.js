/* jshint jasmine: true */

(function(){

var _ = (typeof require !== "undefined" ? require("../src/lodashmixins") : window._);
var sinon = (typeof require !== "undefined" ? require("sinon") : window.sinon);


function tester(description,lib,methodtests,I){


describe(description,function(){
	_.each(methodtests,function(tests,signature){
		describe("the "+signature+" method",function(){
			var methodname = signature.split("(")[0],
				arglist = signature.split("(")[1].replace(/\)$/,"").split(",");
			_.each(tests,function(test,testdesc){
				var givenargs = _.reduce(_.keys(test),function(mem,arg){
					mem["@"+arg] = test[arg];
					return mem;
				},{});
				describe(testdesc,function(){
					var result, method;
					beforeEach(function(){
						method = lib[methodname];
						_.each(test.context||{},function(stubdef,stubname){
							sinon.stub(lib,stubname,stubdef.method || (function(){
								var callcount = 0;
								return function(){
									var ret = stubdef.returnseries ? stubdef.returnseries[callcount] : test[stubdef.returns]||stubdef.returns;
									callcount++;
									return I ? I.fromJS(ret) : ret;
								};
							})());
						});
						result = method.apply(lib,arglist.map(function(param){
							return I ? I.fromJS(test[param]) : test[param];
						}));
					});
					it("returns the expected value",function(){
						expect(result && result.toJS ? result.toJS() : result).toEqual(test.expected);
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
												var usedargs = (lib[stubname].getCall(n)||{args:[]}).args;
												expect((I?I.List(usedargs).toJS():usedargs)[a]).toEqual(givenargs[arg]||arg);
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

}

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = tester;
} else {
    window.tester = tester;
}

})();
