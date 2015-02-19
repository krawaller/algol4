var I = require("immutable");

var origmap = I.Map({a:1,b:2,c:3});
var newmap = origmap.set("a",666).set("a",1);

var powmap = I.Map([[origmap,1]]);

console.log("So",powmap.get(newmap));

var GG = origmap.merge({a:7,b:777});

console.log(GG.get("a"),GG.get("b"));

var anothertest = I.fromJS({a:{b:{c:777}}});

console.log("HEREWEARE",anothertest.getIn(["a","b","c"]));