/** @jsx React.DOM */

var React = require('react'),
    Square = require('./square'),
    I = require('../../src/immutableextensions');

var Terrain = React.createClass({
    render: function() {
        var state = this.props.state,
            graphics = state.getIn(["gamedef","graphics"]),
            board = state.getIn(["layers","board"]);
        return (
            <div className={(graphics.get("background")||"wood")+" terrain"}>
                { (graphics.get("tiles")||I.Map()).set("dark","dark").reduce(function(list,look,layer){
                    return state.getIn(["layers",layer]).reduce(function(list,arr,pos){
                        return list.concat(<Square
                            key = {look+pos}
                            tileheight={this.props.tileheight} 
                            tilewidth={this.props.tilewidth}
                            x={board.getIn([pos,0,"x"])}
                            y={board.getIn([pos,0,"y"])}>
                                <div className={"tile "+look}></div>
                            </Square>);
                    },list,this);
                },[],this) }
            </div>
        )
    }
});

module.exports = Terrain;