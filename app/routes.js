/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    Game = require('./components/game'),
    Home = require('./components/home'),
    SelectGame = require('./components/selectgame'),
    Wrapper = require('./components/wrapper'),
    GameInfo = require("./components/gameinfo"),
    SelectBattle = require("./components/selectbattle"),
    Playing = require("./components/playing"),
    History = require("./components/history");

module.exports = (
    <Route handler={Wrapper}>
        <Route handler={Game} path="/game">
            <Route name="gameinfo" path="/game/:gamename/info" handler={GameInfo} />
            <Route name="gamebattleslocal" path="/game/:gamename/local" handler={SelectBattle} />
            <Route name="battleplay" path="/game/:gamename/battle/:battleid/play" handler={Playing} />
            <Route name="battlehistory" path="/game/:gamename/battle/:battleid/history/:historyindex" handler={History} />
        </Route>
        <Route name="selectgame" path="/games" handler={SelectGame} />
        <DefaultRoute name="home" handler={Home} />
    </Route>
);