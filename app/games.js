var _ = require('lodash'),
    I = require("../src/immutableextensions"),
    games = {
        "90grad": require("../games/90grad.json"),
        amazons: require("../games/amazons.json"),
        archers: require("../games/archers.json"),
        archimedes: require("../games/archimedes.json"),
        apocalypse: require("../games/apocalypse.json"),
        aries: require("../games/aries.json"),
        //breakthru: require("../games/breakthru.json"),
        bollsgame: require("../games/bollsgame.json"),
        cannon: require("../games/cannon.json"),
        //castle: require("../games/castle.json"),
        coffee: require("../games/coffee.json"),
        conquest: require("../games/conquest.json"),
        court: require("../games/court.json"),
        crossings: require("../games/crossings.json"),
        daggers: require("../games/daggers.json"),
        donkan: require("../games/donkan.json"),
        duffer: require("../games/duffer.json"),
        epaminondas: require("../games/epaminondas.json"),
        fourfieldkono: require("../games/fourfieldkono.json"),
        gobs: require("../games/gobs.json"),
        gogol: require("../games/gogol.json"),
        gravity: require("../games/gravity.json"),
        grensholm: require("../games/grensholm.json"),
        jackrabbits: require("../games/jackrabbits.json"),
        //khan: require("../games/khan.json"), // Needs conversion!
        kickrun: require("../games/kickrun.json"),
        krieg: require("../games/krieg.json"),
        leapfrog: require("../games/leapfrog.json"),
        madbishops: require("../games/madbishops.json"),
        manicminelayers: require("../games/manicminelayers.json"),
        maninthemoon: require("../games/maninthemoon.json"),
        minefield: require("../games/minefield.json"),
        momentum: require("../games/momentum.json"),
        monkeyqueen: require("../games/monkeyqueen.json"),
        murusgallicus: require("../games/murusgallicus.json"),
        murusgallicusadvanced: require("../games/murusgallicusadvanced.json"),
        neighbours: require("../games/neighbours.json"),
        neutreeko: require("../games/neutreeko.json"),
        owlman: require("../games/owlman.json"),
        pawnographic: require("../games/pawnographic.json"),
        playground: require("../games/playground.json"),
        rribbit: require("../games/rribbit.json"),
        renpaarden: require("../games/renpaarden.json"),
        rolling: require("../games/rolling.json"),
        royalcarpet: require("../games/royalcarpet.json"),
        //retsami: require("../games/retsami.json"),
        sabotage: require("../games/sabotage.json"),
        semaphor: require("../games/semaphor.json"),
        serauqs: require("../games/serauqs.json"),
        sidekicker: require("../games/sidekicker.json"),
        siege: require("../games/siege.json"),
        snort: require("../games/snort.json"),
        sombrero: require("../games/sombrero.json"),
        tablut: require("../games/tablut.json"),
        tandem: require("../games/tandem.json"),
        threemusketeers: require("../games/threemusketeers.json"),
        trespass: require("../games/trespass.json"),
        trianon: require("../games/trianon.json"),
        uglyduck: require("../games/uglyduck.json"),
        zonesh: require("../games/zonesh.json")
    };

module.exports = _.reduce(games,function(mem,def,name){
    //console.log("DEFAULTIFYING",name);
    mem[name] = defaultify(I.fromJS(def));
    return mem;
},{},this);


function gatherLayerNames(l){
    if (l.first) {
        if (l.first()==="ifelse"){
            return gatherLayerNames(l.get(2)).concat(gatherLayerNames(l.get(3)))
        } else {
            console.log("What the efff?!",l.toJS())
            throw "Unknown layer name shit";
        }
    } else {
        return I.fromJS([l]);
    }
};

function defaultify(def){
    // fix tags
    def = def.setIn(["meta","tags"],def.getIn(["meta","tags"]).push(def.getIn(["board","width"])+"x"+def.getIn(["board","height"])));
    if (def.hasIn(["meta","author"])){
        def = def.setIn(["meta","tags"],def.getIn(["meta","tags"]).push(def.getIn(["meta","author"])));
    }

    // fix setup (empty default)
    def = def.set("setup",(def.get("setup")||I.Map()).map(function(sdef,name){
        if (I.List.isList(sdef)){
            return I.Map().set(0,sdef);
        } else {
            return sdef;
        }
    }));

    // fix terrain (empty default)
    def = def.set("terrain",(def.get("terrain")||I.Map()).map(function(tdef,name){
        if (I.List.isList(tdef)){
            return I.Map().set(0,tdef);
        } else {
            return tdef;
        }
    }));

    // Fix commands (add names)
    def = def.set("commands",def.get("commands").map(function(cdef,commandname){
        if (cdef.has("allow") && !I.List.isList(cdef.get("allow"))){
            cdef = cdef.set(I.List(cdef.get("allow")));
        }
        return cdef.set("name",commandname);
    }));
    def = def.setIn(["endturn","endgame"],def.getIn(["endturn","endgame"])||I.Map());
    // Fix generators
    def = def.set("generators",def.get("generators").map(function(gen,name){
        gen = gen.set("name",name);
        if (gen.get("type")!=="filter"){
            gen = gen.set("dirs",gen.get("dirs") || I.fromJS(["dirs",[1,2,3,4,5,6,7,8]]) );
            gen = gen.set("drawsto",gen.get("draw").reduce(function(list,drawdef,drawname){
                //console.log(drawname,drawdefget("tolayer").toJS && drawdef.get("tolayer").toJS()||drawdef.get("tolayer"));
                return list.concat( gatherLayerNames(drawdef.get("tolayer")) ).toSet().toList();
            },I.List()))
        } else {
            gen = gen.set("drawsto",gatherLayerNames(gen.get("tolayer")).toSet().toList());
        }
        //console.log("generator",name,"draws to",(gen.get("drawsto") || I.List()).toJS().join(",")  );
        return gen;
    }));
    // Fix marks
    def = def.set("marks",def.get("marks").reduce(function(mem,mdef,mname){
        mdef = mem.get(mname);
        if (mdef.has("allow") && !I.List.isList(mdef.get("allow"))){
            mdef = mdef.set(I.List(mdef.get("allow")));
        }
        mem = mem.set(mname,mdef.set("name",mname));
        return mem;
    },def.get("marks"),this));
    // done
    return def;
}


