/** @jsx React.DOM */

var React = require('react'),
    Router = require('react-router'),
    Link = Router.Link,
    _ = require('lodash');

var History = React.createClass({
    mixins: [Router.State,Router.Navigation],
    render: function() {
        var history = this.props.history, index = parseInt(this.getParams().historyindex) || 0,
            params = this.getParams(),
            basepath = "/game/"+params.gamename+"/battle/"+params.battleid+"/history/";
        return (
            <ul className="history">
                { history.map(function(val,n){
                    var meta = val[0];
                    return <li key={n} className={"historyplr"+meta.player+(n===index?" currententry":"")}>
                        <Link to={basepath+n}>{ (meta.id && meta.id+' '||'')+meta.command }</Link>
                    </li>;
                },this) }
            </ul>
        )
    }
});

module.exports = History;