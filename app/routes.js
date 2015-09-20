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
    Multiroute = require("./components/multiroute"),
    Playing = require("./components/playing"),
    History = require("./components/history");

module.exports = (
    <Route handler={Wrapper}>
        <Route handler={Game} path="/game/:gamename">
            <Route name="gameinfo" path="info" handler={GameInfo} />
            <Route name="gamebattleslocal" path="local" handler={SelectBattle} />
            <Route name="battleplay" path="battle/:battleid/play" handler={Playing} />
            <Route name="battlehistory" path="/game/:gamename/battle/:battleid/history/" handler={Multiroute}>
                <Route name="battlehistoryat" path=":historyindex" handler={History} />
                <DefaultRoute name="battlehistory0" handler={History} />
            </Route>
        </Route>
        <Route name="selectgame" path="/games" handler={SelectGame} />
        <DefaultRoute name="home" handler={Home} />
    </Route>
);