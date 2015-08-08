/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    Board = require('./components/board'),
    Wrapper = require('./components/wrapper');

module.exports = (
    <Route handler={Wrapper}>
        <DefaultRoute handler={Board} />
    </Route>
);