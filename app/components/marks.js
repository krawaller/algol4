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
                
                    { (state.get("marks")||I.Map()).reduce(function(list,pos,markname){
                        return list.concat(<Mark
                            key = {pos}
                            tileheight={this.props.tileheight} 
                            tilewidth={this.props.tilewidth}
                            x={board.getIn([pos,0,"x"])}
                            y={board.getIn([pos,0,"y"])}
                            isset={true}
                            cb={(function(e){
                                e && e.preventDefault() && e.stopPropagation();
                                cb( state.getIn(["removeMarks",markname]) );
                            })}
                        />);
                    },[],this) }
                    
                    { (state.get("availableMarks")||I.Map()).reduce(function(list,posobj,markname){
                        return posobj.reduce(function(newstateid,pos){
                            return list.concat(<Mark
                                key = {pos}
                                tileheight={this.props.tileheight} 
                                tilewidth={this.props.tilewidth}
                                x={board.getIn([pos,0,"x"])}
                                y={board.getIn([pos,0,"y"])}
                                isset={false}
                                cb={(function(e){
                                    e && e.preventDefault() && e.stopPropagation();
                                    cb( newstateid );
                                })}
                            />);
                        },list,this);
                    },[],this) }

            </div>
        )
    }
});

module.exports = Marks;