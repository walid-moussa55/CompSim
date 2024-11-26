class Memory {
    constructor(text) { this.m_text = text.padEnd(1024, '0'); this.m_index = 0; }
    setIndex(index) { if (index >= 0 && index <= 255) this.m_index = index&0xffff; }
    setWord(word) { if (word) this.m_text = this.m_text.substr(0, this.m_index * 4) + word.toString(16).padStart(4, '0') + this.m_text.substr((this.m_index + 1) * 4); }
    getWord() {
        const word = this.m_text.substr(4 * this.m_index, 4);
        return parseInt(word, 16);
    }
}

class Register {
    constructor() { this.m_content = 0; }
    setContent(content) { this.m_content = content&0xffff; }
    getContent() { return this.m_content; }
}

class ALU {
    constructor() {
        this.m_A = 0;
        this.m_B = 0;
        this.m_Flags = [0, 0, 0, 0, 0, 0, 0, 0];// [CSF,CAF,ZF,EF,NF,GF,LF, ERRF]
    }
    setAB(content1, content2) {
        this.m_A = content1;
        this.m_B = content2;
    }
    getFlags(){return this.m_Flags;}
    calcule(op) {
        let result = 0;
        switch (op) {
            case 0: {
                result = this.m_A + this.m_B;
                this.m_Flags[0] = (result > 0xFFFF);
            }
                break;
            case 1: {
                result = this.m_A - this.m_B;
                this.m_Flags[0] = (result < 0);
            }
                break;
            case 2: {
                result = this.m_A * this.m_B;
                this.m_Flags[0] = (result > 0xFFFF);
            }
                break;
            case 3: {
                this.m_Flags[6] = (this.m_B === 0)?2:0;
                result = (this.m_B) ? this.m_A / this.m_B : 0;
                this.m_Flags[0] = (result > 0xFFFF);
            }
                break;
            case 4: {
                result = this.m_A ^ 0xffff;
            }
                break;
            case 5: {
                result = this.m_A & this.m_B;
            }
                break;
            case 6: {
                result = this.m_A | this.m_B;
            }
                break;
            case 7: {
                result = this.m_A ^ this.m_B;
            }
                break;
            case 8: {
                result = (this.m_A >> 1) & 0xFFFF;
                this.m_Flags[1] = (result > 0xFFFF);
            }
                break;
            case 9: {
                result = (this.m_A << 1) & 0xFFFF;
                this.m_Flags[1] = (result > 0xFFFF);
            }
                break;
            case 10: {
                this.m_Flags[3] = this.m_A == this.m_B;
                this.m_Flags[4] = this.m_A != this.m_B;
                this.m_Flags[5] = this.m_A > this.m_B;
                this.m_Flags[6] = this.m_A < this.m_B;
            }
                break;
            default:
                this.m_Flags[7] = 1;
                break;
        }
        this.m_Flags[2] = (result & 0xFFFF) === 0;
        return result&0xffff;
    }
}

class Count{
    constructor(){
        this.m_content = new Register();
    }
    loadCount(content){this.m_content.setContent(content);}
    outCount(){return this.m_content.getContent();}
    incrCount(){
        const temp = this.m_content.getContent()+1;
        this.m_content.setContent(temp%256);
    }
    decrCount(){
        const temp = (256+this.m_content.getContent()-1)%256;
        this.m_content.setContent(temp);
    }
}

class CPU{
    constructor(){
        this.m_regA = new Register();
        this.m_regB = new Register();
        this.m_regInst = new Register();
        this.m_PC = new Count();
        this.m_SP = new Count();
        this.m_ALU = new ALU();
    }
}

