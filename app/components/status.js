/** @jsx React.DOM */

var React = require('react'),
    I = require('../../src/immutableextensions');

var Status = React.createClass({
    render: function() {
        var s = this.props.state,
            turn = "Turn "+s.get("turn"),
            desc = s.has("endedby") ? "Ended by "+s.get("endedby")+", winner is player"+s.get("winner")+"!"
                : "Player"+s.get("player")+" is playing.",
            vars = (s.getIn(["gamedef","graphics","turnvars"])||I.Map()).reduce(function(ret,str,name){
                return ""+str+": "+s.getIn(["context",name])+"  ";
            },"");
        return <div className="status">
            Playing a game of {s.getIn(["gamedef","name"])}&nbsp;(
            <a href={s.getIn(["gamedef","source"])}>rules</a>
            ). &nbsp;
            { turn+". "+desc+" "+vars }
        </div>
    }
});

module.exports = Status;