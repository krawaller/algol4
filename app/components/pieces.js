/** @jsx React.DOM */

var React = require('react'),
    Piece = require('./piece');

var Pieces = React.createClass({
    render: function() {
        var state = this.props.state,
            graphics = state.getIn(["gamedef","graphics"]),
            board = state.getIn(["layers","board"]),
            height = state.getIn(["gamedef","board","height"]),
            width = state.getIn(["gamedef","board","width"]);
        return (
            <div className="pieces">
                { graphics.get("icons").reduce(function(list,look,layer){
                    return state.getIn(["layers",layer]).reduce(function(list,arr,pos){
                        var x = board.getIn([pos,0,"x"]), y = board.getIn([pos,0,"y"]);
                        return arr.reduce(function(list,entity){
                            return list.concat(<Piece
                                key = {entity.get("id")}
                                boardheight={height} 
                                boardwidth={width}
                                x={x}
                                y={y}
                                icon={look+entity.get("owner")}
                                dir={entity.get("dir")}
                            />);
                        },list);
                    },list);
                },[]) }
            </div>
        )
    }
});

module.exports = Pieces;