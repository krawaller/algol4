/** @jsx React.DOM */

var React = require('react'),
    Tile = require('./tile'),
    I = require('../../src/immutableextensions');

var Controls = React.createClass({
    render: function() {
        var state = this.props.state, style = {top:this.props.top+"%"}, cb = this.props.broadcaster,
            gamecomms = state.getIn(["gamedef","commands"]).keySeq().concat(I.List(["undo","endturn"])),
            avail = state.get("availableCommands");
        if (state.get("endedby")){
            return <div></div>;
        }
        return (
            <div style={style} className="controls">
                { gamecomms.reduce(function(list,name){
                    if (avail.has(name)){
                        return list.concat(<button
                            key={name}
                            onClick={function(){cb(avail.get(name))}}
                        >{name}</button>);
                    } else {
                        return list.concat(<button
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