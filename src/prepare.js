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
	var parsedterrains = (gamedef.get("terrain")||I.Map()).map(this.prepareEntitiesFromList,this);
	var base = this.prepareBoardLayersFromBoardDef(gamedef.get("board"));
	return _.reduce(_.range(1,nbrofplayers+1),function(mem,plr){
		console.log("personalizing for",plr)
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

/*
The master function to set up a new state at the very beginning of a game. Called once.
TODO: also pass in plr information. oh, and default for nbrofplayers?
*/
Algol.prepareNewGameState = function(gamedef,nbrofplayers){
	var commandslist = gamedef.get("commands").keySeq().sort();
	var state = I.fromJS({
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
	return this.performOption(state,I.List(["passto",1]));
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
	var startturn = state.getIn(["gamedef","startturn"])||I.Map(),
		//effect = startturn.get("applyeffect"),
		baselayer = state.getIn(["baselayers",newturnplayer])||state.getIn(["baselayers",newturnplayer+""]);
	state = state.delete("previousstep").delete("canendturn").merge(I.fromJS({
		steps: [],
		marks: {},
		player: newturnplayer,
		turn: (state.get("turn")||0)+1,
		baselayer: baselayer,
		//layers: baselayer,
		context: state.get("basecontext").merge(I.fromJS({
			currentplayer:newturnplayer,
			performedsteps:0,
			nextplayer:state.getIn(["passto",newturnplayer])||state.getIn(["passto",""+newturnplayer])
		}))
	}));
	//state = effect ? this.applyEffect(state,effect) : state;
	//state = this.applyGeneratorList(state,startturn.get("rungenerators")||I.List());
	return this.prepareNewStepState(state); // TODO - don't do this here?
};

/*

Called from prepareNewTurnState as well as... sth else involving commands! :)

*/
Algol.prepareNewStepState = function(state,oldstate,newmarks){
	var startturn = state.getIn(["gamedef","startturn"]) || I.Map();
	state = state.set("layers",this.addUnitLayersFromData(state.get("baselayer"),state.getIn(["data","units"]),state.get("player")));
	if (state.get("steps").isEmpty()){
		if (startturn.has("applyeffect")){
			state = this.applyEffect(state,startturn.get("applyeffect"));
			state = state.set("layers",this.addUnitLayersFromData(state.get("baselayer"),state.getIn(["data","units"]),state.get("player")));
		}
		state = this.applyGeneratorList(state,state.getIn(["gamedef","startstep","rungenerators"])||I.List());
	} else {
		state = this.applyGeneratorList(state,state.getIn(["gamedef","startstep","rungenerators"])||I.List());
		state = state.set("previousstep",oldstate).set("canendturn",this.evaluateBoolean(state,state.getIn(["gamedef","endturn","condition"])));
	}
	state = state.set("marks",I.Map());
	state = (newmarks||I.Map()).reduce(function(mem,pos,markname){
		return this.setMark(mem,markname,pos);
	},state,this);
	return state;
	//return state.get("steps").isEmpty() ? state : state.set("previousstep",oldstate).set("canendturn",this.evaluateBoolean(state,state.getIn(["gamedef","endturn","condition"]))); 
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithPrepareFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithPrepareFunctions;
} else {
    window.augmentWithPrepareFunctions = augmentWithPrepareFunctions;
}})();