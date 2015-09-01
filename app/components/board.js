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
    removeMark: function(markname){
        //console.log("in board.js caught removemark",markname);
        this.setState({ state: Algol.removeMark(this.state.state,markname) });
    },
    addMark: function(markname,pos){
        this.setState({ state: Algol.makeMark(this.state.state,markname,pos) });
    },
    makeCommand: function(cmnd){
        var newstate = Algol.makeCommand(this.state.state,cmnd),
            history = this.state.history;
        if (cmnd==="endturn"){
            var newl = [], finalstate = toaddstate = this.state.state, previousstep, sinfo;
            while (toaddstate.has("undo")) {
                previousstep = toaddstate.getIn(["cache",toaddstate.get("undo")]);
                sinfo = toaddstate.get("steps").last();
                newl = [[{
                    player:previousstep.get("player"),
                    command:sinfo.get("command"),
                    marks: sinfo.get("marks"),
                    id: finalstate.get("turn")+(finalstate.get("steps").size > 1 ? ":"+toaddstate.get("steps").size : '')
                },toaddstate.set("marks",previousstep.get("marks"))]].concat(newl);
                toaddstate = previousstep;
            }
            history = history.concat(newl);
            //console.log("Woohoo")
        }
        this.setState({ state: newstate, history: history });
    },
    changeIndex: function(i){
        this.setState({"index":i});
    },
    render: function() {
        //console.log("RENDER",this.state.state.get("layers").toJS(),"context",this.state.state.get("context").toJS());
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
                {playing ? <Controls state={state} makeCommand={this.makeCommand} /> : <History list={s.history} index={s.index} changer={this.changeIndex} />}
                <div className="board" style={style}>
                    <Terrain state={s.terrainstate} tileheight={tileheight} tilewidth={tilewidth} />
                    <Pieces state={state} tileheight={tileheight} tilewidth={tilewidth} />
                    <Marks state={state} tileheight={tileheight} tilewidth={tilewidth} addMark={playing ? this.addMark : function(){} } removeMark={playing ? this.removeMark : function(){} } />
                </div>
            </div>
        );
    }
});

module.exports = Board;