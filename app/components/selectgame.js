/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
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
    tags = require("../tags");

_.each(games,function(game){
    game.getIn(["meta","tags"]).forEach(function(tag){
        tags[tag] = {};
    });
});

var SelectGame = React.createClass({
    getInitialState: function(){
        return _.mapValues(tags,function(o,t){ return "nevermind"; });
    },
    toggleTag: function(tname){
        var val = {nevermind:"need",need:"never",never:"nevermind"}[this.state[tname]];
        //console.log("toggle",tname,"to",val);
        this.setState(_.object([tname],[val]));
    },
    render: function() {
        var s = this.state, numgames = _.keys(games).length;
        var selgames = _.reduce(games,function(ret,def,name){
            var gametags = games[name].getIn(["meta","tags"]), blah = _.some(tags,function(o,tname){
                //console.log("Game",name,"Checking tag",tname,"set to",s[tname],"game:",gametags.contains(tname));
                return s[tname] === "never" && gametags.contains(tname) || s[tname] === "need" && !gametags.contains(tname);
            });
            return blah ? ret : ret.concat(
                <span className="pill gamelink" key={name}>
                    <Link key={name} to={"/game/"+name+"/info"}>{games[name].getIn(["meta","name"])}</Link>
                    
                </span>
            );
        },[],this);
        return (
            <div>
                <p>Tags:</p>
                <div>
                    { _.reduce(tags,function(ret,o,tname){
                        return ret.concat(
                            <span key={tname} onClick={this.toggleTag.bind(this,tname)} className={"pill tag "+s[tname]}>{tname}</span>
                        );
                    },[],this) }
                </div>
                <p>Games (showing { selgames.length+"/"+numgames })</p>
                <div>{ selgames }</div>
            </div>
        );
    }
});

module.exports = SelectGame;