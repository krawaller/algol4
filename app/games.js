var _ = require('lodash'),
    I = require("../src/immutableextensions"),
    games = {
        amazons: require("../games/amazons.json"),
        archers: require("../games/archers.json"),
        breakthru: require("../games/breakthru.json"),
        cannon: require("../games/cannon.json"),
        castle: require("../games/castle.json"),
        conquest: require("../games/conquest.json"),
        crossings: require("../games/crossings.json"),
        daggers: require("../games/daggers.json"),
        epaminondas: require("../games/epaminondas.json"),
        gogol: require("../games/gogol.json"),
        krieg: require("../games/krieg.json"),
        murusgallicus: require("../games/murusgallicus.json"),
        murusgallicusadvanced: require("../games/murusgallicusadvanced.json"),
        pawnographic: require("../games/pawnographic.json"),
        sombrero: require("../games/sombrero.json"),
        trespass: require("../games/trespass.json"),
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
    def = def.set("commands",def.get("commands").map(function(commanddef,commandname){
        return commanddef.set("name",commandname);
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
        mem = mem.set(mname,mdef.set("name",mname));
        mem = (mdef.get("requiredby")||I.List()).reduce(function(m,slave){
            return I.pushIn(m,[slave,"requiredmarks"],mname);
        },mem);
        if (mdef.has("rungenerators")){
            mem = mem.set(mname,mdef.get("rungenerators").reduce(function(m,gname){
                return m.set("cleanse", ((m.get("cleanse")||I.List()).concat( def.getIn(["generators",gname,"drawsto"]) )).toSet().toList() )
            },mdef));
            //console.log("now",mname,"cleanses",mdef.get("cleanse").toJS());
        }
        if (mdef.has("notifhasmark")){
            //console.log("So",mname,"is allergic to",mdef.get("notifhasmark").toJS().join(","));
            mem = mdef.get("notifhasmark").reduce(function(m,allergicto){
                m = I.pushInIfNew(m,[allergicto,"notifhasmark"],mname);
                //console.log("Now reversed in",allergicto,m.getIn([allergicto,"notifhasmark"]).toJS().join(","));
                return m;
            },mem);
        }
        return mem;
    },def.get("marks"),this))
    return def;
}