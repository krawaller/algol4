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
            kings: "♚",
            flags: "⚑",
            flakes: "❄",
            hearts: "♥",
            diamonds: "♦",
            triangles: "▲",
            fourstars: "✦",
            fivestars: "★",
            circles: "●"

        };
        var lineicons = {
            pawns: "♙",
            knights: "♘",
            bishops: "♗",
            rooks: "♖",
            queens: "♕",
            kings: "♔",
            flags: "⚐",
            hearts: "♡",
            diamonds: "♢",
            triangles: "△",
            fourstars: "✧",
            fivestars: "☆",
            circles: "○"
        };
        var p = this.props;
        return (
            <div className={"piece dir"+(p.dir||1)+" owner"+(p.owner||0)+" "+({projectiles:1,highlight:1}[p.icon]?p.icon:"")}>
                <span>{fullicons[p.icon]||''}</span>
                <span className="background">{lineicons[p.icon]||''}</span>
            </div>
        );
    }
});

module.exports = Piece;