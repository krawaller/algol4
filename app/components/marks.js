/** @jsx React.DOM */

var React = require('react'),
    Mark = require('./mark'),
    I = require('../../src/immutableextensions');

var Marks = React.createClass({
    render: function() {
        var state = this.props.state,
            add = this.props.addMark,
            remove = this.props.removeMark,
            board = state.getIn(["layers","board"]);
        return (
            <div className="marks">
                
                    { (state.get("marks")||I.Map()).reduce(function(list,pos,markname){
                        //console.log("existing mark",markname,"at pos",pos);
                        return list.concat(<Mark
                            key = {pos}
                            tileheight={this.props.tileheight} 
                            tilewidth={this.props.tilewidth}
                            x={board.getIn([pos,0,"x"])}
                            y={board.getIn([pos,0,"y"])}
                            isset={true}
                            cb={(function(e){
                                e && e.preventDefault() && e.stopPropagation();
                                //console.log("Clicked removemark for",markname);
                                remove(markname); // cb( state.getIn(["removeMarks",markname]) );
                            })}
                        />);
                    },[],this) }
                    
                    { (state.get("availableMarks")||I.Map()).reduce(function(list,markname,pos){
                        return list.concat(<Mark
                            key = {pos}
                            tileheight={this.props.tileheight} 
                            tilewidth={this.props.tilewidth}
                            x={board.getIn([pos,0,"x"])}
                            y={board.getIn([pos,0,"y"])}
                            isset={false}
                            cb={(function(e){
                                e && e.preventDefault() && e.stopPropagation();
                                add(markname,pos);
                                //cb( newstateid );
                            })}
                        />);
                    },[],this) }

            </div>
        )
    }
});

module.exports = Marks;