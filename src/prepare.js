(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithPrepareFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ P R E P A R E   F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/


/*
Used in prepareNewGameState
*/
Algol.prepareConnectionsFromBoardDef = function(boarddef){
	var height = boarddef.get("height"), width = boarddef.get("width");
	return I.Range(1,width+1).reduce(function(mem,x){
		return I.Range(1,height+1).reduce(function(mem,y){
			return mem.set(y*1000+x,_.reduce([[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]],function(map,mods,n){
				var newx = x+mods[0], newy = y+mods[1];
				return newx>0 && newx<=width && newy>0 && newy<=height ? map.set(n+1,newy*1000+newx) : map;
			},I.Map()));
		},mem);
	},I.Map());
};

/*
Used in prepareNewGameState
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
Used in prepareNewGameState.
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
The master function to set up a new state at the very beginning of a game. Called once.
TODO: also pass in plr information
*/
Algol.prepareNewGameState = function(gamedef,nbrofplayers){
	return I.fromJS({
		gamedef: gamedef,
		connections: this.prepareConnectionsFromBoardDef(gamedef.get("board")),
		data: I.Map().set("units",this.prepareInitialUnitDataFromSetup(gamedef.get("setup"))),
		baselayers: this.prepareBaseLayers(gamedef,nbrofplayers),
		basecontext: {
			nbrofplayers: nbrofplayers
		},
		status: "ongoing"
	});
};


/*
Called form Algol.performOption --- passto
Reset all tracking, and run generators for startturn and startstep.
*/
Algol.prepareNewTurnState = function(state,player){
	return this.applyGeneratorList(this.applyGeneratorList(state.merge(I.fromJS({
		steps: [],
		affected: [],
		save: state.has("save") ? state.get("save").push(I.List([state.get("player")]).concat(state.get("steps"))) : [],
		marks: {},
		previousstep: state,
		previousturn: state,
		player: player,
		turn: state.get("turn")+1,
		context: {currentplayer:player,performedsteps:0}
	})),state.getIn(["gamedef","startturn","hydration"])||I.List()),state.getIn(["gamedef","startstep","hydration"])||I.List());
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithPrepareFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithPrepareFunctions;
} else {
    window.augmentWithPrepareFunctions = augmentWithPrepareFunctions;
}})();