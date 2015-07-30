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
		cat = owner === plr ? "my" : owner === 0 ? "neutral" : "opp",
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
Algol.prepareInitialUnitDataFromSetup = function(setup){
	return I.Map(Algol.prepareEntitiesFromList(setup).reduce(function(map,unit,n){
		return map.set("unit"+(n+1),unit.set("ID","unit"+(n+1)));
	},I.Map(),this));
};

/*
Helper function used only in prepareEntitiesFromList
*/
Algol.addEntitiesFromDef = function(coll,def){
	if (I.List.isList(def)){ 
		if (def.first()==="positions"){ // [positions,<list>,<blueprint>]
			return def.get(1).reduce(function(mem,pos){
				return mem.push(def.get(2).set("pos",pos));
			},coll);
		} else { // [rectangle,topleft,bottomright,blueprint]
			var blueprint = def.get(3),
				topleft = parseInt(def.get(1)),
				bottomright = parseInt(def.get(2));
			return _.reduce(_.range(Math.floor(topleft/1000),Math.floor(bottomright/1000)+1),function(mem,r){
				return _.reduce(_.range(topleft % 1000,bottomright % 1000+1),function(mem,c){
					return mem.push(blueprint.set("pos",r*1000+c));
				},mem);
			},coll);
		}
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
TODO: truncate, or at least fix up
Used in prepareState.
*/
Algol.prepareTerrainLayerFromEntityList = function(list){
	return Algol.prepareEntitiesFromList(list).reduce(function(mem,e){
		return I.pushIn(mem,[e.get("pos")],e);
	},I.Map())
};

// €€€€€€€€€€€€€€€€€€€€€€€€€ E X P O R T €€€€€€€€€€€€€€€€€€€€€€€€€

} // end augmentWithEntiticeFunctions

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = augmentWithEntiticeFunctions;
} else {
    window.augmentWithEntiticeFunctions = augmentWithEntiticeFunctions;
}})();