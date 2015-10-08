/** @jsx React.DOM */

var React = require('react'),
    Square = require('./square'),
    I = require('../../src/immutableextensions');

var Highlight = React.createClass({
    render: function() {
        var state = this.props.state,
            graphics = state.getIn(["gamedef","graphics"]),
            look = graphics.get("highlight"),
            board = state.getIn(["layers","board"]);
        return (
            <div className="terrain highlight">
                { (state.getIn(["layers",look])||I.Map()).reduce(function(list,arr,pos){
                    return list.concat(<Square
                        key = {Math.random()}
                        tileheight={this.props.tileheight} 
                        tilewidth={this.props.tilewidth}
                        x={board.getIn([pos,0,"x"])}
                        y={board.getIn([pos,0,"y"])}>
                            <div className={"tile plr"+(arr.getIn([0,"owner"])||0)}></div>
                        </Square>);
                },[],this) }
            </div>
        )
    }
});

module.exports = Highlight;