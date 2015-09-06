(function(){
var _ = (typeof require !== "undefined" ? require("./lodashmixins") : window._);
var I = (typeof require !== "undefined" ? require("./immutableextensions.js") : window.Immutable);
function augmentWithEntiticeFunctions(Algol){


// €€€€€€€€€€€€€€€€€€€€€€€€€€€ E N T I T I C E  F U N C T I O N S €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€*/

/*
Used in addUnitLayersFromData and addPersonalisedTerrainVersions (prepare)
Will add the entity to correct position in corresponding group layers depending on plr and status
*/
Algol.sortEntity = function(layers,entity,groups,plr,compare){
	var owner = entity.get("owner"),
		prefix = entity.get("dead") ? "dead" : "",
		cat = owner === plr ? "my" : owner === 0 ? "neutral" : owner ? "opp" : "",
		pos = entity.get("pos");
	return groups.reduce(function(mem,group){
		return I.pushIn(I.pushIn(mem,[prefix+group,pos],entity),[cat+prefix+group,pos],entity);
	},compare ? I.pushIn(layers,["compare",pos],entity.delete("id")) : layers);
};

/*
Called at beginning of every step. Will sort each unit entity from the data object.
This means either just the "units" group, and also special group if unit has one.
*/
Algol.addUnitLayersFromData = function(layers,unitsdata,plr){
	return unitsdata.reduce(function(mem,unit){
		var group = unit.get("group");
		return this.sortEntity(mem,unit,group?["units",group]:["units"],plr,true);
	},layers,this);
};


/*
Used in prepareState
*/
Algol.prepareInitialUnitsForGame = function(gamedef){
	var n = 0;
	return gamedef.get("setup").reduce(function(data,list,groupname){
		return this.prepareEntitiesFromList(list,gamedef.get("board")).reduce(function(data,unit){
			var id = "unit"+(++n);
			return data.set(id,unit.set("id",id).set("group",groupname));
		},data,this);
	},I.Map(),this);
};

Algol.ykxToA1 = function(ykx,board){
	var cols = ["a","b","c","d","e","f","g","i","j","k","l","m","n","o","p","q","r","s","t","u"];
};

Algol.A1Toykx = function(a1,board){
	var cols = ["a","b","c","d","e","f","g","i","j","k","l","m","n","o","p","q","r","s","t","u"];	
}

/*
Helper function used only in prepareEntitiesFromList
*/
Algol.addEntitiesFromDef = function(coll,def,board){
	var blueprint, topleft, bottomright;
	if (I.List.isList(def)){ 
		if (def.first()==="positions"){ // [positions,<list>,<owner>,<blueprint>]
			blueprint = (def.get(3) || I.Map()).set("owner",def.get(2)||0);
			return def.get(1).reduce(function(mem,pos){
				return mem.push(blueprint.set("pos",pos));
			},coll);
		} else { // [rectangle,topleft,bottomright,owner,blueprint]
			blueprint = (def.get(4) || I.Map()).set("owner",def.get(3)||0);
			topleft = this.posNameToObj(def.get(1),board);  //parseInt(def.get(1));
			bottomright = this.posNameToObj(def.get(2),board); //parseInt(def.get(2));
			return rect =  _.reduce(_.range(topleft.y,bottomright.y+1),function(mem,r){
				return _.reduce(_.range(topleft.x,bottomright.x+1),function(mem,c){
					return mem.push(blueprint.set("pos",this.posObjToName({x:c,y:r},board)));
				},mem,this);
			},coll,this);
			/*return rect =  _.reduce(_.range(Math.floor(topleft/1000),Math.floor(bottomright/1000)+1),function(mem,r){
				return _.reduce(_.range(topleft % 1000,(bottomright % 1000)+1),function(mem,c){
					return mem.push(blueprint.set("pos",r*1000+c));
				},mem);
			},coll);*/
		}
	} else { // single definition
		return coll.push(def);
	}
}

Algol.offsetPosName = function(name,dir,forward,right,board){ // topleft is 1,1
	var forwardmods = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]], // x,y
		rightmods =   [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],
		obj = this.posNameToObj(name,board),
		n = dir-1,
		newx = obj.x + forwardmods[n][0]*forward + rightmods[n][0]*right,
		newy = obj.y + forwardmods[n][1]*forward + rightmods[n][1]*right;
	return newx>0 && newx<=board.get("width") && newy>0 && newy<=board.get("height") && this.posObjToName({x:newx,y:newy},board);
};

Algol.posNameToObj = function(name,board){
	var int = parseInt(name);
	return {x: (int % 1000), y: Math.floor(int/1000) };
};

Algol.posObjToName = function(obj,board){
	return obj.y*1000+obj.x;
};


/*
Used in prepareInitialUnitDataFromSetup and prepareTerrainLayerFromEntityList
*/
Algol.prepareEntitiesFromList = function(deflist,board){
	return deflist.reduce(function(coll,entitydef){
		return this.addEntitiesFromDef(coll,entitydef,board);
	},I.List(),this);  // this.addEntitiesFromDef,I.List());
}


// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithEntiticeFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithEntiticeFunctions;
} else {
    window.augmentWithEntiticeFunctions = augmentWithEntiticeFunctions;
}})();