var _ = require('lodash'),
    I = require("../src/immutableextensions"),
    games = {
        amazons: require("../games/amazons.json"),
        archers: require("../games/archers.json"),
        breakthru: require("../games/breakthru.json"),
        cannon: require("../games/cannon.json"),
        castle: require("../games/castle.json"),
        conquest: require("../games/conquest.json"),
        daggers: require("../games/daggers.json"),
        epaminondas: require("../games/epaminondas.json"),
        gogol: require("../games/gogol.json"),
        krieg: require("../games/krieg.json"),
        pawnographic: require("../games/pawnographic.json"),
        sombrero: require("../games/sombrero.json")
    };

module.exports = _.reduce(games,function(mem,def,name){
    mem[name] = defaultify(I.fromJS(def));
    return mem;
},{},this);

function defaultify(def){
    return def.set("commands",def.get("commands").map(function(commanddef,commandname){
        return commanddef.set("name",commandname);
    }));
}