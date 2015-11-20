var _ = require('lodash'),
    I = require("../src/immutableextensions"),
    games = {
        "90grad": require("../games/90grad.json"),
        amazons: require("../games/amazons.json"),
        ambivalence: require("../games/ambivalence.json"),
        archers: require("../games/archers.json"),
        archimedes: require("../games/archimedes.json"),
        apocalypse: require("../games/apocalypse.json"),
        aries: require("../games/aries.json"),
        atrium: require("../games/atrium.json"),
        //breakthru: require("../games/breakthru.json"),
        bollsgame: require("../games/bollsgame.json"),
        campaign: require("../games/campaign.json"),
        cannon: require("../games/cannon.json"),
        cavalieri: require("../games/cavalieri.json"),
        //castle: require("../games/castle.json"),
        coffee: require("../games/coffee.json"),
        conquest: require("../games/conquest.json"),
        court: require("../games/court.json"),
        crossings: require("../games/crossings.json"),
        daggers: require("../games/daggers.json"),
        dao: require("../games/dao.json"),
        diagonals: require("../games/diagonals.json"),
        dodgem: require("../games/dodgem.json"),
        donkan: require("../games/donkan.json"),
        duffer: require("../games/duffer.json"),
        epaminondas: require("../games/epaminondas.json"),
        evasion: require("../games/evasion.json"),
        fourfieldkono: require("../games/fourfieldkono.json"),
        gobs: require("../games/gobs.json"),
        gogol: require("../games/gogol.json"),
        gravity: require("../games/gravity.json"),
        grensholm: require("../games/grensholm.json"),
        //jackrabbits: require("../games/jackrabbits.json"), // Too crappy
        jumpjack: require("../games/jumpjack.json"),
        //khan: require("../games/khan.json"), // Needs conversion!
        kickrun: require("../games/kickrun.json"),
        kingdom: require("../games/kingdom.json"),
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
        mutorere: require("../games/mutorere.json"),
        neighbours: require("../games/neighbours.json"),
        neutreeko: require("../games/neutreeko.json"),
        notchess: require("../games/notchess.json"), 
        omenom: require("../games/omenom.json"),
        orthokon: require("../games/orthokon.json"),
        owlman: require("../games/owlman.json"),
        outwit: require("../games/outwit.json"),
        partonia: require("../games/partonia.json"),
        pawnographic: require("../games/pawnographic.json"),
        playground: require("../games/playground.json"),
        rribbit: require("../games/rribbit.json"),
        regio: require("../games/regio.json"),
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
        snijpunt: require("../games/snijpunt.json"),
        sombrero: require("../games/sombrero.json"),
        tablut: require("../games/tablut.json"),
        tandem: require("../games/tandem.json"),
        threemusketeers: require("../games/threemusketeers.json"),
        transet: require("../games/transet.json"),
        trespass: require("../games/trespass.json"),
        trianon: require("../games/trianon.json"),
        trimok: require("../games/trimok.json"),
        uglyduck: require("../games/uglyduck.json"),
        vanakriget: require("../games/vanakriget.json"),
        vilbergen: require("../games/vilbergen.json"),
        wizardsgarden: require("../games/wizardsgarden.json"),
        yinyang: require("../games/yinyang.json"),
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
        } else if (l.first()==="case"){
            return [] // TODO - waaah!
        } else {
            console.log("What the efff?!",l.toJS())
            throw "Unknown layer name shit";
        }
    } else {
        return I.fromJS([l]);
    }
};

function gatherLayerNamesPure(def){
    if (def[0]==="ifelse"){
        return gatherLayerNamesPure(def[2]).concat(gatherLayerNamesPure(def[3]));
    } else {
        return [def];
    }
}

