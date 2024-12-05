const textarea = document.getElementById('binarycode');

function set_seperate(){
    // Get the current cursor position
    const start = textarea.selectionStart;

    // Filter out spaces and allow only valid hex characters (0-9, A-F, a-f)
    const valueWithoutSpaces = textarea.value.replace(/ /g, '').replace(/[^0-9A-Fa-f]/g, '');
    
    // Format input by adding a space after every two characters
    const formattedValue = valueWithoutSpaces.replace(/(.{1,4})/g, '$1 ').trim();

    // Update the textarea with the new formatted value
    textarea.value = formattedValue;

    // Calculate the new cursor position

    const newCursorPosition = (formattedValue[start-1]==' ')?start+1:start;
    textarea.setSelectionRange(newCursorPosition, newCursorPosition); // Set the cursor position
}

textarea.addEventListener('input', function(event) {    
    set_seperate();
});

const computingBtn = document.getElementById('computingBtn');
const computingOut = document.getElementById('computingOut');
const debbugCHBX = document.getElementById('debugging');
computingBtn.addEventListener('click', function() {
    const value = textarea.value.replace(/ /g, '');
    const com = new Computer(value);
    com.computing(debbugCHBX.checked);
    computingOut.innerText = "";
    computingOut.innerHTML = com.m_Output;
});

const assembleBtn = document.getElementById('assembleBtn');
const assemblyCode = document.getElementById("assembly");
assembleBtn.addEventListener("click", function () {
    const assembler = new Assembler(assemblyCode.value);
    assembler.assembling();
    textarea.value = "";
    textarea.value = assembler.m_Out;
    set_seperate();
});

const progcode = document.getElementById('progcode')
const compileBtn = document.getElementById('compilingBtn')
compileBtn.addEventListener('click', function(){
    const compiler = new Compiler(progcode.value);
    compiler.compiling();
    assemblyCode.value = "";
    assemblyCode.value = compiler.m_Out;
    
});

const progcode1 = document.getElementById('progcode');
const runningBtn = document.getElementById('runningBtn');
runningBtn.addEventListener('click', function(){
    const compiler = new Compiler(progcode1.value);
    compiler.compiling();
    const assembler = new Assembler(compiler.m_Out);
    assembler.assembling();
    const value = assembler.m_Out.replace(/ /g, '');
    const com = new Computer(value);
    com.computing(debbugCHBX.checked);
    computingOut.innerHTML = com.m_Output;
    
});

