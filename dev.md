
######################## D A T A O B J #####################

gamedef
    (preprocessed gamedef)
seed
	(settings, playerids, etc)
state
	marks
		name: pos, ...
	steps
		[cmnd,{mark:ykx}]
	affectedunits
		id: true, ...
	layers
		layername
			bypos
				ykx: [obj, ... ], ...
neighbours
	ykx: {dir: ykx, ...}
context
	name: val, ...

######################## T Y P E S #########################

Positionlist
	FROMMARK mark
	FROMMARKINLAST command, mark
	FROMALLINLAYER layer
	FROMALLINLAYERS layer, layer, ...

Position
	MARKPOS markname
	ONLYPOSIN layer
	CONTEXTPOS contextposname


Effect
	FORALLIN layer, effect, effect, ...
	OFFSET id, dir, forward, right
	KILLUNIT id
	MOVEUNIT id, position
	SWAPUNITPOSITIONS id, id
	CREATETERRAIN position, propobj
	SETUNITDATA id, propname, value

Boolean
	ANYAT layer, position
	NONEAT layer, position
	AND boolean, boolean, ...
	OR boolean, boolean, ...
	SAME value, value
	DIFFERENT value, value
	MORE int, int
	NOT boolean
	HASPERFORMEDCOMMAND commandname
	AFFECTED id
	EMPTY layer
	
Value
	LOOKUP layername,position,propname
	POSITIONSIN layer  (int)
	IFELSE boolean, value, value
	CONTEXTVAL contextvalname
	RAW prim

Id
	IDAT position
	LOOPID
