/** @jsx React.DOM */

var React = require('react'),
    Controls = require('./controls'),
    Status = require('./status');

var Playing = React.createClass({
    render: function() {
        return <div>
            <Status {...this.props} />
            <Controls {...this.props} />
        </div>;
    }
});

module.exports = Playing;