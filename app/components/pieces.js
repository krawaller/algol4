/** @jsx React.DOM */

var React = require('react/addons'),
    ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    Piece = require('./piece'),
    I = require('../../src/immutableextensions'),
    _ = require('lodash');

var Pieces = React.createClass({
    render: function() {
        var state = this.props.state,
            graphics = state.getIn(["gamedef","graphics"]),
            board = state.getIn(["layers","board"]),
            units;
        units = graphics.get("icons").reduce(function(list,look,layer){
            return list.concat((state.getIn(["layers",layer])||I.Map()).toList().reduce(function(list,arr,pos){
                return list.concat(arr.map(function(u){
                    return u.set("look",look).set("ident",u.get("id")||u.get("parentid")+u.get("suffix"));
                }).toJS());
            },[]));
        },[]).sort(function(u1,u2){
            return parseInt(u1.ident.replace(/unit/,'')) > parseInt(u2.ident.replace(/unit/,'')) ? 1 : -1;
        });
        var DOMS = _.map(units,function(entity){
            var pos = entity.pos,
                x = board.getIn([pos,0,"x"]),
                y = board.getIn([pos,0,"y"]),
                viewdir = graphics.get("rotatepieces") ? entity.dir || 1 : 1;
            return <Piece
                key = {entity.ident}
                tileheight={this.props.tileheight} 
                tilewidth={this.props.tilewidth}
                x={x}
                y={y}
                icon={entity.look}
                owner={entity.owner}
                dir={viewdir}
            />;
        },this);
        return (
            <div className="pieces">
                <ReactCSSTransitionGroup transitionName="pieces">
                    { DOMS }
                </ReactCSSTransitionGroup>
            </div>
        );
    }
});

module.exports = Pieces;