class Computer{
    constructor(memory){
        this.mem = new Memory(memory);
        this.cpu = new CPU();
        this.m_Output = "";
    }
    computing(debug){
        for (let index=0;index<100;index++) {
            this.mem.setIndex(this.cpu.m_PC.outCount());
            this.cpu.m_PC.incrCount();
            const code = this.mem.getWord();
    
            const opcode = code&0x00ff;
            const value = (code&0xff00)>>8;
            
            if(debug) this.m_Output+=`instr:${opcode}|value:${value}|regA:${this.cpu.m_regA.getContent()}|regB:${this.cpu.m_regB.getContent()}|pc:${this.cpu.m_PC.outCount()}|sp:${this.cpu.m_SP.outCount()}|mem:${this.mem.m_index}\n`;
    
            if(opcode === 0) {continue;}
            else if(opcode === 1) {//lda
                this.mem.setIndex(value);
                this.cpu.m_regA.setContent(this.mem.getWord());
            }
            else if(opcode === 2) {//ldb
                this.mem.setIndex(value);
                this.cpu.m_regB.setContent(this.mem.getWord());
            }
            else if(opcode === 3) {//sta
                this.mem.setIndex(value);
                this.mem.setWord(this.cpu.m_regA.getContent());
            }
            else if(opcode === 4) {//stb
                this.mem.setIndex(value);
                this.mem.setWord(this.cpu.m_regB.getContent());
            }
            else if(opcode === 5) {//addab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(0));
            }
            else if(opcode === 6) {//addaa
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(0));
            }
            else if(opcode === 7) {//addbb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(0));
            }
            else if(opcode === 8) {//addba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(0));
            }
            else if(opcode === 9) {//subab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(1));
            }
            else if(opcode === 10) {//subba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(1));
            }
            else if(opcode === 11) {//mulab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(2));
            }
            else if(opcode === 12) {//mulaa
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(2));
            }
            else if(opcode === 13) {//mulbb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(2));
            }
            else if(opcode === 14) {//mulba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(2));
            }
            else if(opcode === 15) {//divab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(3));
            }
            else if(opcode === 16) {//divba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(3));
            }
            else if(opcode === 17) {//nota
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(4));
            }
            else if(opcode === 18) {//notb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(4));
            }
            else if(opcode === 19) {//andab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(5));
            }
            else if(opcode === 20) {//andba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(5));
            }
            else if(opcode === 21) {//orab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(6));
            }
            else if(opcode === 22) {//orba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(6));
            }
            else if(opcode === 23) {//xorab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(7));
            }
            else if(opcode === 24) {//xoraa
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(7));
            }
            else if(opcode === 25) {//xorbb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(7));
            }
            else if(opcode === 26) {//xorba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(7));
            }
            else if(opcode === 27) {//shra
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(8));
            }
            else if(opcode === 28) {//shrb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(8));
            }
            else if(opcode === 29) {//shla
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(9));
            }
            else if(opcode === 30) {//shlb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(9));
            }
            else if(opcode === 31) {//cmpab
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                this.cpu.m_ALU.calcule(10);
            }
            else if(opcode === 32) {//cmpba
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                this.cpu.m_ALU.calcule(10);
            }
            else if(opcode === 33) {//pusha
                this.cpu.m_SP.decrCount();
                this.mem.setIndex(this.cpu.m_SP.outCount());
                this.mem.setWord(this.cpu.m_regA.getContent());
            }
            else if(opcode === 34) {//pushb
                this.cpu.m_SP.decrCount();
                this.mem.setIndex(this.cpu.m_SP.outCount());
                this.mem.setWord(this.cpu.m_regB.getContent());
            }
            else if(opcode === 35) {//popa
                this.mem.setIndex(this.cpu.m_SP.outCount());
                this.cpu.m_regA.setContent(this.mem.getWord());
                this.cpu.m_SP.incrCount();
            }
            else if(opcode === 36) {//popb
                this.mem.setIndex(this.cpu.m_SP.outCount());
                this.cpu.m_regB.setContent(this.mem.getWord());
                this.cpu.m_SP.incrCount();
            }
            else if(opcode === 37) {//call
                this.cpu.m_SP.decrCount();
                this.mem.setIndex(this.cpu.m_SP.outCount());
                this.mem.setWord(this.cpu.m_PC.outCount());
    
                this.cpu.m_PC.loadCount(value);
            }
            else if(opcode === 38) {//ret
                this.mem.setIndex(this.cpu.m_SP.outCount());
                this.cpu.m_PC.loadCount(this.mem.getWord());
                this.cpu.m_SP.incrCount();
            }
            else if(opcode === 39) {//jmp
                this.cpu.m_PC.loadCount(value);
            }
            else if(opcode === 40) {//jz
                if(this.cpu.m_ALU.getFlags()[2]){
                    this.cpu.m_PC.loadCount(value);
                }
            }
            else if(opcode === 41) {//jac
                if(this.cpu.m_ALU.getFlags()[0]){
                    this.cpu.m_PC.loadCount(value);
                }
            }
            else if(opcode === 42) {//jsc
                if(this.cpu.m_ALU.getFlags()[1]){
                    this.cpu.m_PC.loadCount(value);
                }
            }
            else if(opcode === 43) {//je
                if(this.cpu.m_ALU.getFlags()[3]){
                    this.cpu.m_PC.loadCount(value);
                }
            }
            else if(opcode === 44) {//jn
                if(this.cpu.m_ALU.getFlags()[4]){
                    this.cpu.m_PC.loadCount(value);
                }
            }
            else if(opcode === 45) {//jg
                if(this.cpu.m_ALU.getFlags()[5]){
                    this.cpu.m_PC.loadCount(value);
                }
            }
            else if(opcode === 46) {//jl
                if(this.cpu.m_ALU.getFlags()[6]){
                    this.cpu.m_PC.loadCount(value);
                }
            }
            else if(opcode === 47) {//outa
                this.m_Output += this.cpu.m_regA.getContent()+'\n';
            }
            else if(opcode === 48) {//outb
                this.m_Output += this.cpu.m_regB.getContent()+'\n';
            }
            else if(opcode === 49) {//hlt
                this.m_Output+=(!this.cpu.m_ALU.getFlags[7])?"Success...\n":"Unsuccess";
                break;
            }
            else if(opcode === 50) {//movab
                this.cpu.m_regB.setContent(this.cpu.m_regA.getContent());
            }
            else if(opcode === 51) {//movba
                this.cpu.m_regA.setContent(this.cpu.m_regB.getContent());
            }
            else if(opcode === 52) {//jmpa
                this.cpu.m_PC.loadCount(this.cpu.m_regA.getContent());
            }
            else if(opcode === 53) {//jmpb
                this.cpu.m_PC.loadCount(this.cpu.m_regB.getContent());
            }
            else if(opcode === 54) {//laa
                this.cpu.m_regA.setContent(this.cpu.m_PC.outCount());
            }
            else if(opcode === 55) {//lab
                this.cpu.m_regB.setContent(this.cpu.m_PC.outCount());
            }
            else if(opcode === 56) {//ina
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),1);
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(0));
            }
            else if(opcode === 57) {//inb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),1);
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(0));
            }
            else if(opcode === 58) {//dea
                this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),1);
                this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(1));
            }
            else if(opcode === 59) {//deb
                this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),1);
                this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(1));
            }
            else if(opcode === 60) {//ldaa
                this.mem.setIndex(this.cpu.m_regA.getContent());
                this.cpu.m_regA.setContent(this.mem.getWord());
            }
            else if(opcode === 61) {//ldab
                this.mem.setIndex(this.cpu.m_regA.getContent());
                this.cpu.m_regB.setContent(this.mem.getWord());
            }
            else if(opcode === 62) {//ldba
                this.mem.setIndex(this.cpu.m_regB.getContent());
                this.cpu.m_regA.setContent(this.mem.getWord());
            }
            else if(opcode === 63) {//ldbb
                this.mem.setIndex(this.cpu.m_regB.getContent());
                this.cpu.m_regB.setContent(this.mem.getWord());
            }
            else if(opcode === 64) {//testa

            }
            else if(opcode === 65) {//testb
                
            }
            else if(opcode === 66) {//ldva
                this.mem.setIndex(this.cpu.m_PC.outCount());
                this.cpu.m_PC.incrCount();
                this.cpu.m_regA.setContent(this.mem.getWord());
            }
            else if(opcode === 67) {//ldvb
                this.mem.setIndex(this.cpu.m_PC.outCount());
                this.cpu.m_PC.incrCount();
                this.cpu.m_regB.setContent(this.mem.getWord());
            }
            
            else{
                if(debug)this.m_Output+=`>> Error : Invalid opcode: ${code & 0x00ff}`;
            }
            if(this.cpu.m_ALU.getFlags[7] && debug){
                if(this.cpu.m_ALU.getFlags[7]==1) this.m_Output=+">> Error : Invalid op";
                if(this.cpu.m_ALU.getFlags[7]==2) this.m_Output=+">> Error : Can not divide by zero";
            }
        }
    }
}