const opcodeDictionary = {
    "nop": 0x00, "loadA": 0x01, "loadB": 0x02, "storeA": 0x03, "storeB": 0x04, "addAB": 0x05,
    "subAB": 0x06, "subBA": 0x07, "mulAB": 0x08, "divAB": 0x09, "divBA": 0x0A, "notA": 0x0B,
    "notB": 0x0C, "andAB": 0x0D, "orAB": 0x0E, "xorAB": 0x0F, "shl": 0x10, "shr": 0x11,
    "rol": 0x12, "ror": 0x13, "pushA": 0x14, "pushB": 0x15, "popA": 0x16, "popB": 0x17,
    "call": 0x18, "ret": 0x19, "jmp": 0x20, "out": 0xFE, "hlt": 0xFF
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
            if(line.startsWith(':')){
                let label = line.substring(1);
                this.m_labels[label] = address;
            }
            else{
                address++;
            }
        }
        // Step 2: Generate binary code
        let hexCode = [];
        for(let line of assemblyCodeStr){
            if(line.startsWith(':')){
                continue;
            }
            let parts = line.split(" ");
            let instruction = parts[0];
            let value = parts[1];
            if(opcodeDictionary[instruction] !== undefined){
                let word = "";
                word += opcodeDictionary[instruction].toString(16).padStart(2,'0');
                if(this.m_labels[value] !== undefined){
                    word += this.m_labels[value].toString(16).padStart(2,"0");
                }else if(!isNaN(parseInt(value))){
                    word += parseInt(value).toString(16).padStart(2,"0");
                }else{word += "00";}
                hexCode.push(word);
            }
            else if(!isNaN(parseInt(instruction))){
                hexCode.push(instruction.toString(16).padStart(4,"0"));
            }
        }
        console.log(hexCode.toString());
    }
}