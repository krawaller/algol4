var Reflux = require("reflux"),
	battleactions = require("../actions/battleactions"),
	listactions = require("../actions/listactions"),
	memory = {};

var createStore = function(gameid,battleid){
	var ongoinglistactions = listactions.getActionsForList(gameid,"ongoinglocal"),
		finishedlistactions = listactions.getActionsForList(gameid,"finishedlocal");
	return Reflux.createStore({
		listenables: battleactions.getActionsForBattle(battleid),
		init: function(){
			
		},
		onMakeCommand: function(){},
		onMakeMark: function(){},
		onEndTurn: function(){},
		getDefaultData: function(){
			return this.battle;
		},
		readFromStorage: function(){
			
		},
		saveToStorage: function(battle){
			
		}
	});
}

module.exports = {
	getStoreForBattle: function(gameid,battleid){
		return memory[battleid] || (memory[battleid] = createStore(gameid,battleid));
	}
}