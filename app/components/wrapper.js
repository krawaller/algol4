/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    RouteHandler = Router.RouteHandler,
    Link = Router.Link,
    Algol = require("../../src/index"),
    games = require("../games");

var Wrapper = React.createClass({
	mixins: [Router.Navigation,Router.State],
	getInitialState: function(){
		var gamename = this.getParams().gamename;
		return gamename ? {
			tree: Algol.newGame(games[gamename],2),
			currentgamename: gamename
		} : {};
	},
	componentWillReceiveProps: function(){
		var gamename = this.getParams().gamename,
			s = this.state;
		if (gamename && gamename !== s.currentgamename){
			this.setState(this.getInitialState());
		}
	},
    render: function() {
    	var s = this.state;
        return (
            <div className="wrapper">
            	<ul className="nav">
            		<li><Link to="home">Home</Link></li>
            		<li><Link to="/games">Games</Link></li>
            		{s.tree && <li><Link to={"/game/"+s.currentgamename+"/info"}>{s.tree.getIn(["gamedef","meta","name"])}</Link></li>}
            	</ul>
                <RouteHandler tree={s.tree} gamename={s.currentgamename} />
            </div>
        );
    }
});

module.exports = Wrapper;