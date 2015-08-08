/** @jsx React.DOM */

var React = require('react'),
    Tile = require('./tile');

var Terrain = React.createClass({
    render: function() {
        var state = this.props.state,
            graphics = state.getIn(["gamedef","graphics"]),
            board = state.getIn(["layers","board"]),
            height = state.getIn(["gamedef","board","height"]),
            width = state.getIn(["gamedef","board","width"]);
        return (
            <div className={graphics.get("background")+" terrain"}>
                { graphics.get("tiles").set("dark","dark").reduce(function(list,look,layer){
                    return state.getIn(["layers",layer]).reduce(function(list,arr,pos){
                        return list.concat(<Tile
                            key = {look+pos}
                            boardheight={height} 
                            boardwidth={width}
                            x={board.getIn([pos,0,"x"])}
                            y={board.getIn([pos,0,"y"])}
                            look={look}
                        />);
                    },list);
                },[]) }
            </div>
        )
    }
});

module.exports = Terrain;