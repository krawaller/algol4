/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    Board = require('./components/board'),
    SelectGame = require('./components/selectgame'),
    Wrapper = require('./components/wrapper');

module.exports = (
    <Route handler={Wrapper}>
    	<Route name="game" path="/game/:gamename" handler={Board} />
        <DefaultRoute handler={SelectGame} />
    </Route>
);