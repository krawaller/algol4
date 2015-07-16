(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithPrepareFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ P R E P A R E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


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
				x: x, y: y, pos: pos, colour: clr
			})
			return mem.setIn(["board",pos],I.List([obj])).setIn([clr,pos],I.List([obj]));
		},mem);
	},I.Map());
};

/*
Used in prepareState.
*/
Algol.prepareBaseLayers = function(gamedef,nbrofplayers){
	var parsedterrains = (gamedef.get("terrain")||I.Map()).map(this.prepareEntitiesFromList),
		base = this.prepareBoardLayersFromBoardDef(gamedef.get("board"));
	return _.reduce(_.range(1,nbrofplayers+1),function(mem,plr){
		return mem.push(this.addPersonalisedTerrainVersions(base,parsedterrains,plr));
	},[],this);
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

/*
The master function to set up a new state. Called once.
*/
Algol.prepareState = function(gamedef,nbrofplayers){
	return I.fromJS({
		connections: this.prepareConnectionsFromBoardDef(gamedef.get("board")),
		data: I.Map().set("units",this.prepareInitialUnitDataFromSetup(gamedef.get("setup"))),
		baselayers: this.prepareBaseLayers(gamedef,nbrofplayers)
	});
};


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithPrepareFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithPrepareFunctions;
} else {
    window.augmentWithPrepareFunctions = augmentWithPrepareFunctions;
}})();