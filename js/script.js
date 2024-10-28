const textarea = document.getElementById('binarycode');
textarea.addEventListener('input', function(event) {    
    // Get the current cursor position
    const start = this.selectionStart;

    // Filter out spaces and allow only valid hex characters (0-9, A-F, a-f)
    const valueWithoutSpaces = this.value.replace(/ /g, '').replace(/[^0-9A-Fa-f]/g, '');
    
    // Format input by adding a space after every two characters
    const formattedValue = valueWithoutSpaces.replace(/(.{1,4})/g, '$1 ').trim();

    // Update the textarea with the new formatted value
    this.value = formattedValue;

    // Calculate the new cursor position

    const newCursorPosition = (formattedValue[start-1]==' ')?start+1:start;
    this.setSelectionRange(newCursorPosition, newCursorPosition); // Set the cursor position
});

const computingBtn = document.getElementById('computingBtn');
const computingOut = document.getElementById('computingOut');
const debbugCHBX = document.getElementById('debugging');
computingBtn.addEventListener('click', function() {
    const value = textarea.value.replace(/ /g, '');
    const com = new Computer(value);
    com.computing(debbugCHBX.checked);
    computingOut.innerText = com.m_Output;
});

const assembleBtn = document.getElementById('assembleBtn');
const assemblyCode = document.getElementById("assembly");
assembleBtn.addEventListener("click", function () {
    const assembler = new Assembler(assemblyCode.value);
    assembler.assembling();
    console.log(assembler.labels);
});

