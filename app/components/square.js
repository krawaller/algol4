/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router');

var Square = React.createClass({
    render: function() {
        var css = {
            height: this.props.tileheight+"%",
            width: this.props.tilewidth+"%",
            bottom: (this.props.y-1)*this.props.tileheight+"%",
            left: (this.props.x-1)*this.props.tilewidth+"%"
        };
        return ( <div style={css} className="square">
        	{this.props.children}
        </div>);
    }
});

module.exports = Square;