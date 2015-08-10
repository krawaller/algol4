/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Link = Router.Link,
    Terrain = require('./terrain'),
    Pieces = require('./pieces'),
    Marks = require('./marks'),
    Controls = require('./controls'),
    Status = require('./status'),
    Algol = require("../../src/index"),
    I = require("../../src/immutableextensions"),
    _ = require("lodash"),
    games = {
        archers: I.fromJS(require("../../games/archers.json")),
        krieg: I.fromJS(require("../../games/krieg.json")),
        daggers: I.fromJS(require("../../games/daggers.json")),
        amazons: I.fromJS(require("../../games/amazons.json")),
        sombrero: I.fromJS(require("../../games/sombrero.json"))
    };

var SelectGame = React.createClass({
    render: function() {
        return (
            <div>
                <p>Choose game:</p>
                <ul>
                { _.reduce(games,function(ret,def,name){
                    return ret.concat(
                        <li key={name}>
                            <Link key={name} to="game" params={{gamename:name}}>{name}</Link>
                            {' '}(<a href={games[name].getIn(["source"])}>rules</a>)
                        </li>

                    );
                },[],this) }
                </ul>
            </div>
        );
    }
});

module.exports = SelectGame;