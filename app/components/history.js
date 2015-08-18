/** @jsx React.DOM */

var React = require('react'),
    I = require('../../src/immutableextensions');

var History = React.createClass({
    render: function() {
        var list = this.props.list, index = this.props.index, cb = this.props.changer;
        return (
            <ul style={style} className="history">
                { list.map(function(val,n){
                    var meta = val[0];
                    return <li key={n} onClick={function(){cb(n)}} className={"historyplr"+meta.player+(n===index?" currententry":"")}>{ (meta.id && meta.id+' '||'')+meta.command }</li>;
                }) }
            </ul>
        )
    }
});

module.exports = History;