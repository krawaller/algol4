/** @jsx React.DOM */

var React = require('react');

var GameInfo = React.createClass({
    render: function() {
        var meta = this.props.battle.getIn(["gamedef","meta"]);
        return (
        	<div>
	            <p>This is a game named {meta.get("name")}. The rules are <a href={meta.get("source")}>here</a>.</p>
	            <p>Tags: {meta.get("tags").toJS().join(" ")}</p>
            </div>
        );
    }
});

module.exports = GameInfo;