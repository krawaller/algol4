(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithPrepareFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ P R E P A R E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

// def is gamedef object, state has settings prop. 
Algol.populateGameWithSettings = function(state,def){
	return I.List.isList(def) && def.first() === "settings" ? state.getIn(["settings",def.get(1)])
	: def.map ? def.map(this.populateGameWithSettings.bind(this,state)) : def;
};


/*
Used in prepareNewGameState
*/
Algol.prepareConnectionsFromBoardDef = function(boarddef){
	var height = boarddef.get("height"), width = boarddef.get("width");
	return I.Range(1,width+1).reduce(function(mem,x){
		return I.Range(1,height+1).reduce(function(mem,y){
			var name = this.posObjToName({x:x,y:y},boarddef);
			return mem.set(name,_.reduce([1,2,3,4,5,6,7,8],function(map,dir){
				var newpos = this.offsetPosName(name,dir,1,0,boarddef);
				return newpos ? map.set(dir,newpos) : map;
			},I.Map(),this));
		},mem,this);
	},I.Map(),this);
};

/*
Used in prepareNewGameState
*/
Algol.prepareBoardLayersFromBoardDef = function(boarddef){
	var height = boarddef.get("height"), width = boarddef.get("width");
	return I.Range(1,width+1).reduce(function(mem,x){
		return I.Range(1,height+1).reduce(function(mem,y){
			var pos = this.posObjToName({x:x,y:y},boarddef), clr = ["light","dark"][(x+(y%2))%2], obj = I.Map({
				x: x, y: y, pos: pos, colour: clr
			})
			return mem.setIn(["board",pos],I.List([obj])).setIn([clr,pos],I.List([obj]));
		},mem,this);
	},I.Map(),this);
};

/*
Used in prepareNewGameState
*/
Algol.prepareBaseLayers = function(gamedef,nbrofplayers){
	var parsedterrains = (gamedef.get("terrain")||I.Map()).map(function(perowner){
		return perowner.reduce(function(ret,list,owner){
			return ret.concat(this.prepareEntitiesFromList(list,gamedef.get("board")).map(function(tile){
				return tile.set("owner",parseInt(owner||0));
			}));
		},I.List(),this);
	},this);
	//console.log("Parsedterrains",parsedterrains.toJS());
	var base = this.prepareBoardLayersFromBoardDef(gamedef.get("board"));
	// add noterrain
	base = base.set("noterrain",parsedterrains.reduce(function(mem,layer,layername){
		return layer.reduce(function(mem,val,key){
			return mem.delete(val.get("pos"));
		},mem)
	},base.get("board")));
	// add terrain
	base = base.set("terrain",parsedterrains.reduce(function(mem,layer,layername){
		return layer.reduce(function(mem,val,key){
			return I.pushIn(mem,[val.get("pos")],val);
		},mem)
	},I.Map()));
	// add nolayers
	base = parsedterrains.reduce(function(mem,list,layername){
		return mem.set("no"+layername,list.reduce(function(mem,val,key){
			return mem.delete(val.get("pos"));
		},base.get("board")))
	},base);
	// personalise and return
	return _.reduce(_.range(1,nbrofplayers+1),function(mem,plr){
		return mem.set(plr,this.addPersonalisedTerrainVersions(base,parsedterrains,plr));
	},I.Map(),this);
};

/*
Used in prepareBaseLayers. Called once per player. Augments layers with personalised terrain versions.
*/
Algol.addPersonalisedTerrainVersions = function(layers,terrains,forplr){
	return terrains.reduce(function(layers,terrainentities,name){
		return terrainentities.reduce(function(layers,terrainentity){
			return this.sortEntity(layers,terrainentity,[name],forplr);
		},layers,this);
	},layers,this);
};

Algol.prepareInitialPlayerVarsForGame = function(gamedef){
	return (gamedef.get("playervars")||I.Map()).reduce(function(mem,values,name){
		return mem.set(name,values.reduce(function(mem,startvalue,n){
			return mem.set(n+1,startvalue);
		},I.Map()));
	},I.Map());
};

/*
Used in prepareNewStepState, prepareFirstStepInTurn, calculateCommandResult
*/
Algol.prepareBasicUnitLayers = function(state){
	return state.set("layers",this.addUnitLayersFromData(state.get("baselayer"),state.getIn(["data","units"]),state.get("player")));
}



// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithPrepareFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithPrepareFunctions;
} else {
    window.augmentWithPrepareFunctions = augmentWithPrepareFunctions;
}})();