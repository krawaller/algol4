/** @jsx React.DOM */

var React = require('react');

var Mark = React.createClass({
    render: function() {
        var p = this.props, css = {
            height: p.tileheight+"%",
            width: p.tileheight+"%",
            top: (p.y-1)*p.tileheight+"%",
            left: (p.x-1)*p.tilewidth+"%"
        };
        return ( <div onClick={this.props.cb} style={css} className={p.isset ? "mark setmark" : "mark potentialmark"}>&nbsp;</div> );
    }
});

module.exports = Mark;