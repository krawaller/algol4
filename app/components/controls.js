/** @jsx React.DOM */

var React = require('react'),
    I = require('../../src/immutableextensions'),
    battleactions = require("../actions/battleactions");

var Controls = React.createClass({
    render: function() {
        var battle = this.props.battle,
            gamecomms = battle.getIn(["gamedef","commands"]).keySeq().concat(I.List(["undo","endturn"])),
            avail = battle.get("availableCommands");
        if (battle.get("canendturnnow")){
            avail = avail.set("endturn",true);
        } 
        if (battle.has("undo")){
            avail = avail.set("undo",true);
        }
        if (battle.get("endedby")){
            return <div></div>;
        }
        return (
            <div className="controls">
                { gamecomms.reduce(function(list,name){
                    if (avail.has(name)){
                        return list.concat(<button
                            className={"command"+name}
                            key={name}
                            onClick={function(){battleactions.makeCommand(name)}}
                        >{name}</button>);
                    } else {
                        return list.concat(<button
                            className={"command"+name}
                            key={name}
                            disabled={true}
                        >{name}</button>);
                    }
                },[]) }
            </div>
        )
    }
});

module.exports = Controls;