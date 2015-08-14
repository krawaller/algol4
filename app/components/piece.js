/** @jsx React.DOM */

var React = require('react');

var Piece = React.createClass({
    render: function() {
        var fullicons = {
            pawns: "♟",
            knights: "♞",
            bishops: "♝",
            rooks: "♜",
            queens: "♛",
            kings: "♚"
        };
        var lineicons = {
            pawns: "♙",
            knights: "♘",
            bishops: "♗",
            rooks: "♖",
            queens: "♕",
            kings: "♔"
        };
        var p = this.props, css = {
            height: p.tileheight+"%",
            width: p.tilewidth+"%",
            top: (p.y-1)*p.tileheight+"%",
            left: (p.x-1)*p.tilewidth+"%"
        };
        return ( <div style={css} className="square">
        	<div className={"piece dir"+(p.dir||1)+" owner"+(p.owner||0)+" "+(p.icon==="projectiles"?"projectiles":"")}>
                <span>{fullicons[p.icon]||''}</span>
                <span className="background">{lineicons[p.icon]||''}</span>
            </div>
        </div>);
    }
});

module.exports = Piece;