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
	var commandslist = gamedef.get("commands").keySeq().sort();
	return I.fromJS({
		gamedef: gamedef.set("commands",commandslist.reduce(function(map,comname,n){
			return map.set(comname,gamedef.getIn(["commands",comname]).set("number",n+1));
		},I.Map())),
		commandsinorder: commandslist,
		connections: this.prepareConnectionsFromBoardDef(gamedef.get("board")),
		data: I.Map().set("units",this.prepareInitialUnitDataFromSetup(gamedef.get("setup"))),
		baselayers: this.prepareBaseLayers(gamedef,nbrofplayers),
		basecontext: {
			nbrofplayers: nbrofplayers
		},
		status: "ongoing",
		passto: _.reduce(_.range(1,nbrofplayers+1),function(mem,p){
			return mem.set(p,p===nbrofplayers?1:p+1);
		},I.Map())
	});
};


/*
Called from ....
Reset all stuff, run generators for startturn, finally call prepareNewStepState
1: remove old previousstep
2: reset steps, marks, baselayer and context, and update player, and set layers to baselayer
3: apply startturn effects
4: apply startturn generators

*/
Algol.prepareNewTurnState = function(state,newturnplayer){
	var startturn = state.getIn(["gamedef","startturn"]),
		effect = startturn.get("applyeffect"),
		baselayer = state.getIn(["baselayers",newturnplayer])||state.getIn(["baselayers",newturnplayer+""]);
	state = state.delete("previousstep").merge(I.fromJS({
		steps: [],
		marks: {},
		player: newturnplayer,
		turn: (state.get("turn")||0)+1,
		baselayer: baselayer,
		layers: baselayer,
		context: state.get("basecontext").merge(I.fromJS({
			currentplayer:newturnplayer,
			performedsteps:0,
			nextplayer:state.getIn(["passto",newturnplayer])||state.getIn(["passto",""+newturnplayer])
		}))
	}));
	state = effect ? this.applyEffect(state,effect) : state;
	state = this.applyGeneratorList(state,startturn.get("rungenerators")||I.List());
	return this.prepareNewStepState(state); // TODO - don't do this here?
};

/*

Called from prepareNewTurnState as well as... sth else involving commands! :)
1: resets state.layers to state.baselayer
2: runs generator list in state.gamedef.startstep.rungenerators
3: if not first step in turn then saves previousstep and calculates canendturn
TODO: remove all marks? I think so! NO! calculateCommandResult's responsibility!
*/
Algol.prepareNewStepState = function(state){
	var oldstate = state;
	state = state.set("layers",state.get("baselayer"));
	state = this.applyGeneratorList(state,state.getIn(["gamedef","startstep","rungenerators"])||I.List()); 
	return state.get("steps").isEmpty() ? state : state.set("previousstep",oldstate).set("canendturn",this.evaluateBoolean(state,state.getIn(["gamedef","endturn","condition"]))); 
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithPrepareFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithPrepareFunctions;
} else {
    window.augmentWithPrepareFunctions = augmentWithPrepareFunctions;
}})();