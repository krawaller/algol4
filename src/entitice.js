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
	var ret = gamedef.get("setup").reduce(function(data,perowner,groupname){
		return perowner.reduce(function(data,list,owner){
			return this.prepareEntitiesFromList(list,gamedef.get("board")).reduce(function(data,unit){
				var id = "unit"+(++n);
				return data.set(id,unit.set("id",id).set("group",groupname).set("owner",parseInt(owner||0)));
			},data,this);
		},data,this);
	},I.Map(),this);
	//console.log("Initial setup",ret.toJS());
	return ret;
};

/*
Helper function used only in prepareEntitiesFromList
*/
Algol.addEntitiesFromDef = function(coll,def,board){
	var blueprint, topleft, bottomright,holes;
	if (I.List.isList(def)){ 
		if (def.first()==="pos"){ // [positions,<list>,dir,<blueprint>]
			blueprint = (def.get(3) || I.Map());
			return def.get(1).reduce(function(mem,pos){
				return mem.push(blueprint.set("pos",pos).set("dir",def.get(2)||1));
			},coll);
		} else if (def.first()==="holerect") { // [holedrectangle,topleft,bottomright,holes,dir,blueprint]
			blueprint = (def.get(5) || I.Map());
			topleft = this.posNameToObj(def.get(1),board);  //parseInt(def.get(1));
			bottomright = this.posNameToObj(def.get(2),board); //parseInt(def.get(2));
			holes = def.get(3);
			return rect =  _.reduce(_.range(topleft.y,bottomright.y+1),function(mem,r){
				return _.reduce(_.range(topleft.x,bottomright.x+1),function(mem,c){
					var name = this.posObjToName({x:c,y:r},board);
					return holes.contains(name) ? mem : mem.push(blueprint.set("pos",name).set("dir",def.get(4)||1));
				},mem,this);
			},coll,this);
		} else { // [rect,topleft,bottomright,dir,blueprint]
			blueprint = (def.get(4) || I.Map());
			//console.log("Strange def?",def.toJS());
			topleft = this.posNameToObj(def.get(1),board);  //parseInt(def.get(1));
			bottomright = this.posNameToObj(def.get(2),board); //parseInt(def.get(2));
			return rect =  _.reduce(_.range(topleft.y,bottomright.y+1),function(mem,r){
				return _.reduce(_.range(topleft.x,bottomright.x+1),function(mem,c){
					return mem.push(blueprint.set("pos",this.posObjToName({x:c,y:r},board)).set("dir",def.get(3)||1));
				},mem,this);
			},coll,this);
		}
	} else if (I.Map.isMap(def)){ // single definition
		return coll.push(def);
	} else { // single pos
		return coll.push(I.Map().set("pos",def));
	}
}

Algol.offsetPosName = function(name,dir,forward,right,board){ // bottom left is 1,1
	var forwardmods = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]], // x,y
		rightmods =   [[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1],[1,1]],
		obj = this.posNameToObj(name,board),
		n = dir-1,
		newx = obj.x + forwardmods[n][0]*forward + rightmods[n][0]*right,
		newy = obj.y + forwardmods[n][1]*forward + rightmods[n][1]*right;
	return newx>0 && newx<=board.get("width") && newy>0 && newy<=board.get("height") && this.posObjToName({x:newx,y:newy},board);
};

var colnametonumber = _.reduce("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXYZ".split(""),function(mem,char,n){
	mem[char] = n+1;
	return mem;
},{});

colnumbertoname = _.invert(colnametonumber);

Algol.posNameToObj = function(name,board){
	return {x: colnametonumber[name[0]], y: parseInt(name.substr(1)) };
};

Algol.posObjToName = function(obj,board){
	return colnumbertoname[obj.x]+obj.y;
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