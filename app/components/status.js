/** @jsx React.DOM */

var React = require('react'),
    I = require('../../src/immutableextensions');

var Status = React.createClass({
    render: function() {
        var s = this.props.battle,
            turn = "Turn "+s.get("turn"),
            desc = s.has("endedby") ? "Ended by "+s.get("endedby")+", winner is player"+s.get("winner")+"!"
                : "Player"+s.get("player")+" is playing.", //, has made "+(s.get("steps").size)+" step(s).",
            turnvars = (s.getIn(["gamedef","graphics","turnvars"])||I.Map()).reduce(function(ret,str,name){
                return ""+str+": "+s.getIn(["context",name])+"  ";
            },""),
            plrvars = (s.getIn(["data","playervars"])).reduce(function(ret,values,name){
                return ret+name+": "+values.reduce(function(arr,current,plr){
                    return arr.concat(current);
                },[]).join("|")+" ";
            },"");
        return <div className="status">
            Playing a game of {s.getIn(["gamedef","meta","name"])}&nbsp;(
            <a href={s.getIn(["gamedef","meta","source"])}>rules</a>
            ). &nbsp;
            { turn+". "+desc+" "+turnvars+" "+plrvars }
        </div>
    }
});

module.exports = Status;