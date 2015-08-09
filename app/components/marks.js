/** @jsx React.DOM */

var React = require('react'),
    Mark = require('./mark'),
    I = require('../../src/immutableextensions');

var Marks = React.createClass({
    render: function() {
        var state = this.props.state,
            board = state.getIn(["layers","board"]),
            cb = this.props.broadcaster;
        return (
            <div className="marks">
                { (state.get("availableMarks")||I.Map()).merge(state.get("currentMarks")||I.Map()).reduce(function(list,cmnd,pos){
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