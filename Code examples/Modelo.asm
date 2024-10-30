jmp start
:x
15
:y
7

:mod
popB
popA
:loop
cmpAB
jl end
subAB
jmp loop
:end

ret

:start
loadA x
loadB y
pushA
pushB
call mod

outA
hlt
