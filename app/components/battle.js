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
        var params = this.getParams(),
            game = Algol.newGame(games[params.gamename],2),
            battledata = JSON.parse(window.localStorage.getItem(params.battleid)),
            history = [[{player:0,command:"start"},game.delete("availableMarks")]];
        //console.log("Gonna load",battledata.save);
        _.each(battledata.save||[],function(steps){
            _.each(steps,function(step){
                var markname = game.getIn(["availableMarks",step]);
                //console.log("Ok, step is",step,"markname is",markname,"game is",game,"in JS it is",game);
                game = (markname ? Algol.makeMark(game,markname,step) : Algol.makeCommand(game,step));
            });
            history = this.addTurnToHistory(game,history);
            game = Algol.makeCommand(game,"endturn");
        },this);
        return {
            state: game,
            terrainstate: game,
            history: history,
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
    addTurnToHistory: function(state,history){
        var newl = [], finalstate = toaddstate = state, previousstep, sinfo;
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
        return history.concat(newl);
    },
    makeCommand: function(cmnd){
        var newstate = Algol.makeCommand(this.state.state,cmnd),
            history = this.state.history;
        if (cmnd==="endturn"){
            history = this.addTurnToHistory(this.state.state,history);
            /*var newl = [], finalstate = toaddstate = this.state.state, previousstep, sinfo;
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
            history = history.concat(newl);*/
            //console.log("Woohoo")

            // update battle
            var battleid = this.getParams().battleid,
                battledata = JSON.parse(window.localStorage.getItem(battleid));
            battledata.save = newstate.get("save").toJS();
            battledata.status = newstate.get("endedby") || "ongoing";
            battledata.who = newstate.get("player") || newstate.get("winner");
            battledata.turn = newstate.get("turn");
            window.localStorage.setItem(battleid,JSON.stringify(battledata));

            // update list
            var gamename = this.getParams().gamename,
                list = JSON.parse(window.localStorage.getItem(gamename+"-battles")||"{}");
            delete battledata.save;
            list[battleid] = battledata;
            window.localStorage.setItem(gamename+"-battles",JSON.stringify( list ));

        }
        this.setState({ state: newstate, history: history });
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
        //console.log("RENDER",s.state.get("layers").toJS(),"context",s.state.get("context").toJS(),s.state.getIn(["data","units"]).toJS(),s.state.get("save").toJS(),s.state.get("path").toJS());
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