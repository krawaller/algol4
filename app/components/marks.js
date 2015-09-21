/** @jsx React.DOM */

var React = require('react'),
    Square = require('./square'),
    Router = require('react-router'),
    I = require('../../src/immutableextensions'),
    battleactions = require("../actions/battleactions");

var Marks = React.createClass({
    mixins: [Router.State],
    render: function() {
        var battle = this.props.state,
            board = battle.getIn(["layers","board"]),
            playing = this.getPath().match(/play$/);
        return (
            <div className="marks">
                { (battle.get("marks")||I.Map()).reduce(function(list,pos,markname){
                    return list.concat(
                        <Square
                            key = {pos}
                            tileheight={this.props.tileheight} 
                            tilewidth={this.props.tilewidth}
                            x={board.getIn([pos,0,"x"])}
                            y={board.getIn([pos,0,"y"])}>
                                <a className="mark setmark" onClick={
                                    (function(e){
                                        e && e.preventDefault() && e.stopPropagation();
                                        if (!playing){
                                            return;
                                        }
                                        battleactions.removeMark(markname);
                                    })
                                }>&nbsp;</a>
                        </Square>
                    );
                },[],this) }
                
                { (playing && battle.get("availableMarks")||I.Map()).reduce(function(list,markname,pos){
                    return list.concat(<Square
                        key = {pos}
                        tileheight={this.props.tileheight} 
                        tilewidth={this.props.tilewidth}
                        x={board.getIn([pos,0,"x"])}
                        y={board.getIn([pos,0,"y"])}>
                            <a className="mark potentialmark" onClick={
                                (function(e){
                                    e && e.preventDefault() && e.stopPropagation();
                                    battleactions.makeMark(markname,pos);
                                })
                            }>&nbsp;</a>
                        </Square>
                    );
                },[],this) }
            </div>
        )
    }
});

module.exports = Marks;