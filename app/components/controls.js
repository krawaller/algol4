/** @jsx React.DOM */

var React = require('react'),
    Tile = require('./tile'),
    I = require('../../src/immutableextensions');

var Controls = React.createClass({
    render: function() {
        var state = this.props.state, style = {top:this.props.top+"%"}, cb = this.props.broadcaster;
        return (
            <div style={style} className="controls">
                { (state.get("availableCommands")||I.Map()).reduce(function(list,cmnd,name){
                    return list.concat(<button
                        key={name}
                        onClick={function(){cb(cmnd)}}
                    >{name}</button>);
                },[]) }
            </div>
        )
    }
});

module.exports = Controls;