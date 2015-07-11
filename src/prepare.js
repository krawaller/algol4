(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithPrepareFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ P R E P A R E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


/*
Called at the beginning of every step. TODO: move to other file, this just for prepping prior to game! :P
*/
Algol.prepareUnitLayersFromData = function(unitsdata,plr){
	var to = I.Map().set(0,"NEUTRALS").set(undefined,"NEUTRALS").set(plr,"MYUNITS");
	return unitsdata.reduce(function(map,unit){
		var pos = unit.get("POS");
		return unit.get("STATUS") === "DEAD" ? I.pushIn(map,["DEADUNITS",pos],unit) : 
			I.pushIn(I.pushIn(map,[(to.get(unit.get("PLR"))||"OPPUNITS"),pos],unit),["UNITS",pos],unit);
	},blueprint,this);
};
var blueprint = I.fromJS({UNITS:{},DEADUNITS:{},MYUNITS:{},OPPUNITS:{},NEUTRALS:{}});

/*
Used in prepareState
*/
Algol.prepareInitialUnitDataFromSetup = function(setup){
	return I.Map(Algol.prepareEntitiesFromList(setup).reduce(function(map,unit,n){
		return map.set("unit"+(n+1),unit.set("ID","unit"+(n+1)));
	},I.Map(),this));
};

/*
Helper function used only in prepareEntitiesFromList
*/
Algol.addEntitiesFromDef = function(coll,def){
	if (I.List.isList(def)){ // [ALL,<list>,<blueprint>]
		return def.get(1).reduce(function(mem,pos){
			return mem.push(def.get(2).set("POS",pos));
		},coll);
	} else {
		return coll.push(def);
	}
}

/*
Used in prepareInitialUnitDataFromSetup and prepareTerrainLayerFromEntityList
*/
Algol.prepareEntitiesFromList = function(deflist){
	return deflist.reduce(Algol.addEntitiesFromDef,I.List());
}

/*
Used in prepareState
*/
Algol.prepareConnectionsFromBoardDef = function(boarddef){
	var height = boarddef.get("height"), width = boarddef.get("width");
	return I.Range(1,width+1).reduce(function(mem,x){
		return I.Range(1,height+1).reduce(function(mem,y){
			return mem.set(y*1000+x,I.Map({x:x,y:y,nextto:_.reduce([[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]],function(map,mods,n){
				var newx = x+mods[0], newy = y+mods[1];
				return newx>0 && newx<=width && newy>0 && newy<=height ? map.set(n+1,newy*1000+newx) : map;
			},I.Map())}));
		},mem);
	},I.Map());
};

/*
Used in prepareState
*/
Algol.prepareBoardLayersFromBoardDef = function(boarddef){
	var height = boarddef.get("height"), width = boarddef.get("width");
	return I.Range(1,width+1).reduce(function(mem,x){
		return I.Range(1,height+1).reduce(function(mem,y){
			var pos = y*1000+x, clr = ["light","dark"][(x+(y%2))%2], obj = I.Map({
				X: x, Y: y, POS: pos, COLOUR: clr
			})
			return mem.setIn(["BOARD",pos],I.List([obj])).setIn([(clr==="light"?"LIGHT":"DARK"),pos],I.List([obj]));
		},mem);
	},I.Map());
};

/*
Used in prepareState.
*/
Algol.prepareTerrainLayerFromEntityList = function(list){
	return Algol.prepareEntitiesFromList(list).reduce(function(mem,e){
		return I.pushIn(mem,[e.get("POS")],e);
	},I.Map())
};

/*
The master function to set up a new state. Called once.
*/
Algol.prepareState = function(gamedef,players){
	return I.fromJS({
		connections: Algol.prepareConnectionsFromBoardDef(gamedef.get("board")),
		data: I.Map().set("units",Algol.prepareInitialUnitDataFromSetup(gamedef.get("setup"))),
		baselayers: (gamedef.get("terrain")||I.Map()).reduce(function(mem,layerdef,layername){
			return mem.set(layername,Algol.prepareTerrainLayerFromEntityList(layerdef));
		},Algol.prepareBoardLayersFromBoardDef(gamedef.get("board")))
	});
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithPrepareFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithPrepareFunctions;
} else {
    window.augmentWithPrepareFunctions = augmentWithPrepareFunctions;
}})();