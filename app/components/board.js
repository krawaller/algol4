/** @jsx React.DOM */

var React = require('react'),
    Terrain = require('./terrain'),
    Pieces = require('./pieces'),
    Algol = require("../../src/index"),
    I = require("../../src/immutableextensions"),
    archers = I.fromJS(require("../../games/archers.json")),
    state = Algol.prepareNewGameState(archers,2);

var Board = React.createClass({
    render: function() {
        return (
            <div>
                <Terrain state={state} />
                <Pieces state={state} />
            </div>
        );
    }
});

module.exports = Board;