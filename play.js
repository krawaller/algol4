var I = require("./src/immutableextensions");

var origmap = I.Map({a:1,b:2,c:3});
var newmap = origmap.set("a",666).set("a",1);

var powmap = I.Map([[origmap,1]]);

console.log("So",powmap.get(newmap));

var GG = origmap.merge({a:7,b:777});

console.log(GG.get("a"),GG.get("b"));

var anothertest = I.fromJS({a:{b:{c:777}}});

console.log("HEREWEARE",anothertest.getIn(["a","b","c"]));



var toot = I.fromJS({
	a: 62,
	b: [4,5,"kurt"]
});

console.log("SO?", toot.some(function(val){
	console.log("...checking",val);
	return val  === "kurt";
}));

console.log("KEEEEYS",I.Iterable(I.fromJS({a:1,b:2}).keys()).first());

I.fromJS({a:1,b:[1,2,3]}).forEach(function(val,key){
	console.log("MOOO",val,key);
});

var momo = I.fromJS({
	a: 62
}).set("b",I.fromJS({c:"d"}));

console.log("really?",momo.getIn(["b","c"]));

console.log(I.fromJS({a:[1,2,3]}).get("a").push(3).push(97));

var m1 = I.fromJS({a:1,b:2,c:3});
var m2 = I.fromJS({d:1,b:6,c:9});
console.log("REALLY?",m1.filter(I.keyInMap(m2)));

console.log("testing",I.fromJS([1,[2,3],4]).toJS());

console.log("merging",I.List([1,2,3]).concat(I.List([4,5,6])));