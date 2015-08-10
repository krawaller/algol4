/** @jsx React.DOM */

var React = require('react'),
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
    };

var Board = React.createClass({
    getInitialState: function(){
        return {};
    },
    chooseGame: function(def){
        this.setState({
            state: Algol.prepareNewGameState(def,2)
        });
    },
    doCommand: function(cmnd){
        this.setState({"state":Algol.performOption(this.state.state,cmnd)});
    },
    render: function() {
        if (!this.state.state){
            return (
                <div>
                    <p>Choose game:</p>
                    <ul>
                    { _.reduce(games,function(ret,def,name){
                        return ret.concat(
                            <li
                                key={name}
                                onClick={function(){this.chooseGame(def);}.bind(this)}
                            >{name}</li>
                        );
                    },[],this) }
                    </ul>
                </div>
            );
        }
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
                    <Terrain state={state} tileheight={tileheight} tilewidth={tilewidth} />
                    <Pieces state={state} tileheight={tileheight} tilewidth={tilewidth} />
                    <Marks state={state} tileheight={tileheight} tilewidth={tilewidth} broadcaster={this.doCommand} />
                    <Controls state={state} top={tileheight*height} broadcaster={this.doCommand} />
                </div>
            </div>
        );
    }
});

module.exports = Board;