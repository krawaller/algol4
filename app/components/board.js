/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Terrain = require('./terrain'),
    Pieces = require('./pieces'),
    Marks = require('./marks'),
    Controls = require('./controls'),
    History = require('./history'),
    Status = require('./status'),
    Algol = require("../../src/index"),
    I = require("../../src/immutableextensions"),
    _ = require("lodash"),
    games = require("../games");

var Board = React.createClass({
    mixins: [Router.State],
    getInitialState: function(){
        var game = Algol.newGame(games[this.getParams().gamename],2);
        return {
            state: game,
            terrainstate: game,
            history: [[{player:0,command:"start"},game.delete("availableMarks")]],
            playing: true,
            index: 0
        };
    },
    doCommand: function(cmnd){
        var newstate = Algol.performOption(this.state.state,cmnd),
            history = this.state.history;
        if (cmnd.first()==="passto"){ // TODO ALSO win lose stuff! :)
            var newl = [], finalstate = toaddstate = this.state.state, previousstep, sinfo;
            while ((previousstep = toaddstate.get("previousstep"))) {
                sinfo = toaddstate.get("steps").last();
                newl = [[{
                    player:previousstep.get("player"),
                    command:sinfo.get("command"),
                    marks: sinfo.get("marks"),
                    id: finalstate.get("turn")+(finalstate.get("steps").size > 1 ? ":"+toaddstate.get("steps").size : '')
                },toaddstate.set("currentMarks",previousstep.get("currentMarks"))]].concat(newl);
                toaddstate = previousstep;
            }
            history = history.concat(newl);
        }
        this.setState({"state":newstate,"history":history});
        //console.log("LAYERS IN NEW STATE",newstate.get("layers").toJS());
        //console.log("Command",cmnd.toJS());
    },
    changeIndex: function(i){
        this.setState({"index":i});
    },
    render: function() {
        var me = this, s = this.state,
            playing = s.playing,
            state = playing ? s.state : s.history[s.index][1] ;
            board = state.getIn(["layers","board"]),
            height = state.getIn(["gamedef","board","height"]),
            width = state.getIn(["gamedef","board","width"]),
            tileheight = 100/height,
            tilewidth = 100/width,
            style = {
                height: height*40+"px;",
                width: width*40+"px;"
            };
        return (
            <div>
                <p><button onClick={function(){me.setState({playing:!me.state.playing})}}>{playing ? "Switch to history" : "Switch to playing"}</button></p>
                {playing ? <Status state={state} /> : <div className="status">Click a history entry to see that board position!</div>}
                {playing ? <Controls state={state} broadcaster={this.doCommand} /> : <History list={s.history} index={s.index} changer={this.changeIndex} />}
                <div className="board" style={style}>
                    <Terrain state={s.terrainstate} tileheight={tileheight} tilewidth={tilewidth} />
                    <Pieces state={state} tileheight={tileheight} tilewidth={tilewidth} />
                    <Marks state={state} tileheight={tileheight} tilewidth={tilewidth} broadcaster={playing ? this.doCommand : function(){} } />
                </div>
            </div>
        );
    }
});

module.exports = Board;