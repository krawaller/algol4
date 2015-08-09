/** @jsx React.DOM */

var React = require('react');

var Tile = React.createClass({
    render: function() {
        var css = {
            height: this.props.tileheight+"%",
            width: this.props.tileheight+"%",
            top: (this.props.y-1)*this.props.tileheight+"%",
            left: (this.props.x-1)*this.props.tilewidth+"%"
        };
        return ( <div style={css} className="square">
        	<div className={"tile "+this.props.look}></div>
        </div>);
    }
});

module.exports = Tile;