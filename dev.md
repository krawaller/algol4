
######################## D A T A O B J #####################

gamedef
    (preprocessed gamedef)
seed
	(settings, playerids, etc)
state
	marks
		name: pos, ...
	affectedunits: [id,id,...]
	steps
		[{
			state: prevstate
			command: commandname,
			affected: [],
			marks:
				markname: pos, ...
		}, ...]
	data
		units:
			id: {props}, ...
		terrain
			id: {props}, ...
	layers
		layername
			ykx: [obj, ... ], ...
	context
		CURRENTPLAYER: #,
		PERFORMEDSTEPS: #
neighbours
	ykx: {dir: ykx, ...}

######################## T Y P E S #########################

Positionlist
	FROMALLINLAYER layer
	FROMALLINLAYERS layer, layer, ...

Position
	MARKINLAST commandname, markname
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
	PERFORMEDANYCOMMAND
	ISAFFECTED id
	EMPTY layer
	NOTEMPTY layer
	
Value
	LOOKUP layername,position,propname
	POSITIONSIN layer  (int)
	IFELSE boolean, value, value
	CONTEXTVAL contextvalname
	VAL prim

Id
	IDAT position
	LOOPID
