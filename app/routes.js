/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    Battle = require('./components/battle'),
    SelectGame = require('./components/selectgame'),
    SelectBattle = require('./components/selectbattle'),
    Wrapper = require('./components/wrapper');

module.exports = (
    <Route handler={Wrapper}>
        <Route name="game" path="/game/:gamename/" handler={SelectBattle} />
    	<Route name="battle" path="/game/:gamename/battle/:battleid" handler={Battle} />
        <DefaultRoute handler={SelectGame} />
    </Route>
);