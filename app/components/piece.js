/** @jsx React.DOM */

var React = require('react');

var Piece = React.createClass({
    render: function() {
        var p = this.props, css = {
            height: p.tileheight+"%",
            width: p.tileheight+"%",
            top: (p.y-1)*p.tileheight+"%",
            left: (p.x-1)*p.tilewidth+"%"
        };
        return ( <div style={css} className="square">
        	<div className={"piece dir"+(p.dir||1)+" owner"+(p.owner||0)+" "+(p.icon==="projectiles"?"projectiles":"")}><span>{p.icon.substr(0,1).toUpperCase()}</span></div>
        </div>);
    }
});

module.exports = Piece;