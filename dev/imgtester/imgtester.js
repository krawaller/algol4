/** @jsx React.DOM */

var Route = ReactRouter.Route, DefaultRoute = ReactRouter.DefaultRoute, RouteHandler = ReactRouter.RouteHandler;

var imgs = [
	{what: "tree", x: 2, y: 2},{what: "tree", x: 3, y: 2},{what: "tree", x: 4, y: 2},
	{what: "tree", x: 2, y: 3},{what: "tree", x: 3, y: 3},{what: "tree", x: 4, y: 3},
	{what: "tree", x: 2, y: 4},{what: "tree", x: 3, y: 4},{what: "tree", x: 4, y: 4},
	{what: "tree", x: 6, y: 6},{what: "tree", x: 7, y: 6},{what: "tree", x: 8, y: 6},
	{what: "tree", x: 6, y: 7},{what: "tree", x: 7, y: 7},{what: "tree", x: 8, y: 7},
	{what: "tree", x: 6, y: 8},{what: "tree", x: 7, y: 8},{what: "tree", x: 8, y: 8},

	{what: "archer1", x: 4, y: 4, dir: 5},
	{what: "king1", x: 3, y: 3, dir: 7},
	{what: "archer1", x: 4, y: 5, dir: 3},
	{what: "crosshair", x: 4, y: 5},

	{what: "arrow1", x: 2, y: 3, dir: 7},{what: "arrow1", x: 1, y: 3, dir: 7},
	{what: "arrow1", x: 5, y: 5, dir: 3},{what: "arrow1", x: 6, y: 5, dir: 3},{what: "arrow1", x: 7, y: 5, dir: 3},

	{what: "arrow2", x: 7, y: 5, dir: 1},{what: "arrow2", x: 7, y: 4, dir: 1},{what: "arrow2", x: 7, y: 3, dir: 1},
	{what: "arrow2", x: 4, y: 8, dir: 7},{what: "arrow2", x: 4, y: 9, dir: 7},

	{what: "archer2", x: 7, y: 6, dir: 1},
	{what: "archer2", x: 6, y: 6, dir: 7},
	{what: "king2", x: 4, y: 7, dir: 5},
	{what: "crosshair", x: 4, y: 7},
];

var options = {
	"archer1": "bow1_01.svg",
	"king1": "king1_01.svg",
	"archer2": "bow1_01.svg",
	"king2": "king1_01.svg",
	"arrow": "MISSING :(",
	"tree": "tree_01.svg",
	"crosshair": "crosshair_01.svg"
};

var Image = React.createClass({
  render: function(){
  	var style = {
  	  backgroundImage: "url(img/"+this.props.img+")",
  	  left: ((this.props.x-1)*11.11)+"%",
  	  top: ((this.props.y-1)*11.11)+"%"
  	};
  	return <div className={'img '+{1:"north",3:"east",5:"south",7:"west"}[this.props.dir||1]} style={style} />;
  }	
});

var Option = React.createClass({
	render: function(){
	  return (
	  	<div>
	  		<span>{this.props.name} </span>
	  		<input type='text' value={this.props.value}/>
	  	</div>
	  );
	}
});

var Tester = React.createClass({
  mixins: [ReactRouter.State,ReactRouter.Navigation],
  reDraw: function(){
  	var chosen = _.mapValues(options,function(def,name){
  		return this.refs[name].getDOMNode().value;
  	},this);
  	this.transitionTo('tester',{},chosen);
  	console.log("WOO",chosen);
  },
  render: function(){
  	var query = this.getQuery();
    return (
      <div>
          <form onSubmit={this.reDraw}>
          	<p>{
          	  _.map(options,function(def,name){
          	  	return (
				  	<div>
				  		<span>{name} </span>
				  		<input ref={name} type='text' defaultValue={query[name]||def}/>
				  	</div>
				  );
          	  })
          	}</p>
          	<button type='submit'>redraw</button>
          </form>
	      <div className='board'>
	        {imgs.map(function(i,n){
	          i.img = query[i.what] || options[i.what];
	          return <Image key={n} {...i} />;
	        })}
	      </div>
      </div>
    );
  }
});

var routes = (
  <Route name='tester' path='/' handler={Tester}/>
);

ReactRouter.run(routes, function(Handler, state) {
  React.render(<Handler params={state.params} />, document.body);
});