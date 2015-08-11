/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Terrain = require('./terrain'),
    Pieces = require('./pieces'),
    Marks = require('./marks'),
    Controls = require('./controls'),
    Status = require('./status'),
    Algol = require("../../src/index"),
    I = require("../../src/immutableextensions"),
    _ = require("lodash"),
    games = require("../games");

var Board = React.createClass({
    mixins: [Router.State],
    getInitialState: function(){
        var game = Algol.prepareNewGameState(games[this.getParams().gamename],2);
        return {
            state: game,
            terrainstate: game
        };
    },
    doCommand: function(cmnd){
        var newstate = Algol.performOption(this.state.state,cmnd);
        this.setState({"state":newstate});
        console.log("NEW STATE",newstate.toJS());
    },
    render: function() {
        var state = this.state.state;
            board = state.getIn(["layers","board"]),
            height = state.getIn(["gamedef","board","height"]),
            width = state.getIn(["gamedef","board","width"]),
            tileheight = 100/height,
            tilewidth = 100/width;
        return (
            <div>
                <Status state={state} />
                <div className="board">
                    <Terrain state={this.state.terrainstate} tileheight={tileheight} tilewidth={tilewidth} />
                    <Pieces state={state} tileheight={tileheight} tilewidth={tilewidth} />
                    <Marks state={state} tileheight={tileheight} tilewidth={tilewidth} broadcaster={this.doCommand} />
                    <Controls state={state} top={tileheight*height} broadcaster={this.doCommand} />
                </div>
            </div>
        );
    }
});

module.exports = Board;