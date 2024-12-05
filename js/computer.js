class Memory {
    constructor(text) { this.m_text = text.padEnd(1024, '0'); this.m_index = 0; }
    setIndex(index) { if (index >= 0 && index <= 255) this.m_index = index&0xffff; }
    setWord(word) { if (word !== null && typeof word === 'number') this.m_text = this.m_text.substr(0, this.m_index * 4) + word.toString(16).padStart(4, '0') + this.m_text.substr((this.m_index + 1) * 4); }
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

// class ALU {
//     constructor() {
//         this.m_A = 0;
//         this.m_B = 0;
//         this.m_Flags = [0, 0, 0, 0, 0, 0, 0, 0];// [CSF,CAF,ZF,EF,NF,GF,LF, ERRF]
//     }
//     setAB(content1, content2) {
//         this.m_A = content1;
//         this.m_B = content2;
//     }
//     getFlags(){return this.m_Flags;}
//     calcule(op) {
//         let result = 0;
//         switch (op) {
//             case 0: {
//                 result = this.m_A + this.m_B;
//                 this.m_Flags[0] = (result > 0xFFFF);
//             }
//                 break;
//             case 1: {
//                 result = this.m_A - this.m_B;
//                 this.m_Flags[0] = (result < 0);
//             }
//                 break;
//             case 2: {
//                 result = this.m_A * this.m_B;
//                 this.m_Flags[0] = (result > 0xFFFF);
//             }
//                 break;
//             case 3: {
//                 this.m_Flags[6] = (this.m_B === 0)?2:0;
//                 result = (this.m_B) ? this.m_A / this.m_B : 0;
//                 this.m_Flags[0] = (result > 0xFFFF);
//             }
//                 break;
//             case 4: {
//                 result = this.m_A ^ 0xffff;
//             }
//                 break;
//             case 5: {
//                 result = this.m_A & this.m_B;
//             }
//                 break;
//             case 6: {
//                 result = this.m_A | this.m_B;
//             }
//                 break;
//             case 7: {
//                 result = this.m_A ^ this.m_B;
//             }
//                 break;
//             case 8: {
//                 result = (this.m_A >> 1) & 0xFFFF;
//                 this.m_Flags[1] = (result > 0xFFFF);
//             }
//                 break;
//             case 9: {
//                 result = (this.m_A << 1) & 0xFFFF;
//                 this.m_Flags[1] = (result > 0xFFFF);
//             }
//                 break;
//             case 10: {
//                 this.m_Flags[3] = this.m_A == this.m_B;
//                 this.m_Flags[4] = this.m_A != this.m_B;
//                 this.m_Flags[5] = this.m_A > this.m_B;
//                 this.m_Flags[6] = this.m_A < this.m_B;
//             }
//                 break;
//             default:
//                 this.m_Flags[7] = 1;
//                 break;
//         }
//         this.m_Flags[2] = (result & 0xFFFF) === 0;
//         return result&0xffff;
//     }
// }
class ALU {
    constructor() {
        this.m_A = 0;
        this.m_B = 0;
        this.m_Flags = [0, 0, 0, 0, 0, 0, 0, 0]; // [CSF, CAF, ZF, EF, NF, GF, LF, ERRF]
    }

    setAB(content1, content2) {
        this.m_A = content1 & 0xFFFF; // Ensure 16-bit values
        this.m_B = content2 & 0xFFFF;
    }

    getFlags() {
        return this.m_Flags;
    }

    calcule(op) {
        let result = 0;
        this.m_Flags.fill(0); // Reset flags
        switch (op) {
            case 0: // Addition
                result = this.m_A + this.m_B;
                this.m_Flags[0] = result > 0xFFFF; // Carry
                break;

            case 1: // Subtraction
                result = this.m_A - this.m_B;
                this.m_Flags[0] = this.m_A < this.m_B; // Borrow (negative result)
                break;

            case 2: // Multiplication
                result = this.m_A * this.m_B;
                this.m_Flags[0] = result > 0xFFFF; // Overflow
                break;

            case 3: // Division
                if (this.m_B === 0) {
                    this.m_Flags[7] = 1; // ERRF
                    return 0; // Division by zero
                }
                result = Math.floor(this.m_A / this.m_B);
                break;

            case 4: // NOT
                result = ~this.m_A & 0xFFFF;
                break;

            case 5: // AND
                result = this.m_A & this.m_B;
                break;

            case 6: // OR
                result = this.m_A | this.m_B;
                break;

            case 7: // XOR
                result = this.m_A ^ this.m_B;
                break;

            case 8: // Right Shift
                this.m_Flags[1] = this.m_A & 1; // Set carry flag if LSB is 1
                result = (this.m_A >> 1) & 0xFFFF;
                break;

            case 9: // Left Shift
                this.m_Flags[1] = (this.m_A & 0x8000) !== 0; // Set carry flag if MSB is 1
                result = (this.m_A << 1) & 0xFFFF;
                break;

            case 10: // Comparison
                this.m_Flags[3] = this.m_A === this.m_B; // Equal
                this.m_Flags[4] = this.m_A !== this.m_B; // Not Equal
                this.m_Flags[5] = this.m_A > this.m_B; // Greater
                this.m_Flags[6] = this.m_A < this.m_B; // Lesser
                break; // Comparison doesn't produce a result

            default:
                this.m_Flags[7] = 1; // ERRF
                break; // Unsupported operation
        }

        this.m_Flags[2] = (result & 0xFFFF) === 0; // Zero flag
        return result & 0xFFFF; // Mask to 16 bits
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
        this.m_regA = new Register(); // register A
        this.m_regB = new Register(); // register B
        this.m_regInst = new Register(); // Instruction register
        this.m_PC = new Count(); // program counter
        this.m_SP = new Count(); // Stack pointer
        this.m_ALU = new ALU(); // ALU
    }
}

class Computer{
    constructor(memory){
        this.mem = new Memory(memory);
        this.cpu = new CPU();
        this.m_Output = "";
    }
    computing(debug){
        let isRunning = true;
        for (let index=0;index<500;index++) {
            this.mem.setIndex(this.cpu.m_PC.outCount());
            this.cpu.m_PC.incrCount();
            const code = this.mem.getWord();
    
            const opcode = code&0x00ff;
            const value = (code&0xff00)>>8;
            
            if(debug) this.m_Output+=`instr:${opcode}|value:${value}|regA:${this.cpu.m_regA.getContent()}|regB:${this.cpu.m_regB.getContent()}|pc:${this.cpu.m_PC.outCount()}|sp:${this.cpu.m_SP.outCount()}|mem:${this.mem.m_index}\n`;
            switch(opcode){
                case 0: {continue;}break;
                case 1: {//lda
                    this.mem.setIndex(value);
                    this.cpu.m_regA.setContent(this.mem.getWord());
                }break;
                case 2: {//ldb
                    this.mem.setIndex(value);
                    this.cpu.m_regB.setContent(this.mem.getWord());
                }break;
                case 3: {//sta
                    this.mem.setIndex(value);
                    this.mem.setWord(this.cpu.m_regA.getContent());
                }break;
                case 4: {//stb
                    this.mem.setIndex(value);
                    this.mem.setWord(this.cpu.m_regB.getContent());
                }break;
                case 5: {//addab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                case 6: {//addaa
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                case 7: {//addbb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                case 8: {//addba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                case 9: {//subab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(1));
                }break;
                case 10: {//subba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(1));
                }break;
                case 11: {//mulab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(2));
                }break;
                case 12: {//mulaa
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(2));
                }break;
                case 13: {//mulbb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(2));
                }break;
                case 14: {//mulba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(2));
                }break;
                case 15: {//divab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(3));
                }break;
                case 16: {//divba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(3));
                }break;
                case 17: {//nota
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(4));
                }break;
                case 18: {//notb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(4));
                }break;
                case 19: {//andab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(5));
                }break;
                case 20: {//andba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(5));
                }break;
                case 21: {//orab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(6));
                }break;
                case 22: {//orba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(6));
                }break;
                case 23: {//xorab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(7));
                }break;
                case 24: {//xoraa
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(7));
                }break;
                case 25: {//xorbb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(7));
                }break;
                case 26: {//xorba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(7));
                }break;
                case 27: {//shra
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(8));
                }break;
                case 28: {//shrb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(8));
                }break;
                case 29: {//shla
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(9));
                }break;
                case 30: {//shlb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(9));
                }break;
                case 31: {//cmpab
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),this.cpu.m_regB.getContent());
                    this.cpu.m_ALU.calcule(10);
                }break;
                case 32: {//cmpba
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),this.cpu.m_regA.getContent());
                    this.cpu.m_ALU.calcule(10);
                }break;
                case 33: {//pusha
                    this.cpu.m_SP.decrCount();
                    this.mem.setIndex(this.cpu.m_SP.outCount());
                    this.mem.setWord(this.cpu.m_regA.getContent());
                }break;
                case 34: {//pushb
                    this.cpu.m_SP.decrCount();
                    this.mem.setIndex(this.cpu.m_SP.outCount());
                    this.mem.setWord(this.cpu.m_regB.getContent());
                }break;
                case 35: {//popa
                    this.mem.setIndex(this.cpu.m_SP.outCount());
                    this.cpu.m_regA.setContent(this.mem.getWord());
                    this.cpu.m_SP.incrCount();
                }break;
                case 36: {//popb
                    this.mem.setIndex(this.cpu.m_SP.outCount());
                    this.cpu.m_regB.setContent(this.mem.getWord());
                    this.cpu.m_SP.incrCount();
                }break;
                case 37: {//call
                    this.cpu.m_SP.decrCount();
                    this.mem.setIndex(this.cpu.m_SP.outCount());
                    this.mem.setWord(this.cpu.m_PC.outCount());
        
                    this.cpu.m_PC.loadCount(value);
                }break;
                case 38: {//ret
                    this.mem.setIndex(this.cpu.m_SP.outCount());
                    this.cpu.m_PC.loadCount(this.mem.getWord());
                    this.cpu.m_SP.incrCount();
                }break;
                case 39: {//jmp
                    this.cpu.m_PC.loadCount(value);
                }break;
                case 40: {//jz
                    if(this.cpu.m_ALU.getFlags()[2]){
                        this.cpu.m_PC.loadCount(value);
                    }
                }break;
                case 41: {//jac
                    if(this.cpu.m_ALU.getFlags()[0]){
                        this.cpu.m_PC.loadCount(value);
                    }
                }break;
                case 42: {//jsc
                    if(this.cpu.m_ALU.getFlags()[1]){
                        this.cpu.m_PC.loadCount(value);
                    }
                }break;
                case 43: {//je
                    if(this.cpu.m_ALU.getFlags()[3]){
                        this.cpu.m_PC.loadCount(value);
                    }
                }break;
                case 44: {//jn
                    if(this.cpu.m_ALU.getFlags()[4]){
                        this.cpu.m_PC.loadCount(value);
                    }
                }break;
                case 45: {//jg
                    if(this.cpu.m_ALU.getFlags()[5]){
                        this.cpu.m_PC.loadCount(value);
                    }
                }break;
                case 46: {//jl
                    if(this.cpu.m_ALU.getFlags()[6]){
                        this.cpu.m_PC.loadCount(value);
                    }
                }break;
                case 47: {//outa
                    this.m_Output += this.cpu.m_regA.getContent()+'\n';
                }break;
                case 48: {//outb
                    this.m_Output += this.cpu.m_regB.getContent()+'\n';
                }break;
                case 49: {//hlt
                    this.m_Output+=(!this.cpu.m_ALU.getFlags[7])?"Success...\n":"Unsuccess";
                    isRunning = false;
                }break;
                case 50: {//movab
                    this.cpu.m_regB.setContent(this.cpu.m_regA.getContent());
                }break;
                case 51: {//movba
                    this.cpu.m_regA.setContent(this.cpu.m_regB.getContent());
                }break;
                case 52: {//jmpa
                    this.cpu.m_PC.loadCount(this.cpu.m_regA.getContent());
                }break;
                case 53: {//jmpb
                    this.cpu.m_PC.loadCount(this.cpu.m_regB.getContent());
                }break;
                case 54: {//laa
                    this.cpu.m_regA.setContent(this.cpu.m_PC.outCount());
                }break;
                case 55: {//lab
                    this.cpu.m_regB.setContent(this.cpu.m_PC.outCount());
                }break;
                case 56: {//ina
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),1);
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                case 57: {//inb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),1);
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                case 58: {//dea
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),1);
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(1));
                }break;
                case 59: {//deb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),1);
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(1));
                }break;
                case 60: {//ldaa
                    this.mem.setIndex(this.cpu.m_regA.getContent());
                    this.cpu.m_regA.setContent(this.mem.getWord());
                }break;
                case 61: {//ldab
                    this.mem.setIndex(this.cpu.m_regA.getContent());
                    this.cpu.m_regB.setContent(this.mem.getWord());
                }break;
                case 62: {//ldba
                    this.mem.setIndex(this.cpu.m_regB.getContent());
                    this.cpu.m_regA.setContent(this.mem.getWord());
                }break;
                case 63: {//ldbb
                    this.mem.setIndex(this.cpu.m_regB.getContent());
                    this.cpu.m_regB.setContent(this.mem.getWord());
                }break;
                case 64: {//stab
                    this.mem.setIndex(this.cpu.m_regB.getContent());
                    this.mem.setWord(this.cpu.m_regA.getContent());
                }break;
                case 65: {//stba
                    this.mem.setIndex(this.cpu.m_regA.getContent());
                    this.mem.setWord(this.cpu.m_regB.getContent());
                }break;
                case 66: {//ldva
                    this.mem.setIndex(this.cpu.m_PC.outCount());
                    this.cpu.m_PC.incrCount();
                    this.cpu.m_regA.setContent(this.mem.getWord());
                }break;
                case 67: {//ldvb
                    this.mem.setIndex(this.cpu.m_PC.outCount());
                    this.cpu.m_PC.incrCount();
                    this.cpu.m_regB.setContent(this.mem.getWord());
                }break;
                case 68: {//mspa
                    this.cpu.m_regA.setContent(this.cpu.m_SP.outCount());
                }break;
                case 69: {//mspb
                    this.cpu.m_regB.setContent(this.cpu.m_SP.outCount());
                }break;
                case 70: {//pop
                    this.cpu.m_SP.incrCount();
                }break;
                case 71: {//testa
                    this.cpu.m_ALU.setAB(this.cpu.m_regA.getContent(),0);
                    this.cpu.m_regA.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                case 72: {//testb
                    this.cpu.m_ALU.setAB(this.cpu.m_regB.getContent(),0);
                    this.cpu.m_regB.setContent(this.cpu.m_ALU.calcule(0));
                }break;
                default:{
                    if(debug)this.m_Output+=`>> Error : Invalid opcode: ${code & 0x00ff}\n`;
                }break;
            }
            if(this.cpu.m_ALU.getFlags[7] && debug){
                if(this.cpu.m_ALU.getFlags[7]==1) this.m_Output=+">> Error : Invalid op\n";
                if(this.cpu.m_ALU.getFlags[7]==2) this.m_Output=+">> Error : Can not divide by zero\n";
            }
            if(isRunning === false) break;
        }
    }
}