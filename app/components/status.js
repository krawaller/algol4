/** @jsx React.DOM */

var React = require('react'),
    I = require('../../src/immutableextensions'),
    Algol = require("../../src/index");

var Status = React.createClass({
    render: function() {
        var s = this.props.battle,
            turn = "Turn "+s.get("turn"),
            desc = s.has("endedby") ? "Ended by "+s.get("endedby")+", winner is player"+s.get("winner")+"!"
                : "Player"+s.get("player")+" is playing.", //, has made "+(s.get("steps").size)+" step(s).",
            turnvars = (s.getIn(["gamedef","graphics","turnvars"])||I.Map()).reduce(function(ret,str,name){
                return ""+str+": "+s.getIn(["context",name])+"  ";
            },""),
            battlevals = (s.getIn(["gamedef","graphics","battlevals"])||I.Map()).reduce(function(ret,str,name){
                var val = s.getIn(["data","battlevals",name]);
                return val!==undefined ? ret+" "+str+": "+val+"  " : ret;
            },""),
            plrvars = (s.getIn(["data","playervars"])).reduce(function(ret,values,name){
                return ret+name+": "+values.reduce(function(arr,current,plr){
                    return arr.concat(current);
                },[]).join("|")+" ";
            },""),
            instruction = !s.has("endedby") && s.hasIn(["gamedef","graphics","instruction"]) ? Algol.evaluateValue(s,s.getIn(["gamedef","graphics","instruction"])) : "";
        return <div className="status">
            Playing a game of {s.getIn(["gamedef","meta","name"])}&nbsp;(
            <a href={s.getIn(["gamedef","meta","source"])}>rules</a>
            ). &nbsp;
            { turn+". "+desc+" "+turnvars+" "+battlevals+" "+plrvars+" "+instruction }
        </div>
    }
});

module.exports = Status;