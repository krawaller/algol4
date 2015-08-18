/** @jsx React.DOM */

var React = require('react'),
    Tile = require('./tile'),
    I = require('../../src/immutableextensions');

var Controls = React.createClass({
    render: function() {
        var state = this.props.state, cb = this.props.broadcaster,
            gamecomms = state.getIn(["gamedef","commands"]).keySeq().concat(I.List(["undo","endturn"])),
            avail = state.get("availableCommands");
        if (state.get("endedby")){
            return <div></div>;
        }
        return (
            <div className="controls">
                { gamecomms.reduce(function(list,name){
                    if (avail.has(name)){
                        return list.concat(<button
                            className={"command"+name}
                            key={name}
                            onClick={function(){cb(avail.get(name))}}
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