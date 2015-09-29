/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    RouteHandler = Router.RouteHandler,
    Link = Router.Link,
    Terrain = require('./terrain'),
    Pieces = require('./pieces'),
    Marks = require('./marks'),
    Controls = require('./controls'),
    Status = require('./status'),
    Algol = require("../../src/index"),
    I = require("../../src/immutableextensions"),
    _ = require("lodash"),
    games = require("../games"),
    battleactions = require("../actions/battleactions"),
    Reflux = require("reflux"),
    listactions = require("../actions/listactions"),
    battleactions = require("../actions/battleactions");

var Game = React.createClass({
    mixins: [Router.Navigation,Router.State,Reflux.listenToMany(listactions),Reflux.listenToMany(battleactions)],
    saveBattleMoves: function(gamename,battleid,moves){
        //console.log("Saving battle moves",battleid,"moves",moves);
        window.localStorage.setItem("algol-"+gamename+"-localbattle-"+battleid,JSON.stringify(moves||[]));
    },
    loadBattleMoves: function(gamename,battleid){
        var savename = "algol-"+gamename+"-localbattle-"+battleid,
            save = window.localStorage.getItem(savename);
        //console.log("Tried to load",savename,"got",save);
        return JSON.parse(save||"[]");
    },
    updateEntryInList: function(gamename,battleid,battle){
        var savename = "algol-"+gamename+"-currentlocalbattles",
            list = JSON.parse(window.localStorage.getItem(savename)||"{}");
        list[battleid] = _.extend(list[battleid],{
            updated: Date.now(),
            turn: battle.get("turn"),
            who: battle.get("player")
        });
        window.localStorage.setItem(savename,JSON.stringify( list ));
        //entry.status = battle.get("endedby") || "ongoing";
        //entry.who = battle.get("player") || battle.get("winner");
        //entry.turn = battle.get("turn");
    },
    moveEntryToFinishedList: function(gamename,battleid,battle){
        var ongoingsavename = "algol-"+gamename+"-currentlocalbattles",
            ongoinglist = JSON.parse(window.localStorage.getItem(ongoingsavename)||"{}"),
            finishedsavename = "algol-"+gamename+"-finishedlocalbattles",
            finishedlist = JSON.parse(window.localStorage.getItem(finishedsavename)||"{}");
        finishedlist[battleid] = _.extend(ongoinglist[battleid],{
            "who": battle.get("winner"),
            "endedby": battle.get("endedby"),
            "updated": Date.now()
        });
        delete ongoinglist[battleid];
        window.localStorage.setItem(ongoingsavename,JSON.stringify( ongoinglist ));
        window.localStorage.setItem(finishedsavename,JSON.stringify( finishedlist ));
    },
    addTurnToHistory: function(tree,id,hist){
        //console.log("Gonna add turn to hist, previous hist was",hist)
        var newl = [], finalbattle = toaddbattle = tree.getIn(["cache",id]), previousstep, sinfo;
        //console.log("Adding turn to history!",tree.toJS(),"id",id,"history",hist);
        while (toaddbattle.has("undo")) {
            //console.log("Adding one cmnd back!");
            previousstep = tree.getIn(["cache",toaddbattle.get("undo")]);
            if (!previousstep){
                console.log("Alarm! was at",toaddbattle.get("id"),"which has bogus undo to",toaddbattle.get("undo"));
            }
            sinfo = toaddbattle.get("steps").last();
            newl = [[{
                player:previousstep.get("player"),
                command:sinfo.get("command"),
                marks: sinfo.get("marks"),
                id: finalbattle.get("turn")+(finalbattle.get("steps").size > 1 ? ":"+toaddbattle.get("steps").size : '')
            },toaddbattle.set("marks",previousstep.get("marks"))]].concat(newl);
            toaddbattle = previousstep;
        }
        //console.log("here's the full list of what's added",newl);
        return hist.concat(newl);
    },
    componentWillReceiveProps: function(nextProps){
        var battleid = this.getParams().battleid,
            s = this.state;
        if (this.props.gamename === nextProps.gamename && battleid && battleid !== s.battleid){
            console.log("Loading new battle!");
            this.setState(this.getInitialState());
        }
    },
    getInitialState: function(){
        var gamename = this.props.gamename,
            battleid = this.getParams().battleid,
            tree = this.props.tree,
            start = this.props.tree.getIn(["cache","root"]),
            battle = start,
            hist = [[{player:0,command:"start"},start.deleteIn(["cache","root","availableMarks"])]],
            turns = battleid && this.loadBattleMoves(gamename,battleid);
        // perform turns, adding them to hist
        _.each(turns||[],function(steps,t){
            _.each(steps,function(step){
                var currentid = tree.get("current");
                    markname = tree.getIn(["cache",currentid,"availableMarks",step]);
                tree = (markname ? Algol.makeMark(tree,currentid,markname,step,true) : Algol.makeCommand(tree,currentid,step,true));
            });
            hist = this.addTurnToHistory(tree,tree.get("current"),hist,true);
            //console.log("ending turn",t,"out of",turns.length,"and means",t+1<turns.length);
            tree = Algol.endTurn(tree,tree.get("current"),t+1<turns.length);
        },this);
        // prune only latest if we're playing
        tree = Algol.pruneOptions(tree,tree.get("current"));
        // return state
        return {
            battle: tree.getIn(["cache",tree.get("current")]),
            start: start,
            tree: tree,
            hist: hist,
            gamename: gamename,
            battleid: battleid
        };
    },
    onNewBattle: function(plr1,plr2){
        var id = (Math.random()+""+Math.random()).replace(/\./g,"");
        var gamename = this.getParams().gamename;
        var entry = {
            id: id,
            game: gamename,
            players: [plr1||"player1",plr2||"player2"],
            turn: 0,
            who: 1,
            created: Date.now(),
            updated: Date.now()
        };
        var list = JSON.parse(window.localStorage.getItem("algol-"+gamename+"-currentlocalbattles")||"{}");
        list[id] = entry;
        window.localStorage.setItem("algol-"+gamename+"-currentlocalbattles",JSON.stringify( list ));
        //window.localStorage.setItem("algol-"+gamename+"-localbattle-"+id,JSON.stringify(entry));
        this.transitionTo("battleplay",{gamename:gamename,battleid:id});
    },
    onMakeMark: function(markname,pos){
        var s = this.state,
            newtree = Algol.makeMark(s.tree,s.battle.get("id"),markname,pos),
            newbattle = newtree.getIn(["cache",newtree.get("current")]);
        this.setState({ battle: newbattle, tree: newtree });
    },
    onRemoveMark: function(markname){
        var s = this.state,
            newtree = Algol.removeMark(s.tree,s.battle.get("id"),markname),
            newbattle = newtree.getIn(["cache",newtree.get("current")]);
        this.setState({ battle: newbattle, tree: newtree });
    },
    onMakeCommand: function(cmnd){
        var s = this.state,
            newtree = Algol.makeCommand(s.tree,s.battle.get("id"),cmnd),
            newbattle = newtree.getIn(["cache",newtree.get("current")]);
            hist = s.hist,
            params = this.getParams(),
            gamename = params.gamename,
            battleid = params.battleid;
        //console.log("Making command, hist is",hist)
        if (cmnd==="endturn"){ // TODO save finish move too!
            //console.log("THe heck",hist);
            hist = this.addTurnToHistory(s.tree,s.battle.get("id"),hist);
            this.saveBattleMoves(gamename,battleid,newbattle.has("save") && newbattle.get("save").toJS() || []);
            if (newbattle.has("endedby")){
                this.moveEntryToFinishedList(gamename,battleid,newbattle);
            } else {
                this.updateEntryInList(gamename,battleid,newbattle);
            }
        } // TODO - figure out why we have to set current for newbattle
        this.setState({ battle: newbattle, hist: hist, tree: newtree });
    },
    render: function() {
        //console.log("RENDER",this.state.tree.toJS());
        var s = this.state,
            histindex = this.getParams().historyindex,
            gamename = this.props.gamename,
            battleid = this.state.battleid,
            battle = s.battle,
            board = battle.getIn(["layers","board"]),
            height = battle.getIn(["gamedef","board","height"]),
            width = battle.getIn(["gamedef","board","width"]),
            tileheight = 100/height,
            tilewidth = 100/width,
            style = {
                height: height*40+"px;",
                width: width*40+"px;"
            };
        if (histindex !== undefined){
            var hi = parseInt(histindex);
            battle = s.hist[hi][1];
        }
        //console.log("RENDER",battle.get("layers").toJS(),"marks",battle.get("marks").toJS(),"data",battle.get("data").toJS())//,"context",battle.get("context").toJS(),battle.getIn(["data","units"]).toJS(),battle.get("save").toJS(),battle.get("path").toJS(),"CONNECTIONS",battle.get("connections").toJS());
        return (
            <div>
                <div className="board" style={style}>
                    <Terrain state={s.start} tileheight={tileheight} tilewidth={tilewidth} />
                    <Pieces state={battle} tileheight={tileheight} tilewidth={tilewidth} />
                    <Marks state={battle} tileheight={tileheight} tilewidth={tilewidth} />
                </div>
                <ul className="nav">
                    <li><Link to={"/game/"+gamename+"/info"}>Info</Link></li>
                    <li><Link to={"/game/"+gamename+"/local"}>Battles</Link></li>
                    {battleid && <li><Link to={"/game/"+gamename+"/battle/"+battleid+"/play"}>Play</Link></li>}
                    {battleid && <li><Link to={"/game/"+gamename+"/battle/"+battleid+"/history/"}>History</Link></li>}
                </ul>
                <div className="side">
                    <RouteHandler battle={battle} history={this.state.hist}/>
                </div>
            </div>
        );
    }
});

module.exports = Game;