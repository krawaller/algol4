/** @jsx React.DOM */

var React = require('react'),
    Mark = require('./mark');

var Marks = React.createClass({
    render: function() {
        var state = this.props.state,
            board = state.getIn(["layers","board"]),
            cb = this.props.broadcaster;
        return (
            <div className="marks">
                { state.get("availableMarks").merge(state.get("currentMarks")).reduce(function(list,cmnd,pos){
                    return list.concat(<Mark
                        key = {pos}
                        tileheight={this.props.tileheight} 
                        tilewidth={this.props.tilewidth}
                        x={board.getIn([pos,0,"x"])}
                        y={board.getIn([pos,0,"y"])}
                        isset={state.get("currentMarks").has(pos)}
                        cb={(function(){
                            cb(cmnd);
                        })}
                    />);
                },[],this) }
            </div>
        )
    }
});

module.exports = Marks;