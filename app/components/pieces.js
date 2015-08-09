/** @jsx React.DOM */

var React = require('react/addons'),
    ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    Piece = require('./piece'),
    I = require('../../src/immutableextensions');

var Pieces = React.createClass({
    render: function() {
        var state = this.props.state,
            graphics = state.getIn(["gamedef","graphics"]),
            board = state.getIn(["layers","board"]);
        return (
            <div className="pieces">
                <ReactCSSTransitionGroup transitionName="pieces">
                    { graphics.get("icons").reduce(function(list,look,layer){
                        return (state.getIn(["layers",layer])||I.Map()).reduce(function(list,arr,pos){
                            var x = board.getIn([pos,0,"x"]), y = board.getIn([pos,0,"y"]);
                            return arr.reduce(function(list,entity){
                                return list.concat(<Piece
                                    key = {entity.get("id") || entity.get("parentid")+entity.get("suffix")}
                                    tileheight={this.props.tileheight} 
                                    tilewidth={this.props.tilewidth}
                                    x={x}
                                    y={y}
                                    icon={look}
                                    owner={entity.get("owner")}
                                    dir={entity.get("dir")}
                                />);
                            },list,this);
                        },list,this);
                    },[],this) }
                </ReactCSSTransitionGroup>
            </div>
        )
    }
});

module.exports = Pieces;