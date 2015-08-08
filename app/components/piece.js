/** @jsx React.DOM */

var React = require('react');

var Piece = React.createClass({
    render: function() {
        var offx = 100/this.props.boardwidth, offy = 100/this.props.boardheight, css = {
            height: offy+"%",
            width: offx+"%",
            top: (this.props.y-1)*offy+"%",
            left: (this.props.x-1)*offx+"%"
        };
        return ( <div style={css} className={"piece"}><span>{this.props.icon}</span></div> );
    }
});

module.exports = Piece;