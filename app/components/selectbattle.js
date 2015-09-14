/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    _ = require("lodash"),
    Link = Router.Link,
    games = require("../games"),
    listactions = require("../actions/listactions");

var SelectBattle = React.createClass({
    mixins: [Router.Navigation,Router.State],
    newBattle: function(){
        var id = (Math.random()+""+Math.random()).replace(/\./g,"");
        var gamename = this.getParams().gamename;
        var battle = {
            id: id,
            game: gamename,
            players: ["player1","player2"],
            status: "ongoing",
            turn: 0,
            who: 1
        };
        var list = JSON.parse(window.localStorage.getItem(gamename+"-battles")||"{}");
        list[id] = battle;
        window.localStorage.setItem(gamename+"-battles",JSON.stringify( list ));
        window.localStorage.setItem(id,JSON.stringify(battle));
        this.transitionTo("battle",{gamename:gamename,battleid:id});
    },
    render: function() {
        var gamename = this.getParams().gamename,
            list = JSON.parse(window.localStorage.getItem("algol-"+gamename+"-currentlocalbattles")||"{}"),
            list2 = JSON.parse(window.localStorage.getItem("algol-"+gamename+"-finishedlocalbattles")||"{}");
        return (
            <div>
                <p>
                    <button onClick={listactions.newBattle}>New battle</button>
                </p>
                <p>Current local battles:</p>
                <ul>
                { _.reduce(list,function(ret,battle,id){
                    var description = id+"   turn: "+battle.turn+"   player: "+battle.who;
                    return ret.concat(
                        <li key={id}>
                            <Link key={id} to="battleplay" params={{gamename:gamename,battleid:id}}>{description}</Link>
                        </li>

                    );
                },[],this) }
                </ul>
                <p>Finished local battles:</p>
                <ul>
                { _.reduce(list2,function(ret,battle,id){
                    var description = id+"   turn: "+battle.turn+"   winner: "+battle.who;
                    return ret.concat(
                        <li key={id}>
                            <Link key={id} to="battleplay" params={{gamename:gamename,battleid:id}}>{description}</Link>
                        </li>

                    );
                },[],this) }
                </ul>
            </div>
        );
    }
});

module.exports = SelectBattle;