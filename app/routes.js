/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    Terrain = require('./components/terrain'),
    Wrapper = require('./components/wrapper');

module.exports = (
    <Route handler={Wrapper}>
        <DefaultRoute handler={Terrain} />
    </Route>
);