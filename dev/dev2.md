TODO 

[ ] update board notation
[ ] add offset connection mechanism
[ ] add offset generator
[ ] add float generator
[ ] add line laststep
[ ] update calculateStepData


[x] make endturnoption say win/draw/lose
[ ] change canendturn to hold error message (?)
[x] update calculateCommandResult to use areStatesEqual
[X] create newMarksAfterCommand
[x] update calculateCommandResult to use newMarksAfterCommand
[x] create setOptions
[x] endTurnOption should use state.passto

[x] perform newstep (prepareNewStep and setOptions) [newstate]
[x] perform passto (prepareNewTurn and setOptions) [plr]
[x] perform win
[x] perform draw
[x] perform loseto
[x] perform setmark (setMark and options)
[x] perform removemark (removeMark)

[ ] make prepareNewGameState do performOption passto