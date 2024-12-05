const opcodeDictionary = {
    "nop":   0x00, 
    "lda":   0x01, "ldb":   0x02, 
    "sta":   0x03, "stb":   0x04, 
    "addab": 0x05, "addaa": 0x06, "addbb": 0x07, "addba": 0x08,
    "subab": 0x09, "subba": 0x0a, 
    "mulab": 0x0b, "mulaa": 0x0c, "mulbb": 0x0d,"mulba": 0x0e,
    "divab": 0x0f, "divba": 0x10, 
    "nota":  0x11, "notb":  0x12, 
    "andab": 0x13, "andba": 0x14,
    "orab":  0x15, "orba" : 0x16,
    "xorab": 0x17, "xoraa": 0x18, "xorbb": 0x19,"xorba": 0x1a,
    "shra":  0x1b, "shrb" : 0x1c,
    "shla":  0x1d, "shlb" : 0x1e, 
    "cmpab": 0x1f, "cmpba": 0x20,
    "pusha": 0x21, "pushb": 0x22, 
    "popa":  0x23, "popb":  0x24,
    "call":  0x25, "ret":   0x26, 
    "jmp":   0x27, "jz":    0x28, "jac": 0x29, "jsc": 0x2a, "je": 0x2b, "jn": 0x2c, "jg": 0x2d, "jl": 0x2e,
    "outa":  0x2f, "outb":  0x30,
    "hlt":   0x31,
    "movab": 0x32, "movba": 0x33, // move a/b to b/a
    "jmpa":  0x34, "jmpb":  0x35, // jmp to a/b
    "laa":   0x36, "lab":   0x37, // move PC to a/b
    "ina":   0x38, "inb":   0x39, // incriment a/b
    "dea":   0x3a, "deb":   0x3b, // decriment a/b
    "ldaa":  0x3c, "ldab":  0x3d, "ldba": 0x3e,"ldbb": 0x3f, // load a/b/a/b from address in a/a/b/b
    "stab":  0x40, "stba":  0x41, // store a/b on address on b/a
    "ldva":  0x42, "ldvb":  0x43, // load next word to a/b
    "mspa":  0x44, "mspb":  0x45, // move stack pointer to a ou b
    "pop":   0x46,
    "testa": 0x47, "testb": 0x48, // test the value of a/b
};

class Assembler {
    constructor(text) {
        this.m_text = text;
        this.m_labels = {};
        this.m_Out = "";
    }
    assembling() {
        // get line
        const assemblyCodeStr = this.m_text.split("\n").map(line => line.trim()).filter(line => line);
        // Step 1: Find labels and their addresses
        let address = 0;
        for(let line of assemblyCodeStr){
            line = line.split(";")[0].trim(); 
            if(line.endsWith(":")){
                let label = line.slice(0, -1);
                this.m_labels[label] = address;
            }
            else{
                address++;
            }
        }
        // Step 2: Generate binary code
        let hexCode = [];
        for(let line of assemblyCodeStr){
            if(line.endsWith(':')){
                continue;
            }
            line = line.split(";")[0].trim(); 
            if (line === "") continue; // Skip empty lines
            let parts = line.split(" ");
            let instruction = parts[0];
            let value = parts[1] || null;
            if(opcodeDictionary[instruction] !== undefined){
                let word = "";
                if(this.m_labels[value] !== undefined){
                    word += this.m_labels[value].toString(16).padStart(2,"0");
                }else if(!isNaN(parseInt(value))){
                    word += value;
                }else if (value === null || value === ""){word += "00";}
                else{
                    throw new Error(`Assembler Error : Unknown label ${value}`);
                }
                word += opcodeDictionary[instruction].toString(16).padStart(2,'0');
                hexCode.push(word);
            }
            else if(!isNaN(parseInt(instruction))){
                hexCode.push(parseInt(instruction).toString(16).padStart(4,"0"));
            }
            else if (!(instruction in opcodeDictionary)) {
                throw new Error(`Assembler Error : Unknown opcode ${instruction}`);
            }
        }
        this.m_Out = hexCode.join("");
    }
}