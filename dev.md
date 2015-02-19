gamedef
    (preprocessed gamedef)
seed
	(settings, playerids, etc)
history
	[[]]
state
	marks
		name: pos, ...
	steps
		[cmnd,{mark:ykx}]
	affectedunits
		[id,id,...]
neighbours
	ykx: {dir: ykx, ...}



############ T Y P E S

Values
	LOOKUP layername,position,propname


Positionlist
	FROMMARK mark
	FROMALLINLAYER layer
	FROMALLINLAYERS layer, layer, ...

Effect
	FORALLIN layer, effect, effect, ...
	OFFSET id, dir, forward, right
	KILLUNIT id
	MOVEUNIT id, position
