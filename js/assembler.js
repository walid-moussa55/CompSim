const opcodeDictionary = {
        "nop": 0x00,
        "loadA": 0x01,
        "loadB": 0x02,
        "storeA": 0x03,
        "storeB": 0x04,
        "addAB": 0x05,
        "addBA": 0x06,
        "subAB": 0x07,
        "subBA": 0x08,
        "mulAB": 0x09,
        "mulBA": 0x0A,
        "divAB": 0x0B,
        "divBA": 0x0C,
        "notA": 0x0D,
        "notB": 0x0E,
        "andAB": 0x0F,
        "andBA": 0x10,
        "orAB": 0x11,
        "orBA": 0x12,
        "xorAB": 0x13,
        "xorBA": 0x14,
        "shrA": 0x15,
        "shrB": 0x16,
        "shlA": 0x17,
        "shlB": 0x18,
        "cmpAB": 0x19,
        "cmpBA": 0x1a, 
        "moveAB": 0x1b,
        "moveBA": 0x1c,
        "jmp": 0x1d,
        "jc": 0x1e,
        "jz": 0x1f,
        "je": 0x20,
        "jn": 0x21,
        "jg": 0x22,
        "jl": 0x23,
        "pushA": 0x24,
        "pushB": 0x25,
        "popA": 0x26,
        "popB": 0x27,
        "call": 0x28,
        "ret": 0x29,
        "outA": 0x2a,
        "outB": 0x2b,
        "hlt": 0x2c,
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
                if(this.m_labels[value] !== undefined){
                    word += this.m_labels[value].toString(16).padStart(2,"0");
                }else if(!isNaN(parseInt(value))){
                    word += parseInt(value).toString(16).padStart(2,"0");
                }else{word += "00";}
                word += opcodeDictionary[instruction].toString(16).padStart(2,'0');
                hexCode.push(word);
            }
            else if(!isNaN(parseInt(instruction))){
                hexCode.push(prseInt(instruction).toString(16).padStart(4,"0"));
            }
        }
        this.m_Out = hexCode.join("");
    }
}