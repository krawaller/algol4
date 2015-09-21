/** @jsx React.DOM */

var React = require('react/addons'),
    ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    Piece = require('./piece'),
    Square = require('./square'),
    I = require('../../src/immutableextensions'),
    _ = require('lodash');

var Pieces = React.createClass({
    render: function() {
        var battle = this.props.state,
            graphics = battle.getIn(["gamedef","graphics"]),
            board = battle.getIn(["layers","board"]),
            units;
        units = graphics.get("icons").reduce(function(list,look,layer){
            return list.concat((battle.getIn(["layers",layer])||I.Map()).toList().reduce(function(list,arr,pos){
                return list.concat(arr.map(function(u){
                    return u.set("look",look).set("ident",parseInt((u.get("id")||u.get("parentid")).replace(/unit/,""))*100+parseInt(u.get("suffix")||0));
                }).toJS());
            },[]));
        },[]).sort(function(u1,u2){ return u1.ident > u2.ident ? 1 : -1; });
        var DOMS = _.map(units,function(entity){
            var pos = entity.pos,
                x = board.getIn([pos,0,"x"]),
                y = board.getIn([pos,0,"y"]),
                viewdir = graphics.get("rotatepieces") ? entity.dir || 1 : 1;
            return <Square
                key = {entity.ident}
                tileheight={this.props.tileheight} 
                tilewidth={this.props.tilewidth}
                x={x}
                y={y}>
                    <Piece icon={entity.look} owner={entity.owner} dir={viewdir}/>
                </Square>;
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