function defaultifyPure(def){
    def.meta.tags.push(def.board.width+"x"+def.board.height);
    def.meta.tags = def.meta.tags.concat( def.meta.author || [] );

    def.setup = _.mapValues(def.setup || {},function(sdef,name){
        return _.isArray(sdef) ? {0:sdef} : sdef;
    });

    def.terrain = _.mapValues(def.terrain || {},function(sdef,name){
        return _.isArray(sdef) ? {0:sdef} : sdef;
    });

    def.commands = _.mapValues(def.commands,function(cdef,commandname){
        cdef.name = commandname;
        cdef.allow = _.isArray(cdef.allow) ? cdef.allow : [cdef.allow];
        return cdef;
    });

    def.endturn = def.endturn || {};

    def.endturn.endgame = _.mapValues(def.endturn.endgame||{},function(def,name){
        return _.isArray(def) ? {condition:def} : def;
    });

    def.generators = _.mapValues(def.generators||{},function(gen,name){
        gen.name = name;
        if (gen.unlessover){ gen.condition = ["noneat",gen.unlessover,["contextpos","target"]] }
        if (gen.ifover){ gen.condition = ["anyat",gen.ifover,["contextpos","target"]] }
        if (gen.type !== "filter"){
            gen.dirs = gen.dirs || ["dirs",[1,2,3,4,5,6,7,8]];
            gen.draw = _.mapValues(gen.draw||{},function(drawdef){
                if (drawdef.unlessover){ drawdef.condition = ["noneat",drawdef.unlessover,["contextpos","target"]] }
                if (drawdef.ifover){ drawdef.condition = ["anyat",drawdef.ifover,["contextpos","target"]] }
                return drawdef;
            });
            gen.drawsto = _.reduce(gen.draw,function(list,drawdef){
                return list.concat(gatherLayerNamesPure(drawdef.tolayer));
            },[]);
        } else {
            gen.drawsto = gatherLayerNamesPure(gen.tolayer);
        }
        return gen;
    });
}

function defaultify(def){
    // fix tags
    def = def.setIn(["meta","tags"],def.getIn(["meta","tags"]).push(def.getIn(["board","width"])+"x"+def.getIn(["board","height"])));
    if (def.hasIn(["meta","author"])){
        /*if (!I.List.isList(def.getIn(["meta","author"]))){
            def = def.setIn(["meta","author"],I.List(def.getIn(["meta","author"])));
        }*/
        def = def.setIn(["meta","tags"],def.getIn(["meta","tags"]).concat(def.getIn(["meta","author"])));
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
    // fix endgames
    def = def.setIn(["endturn","endgame"],(def.getIn(["endturn","endgame"])||I.Map()).map(function(def,name){
        return I.List.isList(def) ? I.fromJS({"condition":def}) : def;
    }));
    // Fix generators
    def = def.set("generators",def.get("generators").map(function(gen,name){
        gen = gen.set("name",name);
        if (gen.has("unlessover")){
            gen = gen.set("condition",I.fromJS(["noneat",gen.get("unlessover"),["contextpos","target"]]));
        }
        if (gen.has("ifover")){
            gen = gen.set("condition",I.fromJS(["anyat",gen.get("ifover"),["contextpos","target"]]));   
        }
        if (gen.get("type")!=="filter"){
            gen = gen.set("dirs",gen.get("dirs") || I.fromJS(["dirs",[1,2,3,4,5,6,7,8]]) );
            gen = gen.set("draw",gen.get("draw").map(function(drawdef){
                if (drawdef.has("unlessover")){
                    drawdef = drawdef.set("condition",I.fromJS(["noneat",drawdef.get("unlessover"),["contextpos","target"]]));
                }
                if (drawdef.has("ifover")){
                    drawdef = drawdef.set("condition",I.fromJS(["anyat",drawdef.get("ifover"),["contextpos","target"]]));   
                }
                return drawdef;
            }));
            gen = gen.set("drawsto",gen.get("draw").reduce(function(list,drawdef,drawname){
                //console.log(drawname,drawdefget("tolayer").toJS && drawdef.get("tolayer").toJS()||drawdef.get("tolayer"));
                return list //.concat( gatherLayerNames(drawdef.get("tolayer")) ).toSet().toList();
            },I.List()))
        } else {
            //gen = gen.set("drawsto",gatherLayerNames(gen.get("tolayer")).toSet().toList());
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
