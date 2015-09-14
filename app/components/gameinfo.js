/** @jsx React.DOM */

var React = require('react');

var GameInfo = React.createClass({
    render: function() {
        var meta = this.props.battle.getIn(["gamedef","meta"]);
        return (
            <p>This is nice game named {meta.get("name")}!</p>
        );
    }
});

module.exports = GameInfo;