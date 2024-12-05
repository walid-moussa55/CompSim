
function check_keyword(text) {
    switch (text) {
        case "let":
            return { type: 'let', text };
        case "function":
            return { type: 'function', text };
        case "return":
            return { type: 'return', text };
        case "exit":
            return { type: 'exit', text };
        case "if":
            return { type: 'if', text};
        case "else":
            return { type: 'else', text};
        case "while":
            return { type: 'while', text};
        default:
            return null;
    }
}

function tokenizer(input) {
    let tokens = [];
    let current = 0;
    while (current < input.length) {
        let char = input[current];
        if (/\s/.test(char)) { current++; continue; }
        if (/[0-9]/.test(char)) {
            let value = '';
            while (/[0-9]/.test(char) && current < input.length) {
                value += char;
                char = input[++current];
            }
            tokens.push({ type: 'number', value:parseInt(value) });
            continue;
        }
        if (char === ';') { tokens.push({ type: 'semicolon', value: char }); current++; continue; }
        if (char === '=') {
            if (input[current+1] === '='){
                tokens.push({ type: 'operator', value: '==' }); current+=2; continue; 
            }else{
                tokens.push({ type: 'assignment', value: char }); current++; continue; }
            }
        if (char === '{') { tokens.push({ type: 'left_brace', value: char }); current++; continue; }
        if (char === '}') { tokens.push({ type: 'right_brace', value: char }); current++; continue; }
        if (char === '(') { tokens.push({ type: 'left_parent', value: char }); current++; continue; }
        if (char === ')') { tokens.push({ type: 'right_parent', value: char }); current++; continue; }
        if (char === '/') {
            char = input[++current];
            if (char === '/'){
                char = input[++current];
                while(char !== '\n' && current < input.length){
                    char = input[++current];
                }
            }else if (char === '*'){
                char = input[++current];
                while(char !== '*' && input[current+1] !== '/' && current < input.length){
                    char = input[++current];
                }
            }
            current++;continue;
        }
        if (char === '%') { 
            tokens.push({ type : 'percent', value: char});
            let value = '';
            char = input[++current];
            while(char && char !== '%'){
                value += char;
                char = input[++current];
            }
            tokens.push({ type : 'customInstructions', value});
            if(char) tokens.push({ type: 'percent', value: char});
            current++;continue;
        }
        if (/[+\-*/<>!,]/.test(char)) { 
            if (input[current+1] === '='){
                tokens.push({ type: 'operator', value: char+'=' }); current+=2; continue; 
            }else{
                tokens.push({ type: 'operator', value: char }); current++; continue; }
            }
        if (/[A-Za-z_]/.test(char)) {
            let value = ''
            while (/[A-Za-z0-9_]/.test(char) && current < input.length) {
                value += char;
                char = input[++current];
            }
            const token = check_keyword(value);
            if (token) { tokens.push(token); }
            else { tokens.push({ type: 'identifier', value }); }
            continue;
        }
        throw new TypeError(`Unknown character: '${char}' at position ${current}`);
    }
    return tokens;
}

function parser(tokens) {
    let current = 0;

    // Helper function to get the current token
    function peek() {
        return tokens[current];
    }

    // Helper function to consume a token and move to the next
    function consume(expectedType) {
        const token = tokens[current];
        if (!token || token.type !== expectedType) {
            throw new TypeError(`Expected token of type '${expectedType}', but found '${token?.type || 'EOF'}'`);
        }
        current++;
        return token;
    }

    function getPrecedence(operator) {
        switch (operator) {
            case '/': return 7;
            case '*': return 7;
            case '-': return 6;
            case '+': return 6;
            case '<': return 5;
            case '>': return 4;
            case '<=': return 3;
            case '>=': return 2;
            case '!=': return 1;
            case '==': return 1;
            default: return 0; // Default for unknown operators
        }
    }

    // Parse a variable declaration
    function parseVariableDeclaration() {
        consume('let'); // Consume the 'let' keyword
        const identifier = consume('identifier'); // Consume the variable name
        consume('assignment'); // Consume the '=' symbol
        const value = parseExpression(); // Parse the right-hand expression
        consume('semicolon'); // Ensure the declaration ends with a semicolon

        return {
            type: 'VariableDeclaration',
            name: identifier.value,
            value,
        };
    }

    // Parser Variable assignment
    function parseVariableAssignment(name){
        consume('assignment'); // Skip identifier and assignment token
        const value = parseExpression(); // Parse the expression on the right-hand side
        consume('semicolon'); // Skip the semicolon
        return {
            type: "VariableAssignment",
            name: name,
            value,
        };
    }

    // Parse primary expressions (literals, identifiers, parenthetical expressions)
    function parsePrimary() {
        const token = peek();

        // Parse literals (numbers)
        if (token.type === 'number') {
            consume('number');
            return { type: 'Literal', value: token.value };
        }

        // Parse identifiers or function call
        if (token.type === 'identifier') {
            const identifier = consume('identifier');
            if (peek() && peek().type === 'left_parent') {
                return parseFunctionCall(identifier.value);
            }else{
                return { type: 'Identifier', name: token.value };
            }
        }

        // Parse parenthetical expressions
        if (token.type === 'left_parent') {
            consume('left_parent'); // Consume '('
            const expression = parseExpression(); // Parse the inner expression
            consume('right_parent'); // Consume ')'
            return expression;
        }

        throw new TypeError(`Unexpected token: ${token?.type || 'EOF'}`);
    }

    // Parsing functions
    function parseExpression(precedence = 0) {
        let left = parsePrimary();
        while (true) {
            const token = peek();
            if (!token || token.type !== 'operator') break;
            const currentPrecedence = getPrecedence(token.value);
            if (currentPrecedence <= precedence) break;
            const operator = consume('operator');
            const right = parseExpression(currentPrecedence);
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right,
            };
        }
        return left;
    }

    function parseFunctionDeclaration() {
        consume('function'); // Consume 'function'
        const name = consume('identifier').value; // Function name
        consume('left_parent'); // Consume '('
        const params = [];
        if (peek().type !== 'right_parent') {
            // Parse parameters if any
            while (true) {
                params.push(consume('identifier').value); // Collect parameter names
                if (peek().type === 'operator' && peek().value === ',') {
                    consume('operator'); // Consume ','
                } else {
                    break;
                }
            }
        }
        consume('right_parent'); // Consume ')'
        consume('left_brace'); // Consume '{'

        const body = [];
        while (peek() && peek().type !== 'right_brace') {
            body.push(parseStatement());
        }

        consume('right_brace'); // Consume '}'
        return {
            type: 'FunctionDeclaration',
            name,
            params,
            body,
        };
    }

    function parseFunctionCall(functionName) {
        consume('left_parent'); // Consume '('
        const args = [];
        if (peek().type !== 'right_parent') {
            // Parse arguments if any
            while (true) {
                args.push(parseExpression()); // Parse each argument as an expression
                if (peek().type === 'operator' && peek().value === ',') {
                    consume('operator'); // Consume ','
                } else {
                    break;
                }
            }
        }
        consume('right_parent'); // Consume ')'
        return {
            type: 'FunctionCall',
            name: functionName,
            args,
        };
    }

    function parseReturnStatement(){
        consume('return');
        const value = parseExpression();
        consume('semicolon');
        return {
            type: 'Return',
            value
        };
    }

    function parseIfStatement(){
        consume('if');
        consume('left_parent');
        const test = parseExpression();
        consume('right_parent');
        const then = parseBlockStatement();
        let alter = null;
        if(peek() && peek().type === 'else'){
            consume('else');
            alter = parseStatement();
        }
        return {
            type: 'IfStatement',
            test,
            then,
            alter,
        };
    }

    function parseWhileStatement(){
        consume('while');
        consume('left_parent');
        const test = parseExpression();
        consume('right_parent');
        const then = parseBlockStatement();
         
        return {
            type: 'WhileStatement',
            test,
            then,
        };
    }

    function parseBlockStatement(){
        consume('left_brace');
        
        const body = [];
        while (peek() && peek().type !== 'right_brace') {
            body.push(parseStatement());
        }
        
        consume('right_brace'); // Consume '}'
        return {
            type: 'BlockStatement',
            body,
        };
    }

    function parseCustomBlock(){
        consume('percent');
        const insts = parseStatement().value.split('\n').map(line => line.trim()).filter(line => line).join('\n');
        consume('customInstructions');
        consume('percent');

        return {
            type : 'CustomBlock',
            insts
        };
    }

    function parseStatement() {
        const token = peek();

        if (token.type === 'function') {
            return parseFunctionDeclaration();
        }
        if (token.type === 'let') {
            return parseVariableDeclaration();
        }
        if (token.type === 'if') {
            return parseIfStatement();
        }
        if (token.type === 'left_brace'){
            return parseBlockStatement();
        }
        if (token.type === 'return'){
            return parseReturnStatement();
        }
        if (token.type === 'identifier') {
            const identifier = consume('identifier');
            if (peek() && peek().type === 'left_parent') {
                const ret = parseFunctionCall(identifier.value);
                consume('semicolon');
                return ret;
            }else if (peek() && peek().type === "assignment"){
                return parseVariableAssignment(identifier.value);
            }
            throw new TypeError(`Unexpected token after identifier '${identifier.value}'`);
        }
        if (token.type === 'percent'){
            return parseCustomBlock();
        }
        if (token.type === 'customInstructions'){
            return token;
        }
        if (token.type === 'while'){
            return parseWhileStatement();
        }

        throw new TypeError(`Unexpected statement: '${token.type}'`);
    }

    // Main parsing loop: parse each statement
    function parseProgram() {
        const program = [];
        while (current < tokens.length) {
            program.push(parseStatement());
        }
        return {
            type : 'Program',
            body : program
        };
    }

    return parseProgram();
}

class SymbolTable {
    constructor(parent = null) {
        this.table = {}; // Stores symbols in the current scope
        this.parent = parent; // Reference to the parent scope
    }
    define(name, info) {
        if (this.table[name]) {
            throw new Error(`Semantic Error: '${name}' is already defined in this scope.`);
        }
        this.table[name] = info;
    }
    resolve(name) {
        if (this.table[name]) {
            return this.table[name];
        } else if (this.parent) {
            return this.parent.resolve(name); // Check parent scope
        }
        throw new Error(`Semantic Error: '${name}' is not defined.`);
    }
}
function constantFolding(node) {
    // Apply constant folding only to BinaryExpression nodes
    if (node.type === "BinaryExpression") {
        // If both left and right sides are literals, evaluate the expression
        if (node.operator === "/" && node.right.type === "Literal" && node.right.value === 0) {
            throw new Error("Semantic Error: Division by zero.");
        }
        if (node.left.type === "Literal" && node.right.type === "Literal") {
            const leftValue = node.left.value;
            const rightValue = node.right.value;

            // Perform the operation based on the operator
            switch (node.operator) {
                case "+":
                    return { type: "Literal", value: leftValue + rightValue };
                case "-":
                    return { type: "Literal", value: leftValue - rightValue };
                case "*":
                    return { type: "Literal", value: leftValue * rightValue };
                case "/":
                    return { type: "Literal", value: parseInt(leftValue / rightValue) }; // let int = bool ? 1 : 0;
                case "==":
                    return { type: "Literal", value: +(leftValue == rightValue?1:0) };
                case "!=":
                    return { type: "Literal", value: +(leftValue != rightValue?1:0) };
                case "<=":
                    return { type: "Literal", value: +(leftValue <= rightValue?1:0) };
                case ">=":
                    return { type: "Literal", value: +(leftValue >= rightValue?1:0) };
                case "<":
                    return { type: "Literal", value: +(leftValue < rightValue?1:0) };
                case ">":
                    return { type: "Literal", value: +(leftValue > rightValue?1:0) };
                default:
                    throw new Error(`Unsupported operator for constant folding: ${node.operator}`);
            }
        }
    }
    return node; // Return the node unchanged if it's not foldable
}

function semanticAnalyzer(ast) {
    function visitNode(node, scope) {
        switch (node.type) {
            case "VariableDeclaration":
                // Check if variable is already declared in the current scope
                scope.define(node.name, { type: "variable", value: node.value });
                node.value = visitNode(node.value, scope); // Analyze and fold the value of the variable
                break;

            case "VariableAssignment":
                // Ensure the variable exists in the current or parent scope
                const variable = scope.resolve(node.name);
                if (variable.type !== "variable") {
                    throw new Error(`Semantic Error: '${node.name}' is not a variable.`);
                }
                // Validate the value being assigned
                node.value = visitNode(node.value, scope);
                break;

            case "FunctionDeclaration":
                // Define the function in the current scope
                scope.define(node.name, { type: "function", params: node.params });
                const functionScope = new SymbolTable(scope); // Create a new scope for the function
                // Define the function's parameters in the function scope
                node.params.forEach(param => {
                    functionScope.define(param, { type: "variable" });
                });
                // Analyze the function body
                node.body = node.body.map(element => visitNode(element, functionScope));
                break;

            case "BlockStatement":
                // Create a new scope for the block
                const blockScope = new SymbolTable(scope);
                node.body = node.body.map(statement => visitNode(statement, blockScope));
                break;

            case "BinaryExpression":
                // Analyze the left and right operands
                node.left = visitNode(node.left, scope);
                node.right = visitNode(node.right, scope);
                // Apply constant folding
                return constantFolding(node);

            case "Identifier":
                // Ensure the identifier is defined
                scope.resolve(node.name);
                break;

            case "Return":
                // Ensure the returned value is valid
                node.value = visitNode(node.value, scope);
                break;

            case "FunctionCall":
                // Ensure the function is defined
                const func = scope.resolve(node.name);
                if (func.type !== "function") {
                    throw new Error(`Semantic Error: '${node.name}' is not a function.`);
                }
                if (func.params.length !== node.args.length) {
                    throw new Error(
                        `Semantic Error: Function '${node.name}' expects ${func.params.length} arguments but got ${node.args.length}.`
                    );
                }
                // Analyze each argument
                node.args = node.args.map(arg => visitNode(arg, scope));
                break;

            case "IfStatement":
                // Ensure the conditon value is valid
                node.test = visitNode(node.test, scope);
                // Create a new scope for then
                const ifScope = new SymbolTable(scope);
                node.then = visitNode(node.then, ifScope);
                const elseScope = new SymbolTable(scope);
                if (node.alter) node.alter = visitNode(node.alter, elseScope);
                break;

            case "WhileStatement":
                // Ensure the conditon value is valid
                node.test = visitNode(node.test, scope);
                // Create a new scope for then
                const whileScope = new SymbolTable(scope);
                node.then = visitNode(node.then, whileScope);
                break;
    
            case "Literal":
                // Literals are always valid
                break;

            case "CustomBlock":
                // Custom code are always valid
                break;
    
            default:
                throw new Error(`Unknown AST node type: ${node.type}`);
        }
        return node;
    }
    // Create a global scope for the program
    const globalScope = new SymbolTable();
    ast.body = ast.body.map(statement => visitNode(statement, globalScope));
    return ast; // Return the modified AST with constant folding applied
}

class ScopeVairable {
    constructor(scope){
        this.scope = scope;
        this.table = new Map();
    }
}

// function generateOpcodes(ast) {
//     const opcodes = ["jmp start"];
//     const symbolTable = new Map();
//     let labelCounter = 0;
//     const funcPars = new Map();
    

//     function generateLabel(prefix) {
//         const label = `${prefix}_${labelCounter++}`;
//         return label;
//     }

//     function declareVariable(name, initialValue = 0) {
//         const label = generateLabel(name);
//         symbolTable.set(name, label);
//         opcodes.push(`${label}:\n${initialValue}`);
//         return label;
//     }

//     function declareFunction(node) {
//         const funcLabel = generateLabel(node.name);
//         symbolTable.set(node.name, funcLabel);

//         // Declare parameters as labels
//         pars = [];
//         node.params.forEach(param => {
//             pars.push(declareVariable(param));
//         });
//         funcPars.set(node.name, pars);
//         // Add the function label
//         opcodes.push(`${funcLabel}:`);
//         node.body.forEach(statement => visitNode(statement));
        
//     }

//     function visitNode(node, scope = null) {
//         switch (node.type) {
//             case "Program":
//                 // Process variable and function declarations first
//                 for (const statement of node.body) {
//                     if (statement.type === "VariableDeclaration") {
//                         const initialValue =
//                             statement.value && statement.value.type === "Literal"
//                                 ? statement.value.value
//                                 : 0;
//                         declareVariable(statement.name, initialValue);
//                     } else if (statement.type === "FunctionDeclaration") {
//                         declareFunction(statement);
//                     }
//                 }

//                 // Add the start label for the main program
//                 opcodes.push("start:");
//                 for (const statement of node.body) {
//                     if (statement.type !== "VariableDeclaration" && statement.type !== "FunctionDeclaration") {
//                         visitNode(statement);
//                     }else if(statement.type === "VariableDeclaration" && statement.value && statement.value.type !== "Literal"){
//                         visitNode({ type: "VariableAssignment", name: statement.name, value: statement.value });
//                     }
//                 }
//                 break;

//             case "VariableDeclaration":
//                 if (node.value) {
//                     visitNode({ type: "VariableAssignment", name: node.name, value: node.value });
//                 }
//                 break;

//             case "VariableAssignment":
//                 if (node.value.type === "Literal") {
//                     opcodes.push(`ldva\n${node.value.value}`);
//                 } else {
//                     visitNode(node.value);
//                 }
//                 opcodes.push(`sta ${symbolTable.get(node.name)}`);
//                 break;

//                 case "FunctionCall":
//                     const paramLabels = funcPars.get(node.name); // Get parameter labels
//                     if (!paramLabels) {
//                         throw new Error(`Function '${node.name}' is not defined or parameters are missing.`);
//                     }
//                     let index = 0;
//                     node.args.forEach((arg) => {
//                         if (index >= paramLabels.length) {
//                             throw new Error(`Too many arguments provided for function '${node.name}'.`);
//                         }
//                         const paramLabel = paramLabels[index++]; // Get current parameter label
//                         if (arg.type === "Literal") {
//                             opcodes.push(`ldva\n${arg.value}`); // Load literal value
//                         } else {
//                             visitNode(arg); // Process non-literal argument
//                         }
//                         opcodes.push(`sta ${paramLabel}`); // Store argument value in parameter
//                     });
//                     opcodes.push(`call ${symbolTable.get(node.name)}`); // Call the function
//                     break;                

//             case "Return":
//                 visitNode(node.value);
//                 opcodes.push("ret");
//                 break;

//             case "BinaryExpression":
//                 visitNode(node.left);
//                 opcodes.push("pusha");
//                 visitNode(node.right);
//                 opcodes.push("popb");

//                 switch (node.operator) {
//                     case "+":
//                         opcodes.push("addba");
//                         opcodes.push("movba");
//                         break;
//                     case "-":
//                         opcodes.push("subba");
//                         opcodes.push("movba");
//                         break;
//                     case "*":
//                         opcodes.push("mulba");
//                         opcodes.push("movba");
//                         break;
//                     case "/":
//                         opcodes.push("divba");
//                         opcodes.push("movba");
//                         break;
//                     default:
//                         throw new Error(`Unsupported operator: ${node.operator}`);
//                 }
//                 break;

//             case "Literal":
//                 opcodes.push(`ldva\n${node.value}`);
//                 break;

//             case "Identifier":
//                 opcodes.push(`lda ${symbolTable.get(node.name)}`);
//                 break;

//             default:
//                 throw new Error(`Unknown node type: ${node.type}`);
//         }
//     }

//     visitNode(ast);
//     return opcodes.join("\n") + "\nhlt";
// }

function generateOpcodes(ast) {
    const opcodes = ["jmp start"];
    const globalSymbolTable = new Map(); // Global variables and functions
    let labelCounter = 0;
    const funcPars = new Map(); // Function parameters mapping
    const scopeStack = []; // Stack for tracking scopes
    let spOffset = 0; // Stack pointer offset for the current scope

    function generateLabel(prefix) {
        return `${prefix}_${labelCounter++}`;
    }

    function pushScope() {
        const newScope = new ScopeVairable(scopeStack.length);
        scopeStack.push(newScope);
    }

    function popScope() {
        const currentScope = scopeStack.pop();
        const varsToPop = currentScope.table.size;
        for (let i = 0; i < varsToPop; i++) {
            opcodes.push("pop");
        }
        spOffset -= varsToPop;
    }

    function declareVariableInScope(name, initialValue = 0) {
        const currentScope = scopeStack[scopeStack.length - 1];
        if (!currentScope) throw new Error("No active scope to declare variable");

        // Save variable position in the stack
        currentScope.table.set(name, spOffset++);
        opcodes.push(`ldva\n${initialValue}`);
        opcodes.push("push");
    }

    function accessVariable(name) {
        for (let i = scopeStack.length - 1; i >= 0; i--) {
            const scope = scopeStack[i];
            if (scope.table.has(name)) {
                const offset = scope.table.get(name);
                opcodes.push("mspb"); // Load stack pointer into A
                opcodes.push(`ldva\n${offset}`); // Load variable position offset
                opcodes.push("addba"); // Add stack pointer and offset
                return;
            }
        }
        throw new Error(`Variable '${name}' not declared in any active scope.`);
    }

    function declareGlobalVariable(name, initialValue = 0) {
        const label = generateLabel(name);
        globalSymbolTable.set(name, label);
        opcodes.push(`${label}:\n${initialValue}`);
        return label;
    }

    function accessGlobalVariable(name) {
        const label = globalSymbolTable.get(name);
        if (!label) throw new Error(`Global variable '${name}' not found.`);
        opcodes.push(`lda ${label}`);
    }

    function declareFunction(node) {
        const funcLabel = generateLabel(node.name);
        globalSymbolTable.set(node.name, funcLabel);

        // Declare parameters as labels
        pars = [];
        node.params.forEach(param => {
            pars.push(declareGlobalVariable(param));
        });
        funcPars.set(node.name, pars);
        // Add the function label
        opcodes.push(`${funcLabel}:`);
        node.body.forEach(statement => visitNode(statement));
        opcodes.push("ret");
    }

    function visitNode(node) {
        switch (node.type) {
            case "Program":
                // Declare globals and functions
                pushScope();
                for (const statement of node.body) {
                    if (statement.type === "VariableDeclaration") {
                        {const initialValue =
                            statement.value && statement.value.type === "Literal"
                                ? statement.value.value
                                : 0;
                        declareGlobalVariable(statement.name, initialValue);}
                    } else if (statement.type === "FunctionDeclaration") {
                        declareFunction(statement);
                    }
                }

                // Add start label
                opcodes.push("start:");
                for (const statement of node.body) {
                    if (statement.type !== "FunctionDeclaration") {
                        visitNode(statement);
                    }
                }
                popScope();
                break;

            case "BlockStatement":
                pushScope();
                node.body.forEach(statement => visitNode(statement));
                popScope();
                break;

            case "VariableDeclaration":
                if (scopeStack.length > 1) {
                    if(node.value && node.value.type === "Literal"){
                        declareVariableInScope(node.name, initialValue);
                    }else{
                        declareVariableInScope(node.name,0);
                        visitNode({ type: "VariableAssignment", name: node.name, value: node.value });
                    }
                            
                } else if(node.type === "VariableDeclaration" && node.value && node.value.type !== "Literal"){
                    visitNode({ type: "VariableAssignment", name: node.name, value: node.value });
                }
                break;

            case "VariableAssignment":
                if (scopeStack.length > 1 && !globalSymbolTable.has(node.name)) {
                    accessVariable(node.name); // Get the variable location
                    opcodes.push("pushb")
                    visitNode(node.value); // Process the right-hand value
                    opcodes.push("popb");
                    opcodes.push("stab"); // Store the value at the address in B
                } else {
                    visitNode(node.value);
                    opcodes.push(`sta ${globalSymbolTable.get(node.name)}`);
                }
                break;

            case "Identifier":
                if (scopeStack.length > 1 && !globalSymbolTable.has(node.name)) {
                    accessVariable(node.name);
                    opcodes.push("ldba"); // Access variable value from memory
                }else{
                    accessGlobalVariable(node.name);
                }
                break;

            case "Literal":
                opcodes.push(`ldva\n${node.value}`);
                break;

            case "BinaryExpression":
                visitNode(node.left);
                opcodes.push("pusha");
                visitNode(node.right);
                opcodes.push("popb");
                switch (node.operator) {
                    case "+":
                        opcodes.push("addba");
                        opcodes.push("movba");
                        break;
                    case "-":
                        opcodes.push("subba");
                        opcodes.push("movba");
                        break;
                    case "*":
                        opcodes.push("mulba");
                        opcodes.push("movba");
                        break;
                    case "/":
                        opcodes.push("divba");
                        opcodes.push("movba");
                        break;
                    case "<":
                        {opcodes.push("cmpba");
                        const yesL = generateLabel("yes");
                        const endTestL = generateLabel("endTest");
                        opcodes.push(`jl ${yesL}`);
                        opcodes.push(`ldva \n0`);
                        opcodes.push(`jmp ${endTestL}`);
                        opcodes.push(`${yesL}:`);
                        opcodes.push(`ldva \n1`);
                        opcodes.push(`${endTestL}:`);}
                        break;
                    case ">":
                        {opcodes.push("cmpba");
                        const yesL = generateLabel("yes");
                        const endTestL = generateLabel("endTest");
                        opcodes.push(`jg ${yesL}`);
                        opcodes.push(`ldva \n0`);
                        opcodes.push(`jmp ${endTestL}`);
                        opcodes.push(`${yesL}:`);
                        opcodes.push(`ldva \n1`);
                        opcodes.push(`${endTestL}:`);}
                        break;
                    case "==":
                        {opcodes.push("cmpba");
                        const yesL = generateLabel("yes");
                        const endTestL = generateLabel("endTest");
                        opcodes.push(`je ${yesL}`);
                        opcodes.push(`ldva \n0`);
                        opcodes.push(`jmp ${endTestL}`);
                        opcodes.push(`${yesL}:`);
                        opcodes.push(`ldva \n1`);
                        opcodes.push(`${endTestL}:`);}
                        break;
                    case "!=":
                        {opcodes.push("cmpba");
                        const yesL = generateLabel("yes");
                        const endTestL = generateLabel("endTest");
                        opcodes.push(`jn ${yesL}`);
                        opcodes.push(`ldva \n0`);
                        opcodes.push(`jmp ${endTestL}`);
                        opcodes.push(`${yesL}:`);
                        opcodes.push(`ldva \n1`);
                        opcodes.push(`${endTestL}:`);}
                        break;
                    case "<=":
                        {opcodes.push("cmpba");
                        const yesL = generateLabel("yes");
                        const endTestL = generateLabel("endTest");
                        opcodes.push(`jl ${yesL}`);
                        opcodes.push(`je ${yesL}`);
                        opcodes.push(`ldva \n0`);
                        opcodes.push(`jmp ${endTestL}`);
                        opcodes.push(`${yesL}:`);
                        opcodes.push(`ldva \n1`);
                        opcodes.push(`${endTestL}:`);}
                        break;
                    case ">=":
                        {opcodes.push("cmpba");
                        const yesL = generateLabel("yes");
                        const endTestL = generateLabel("endTest");
                        opcodes.push(`jg ${yesL}`);
                        opcodes.push(`je ${yesL}`);
                        opcodes.push(`ldva \n0`);
                        opcodes.push(`jmp ${endTestL}`);
                        opcodes.push(`${yesL}:`);
                        opcodes.push(`ldva \n1`);
                        opcodes.push(`${endTestL}:`);}
                        break;
                    default:
                        throw new Error(`Unsupported operator: ${node.operator}`);
                }
                break;

            case "FunctionCall":
                const paramLabels = funcPars.get(node.name); // Get parameter labels
                if (!paramLabels) {
                    throw new Error(`Function '${node.name}' is not defined or parameters are missing.`);
                }
                let index = 0;
                node.args.forEach((arg) => {
                    if (index >= paramLabels.length) {
                        throw new Error(`Too many arguments provided for function '${node.name}'.`);
                    }
                    const paramLabel = paramLabels[index++]; // Get current parameter label
                    if (arg.type === "Literal") {
                        opcodes.push(`ldva\n${arg.value}`); // Load literal value
                    } else {
                        visitNode(arg); // Process non-literal argument
                    }
                    opcodes.push(`sta ${paramLabel}`); // Store argument value in parameter
                });
                opcodes.push(`call ${globalSymbolTable.get(node.name)}`); // Call the function
                break;

            case "Return":
                visitNode(node.value);
                break;

            case "CustomBlock":
                opcodes.push(node.insts);
                break;

            case "IfStatement":
                {visitNode(node.test);
                opcodes.push("addaa");
                const elseLabel = generateLabel("else");
                const endLabel = generateLabel("endif");
                opcodes.push(`jz ${elseLabel}`);
                visitNode(node.then);
                opcodes.push(`jmp ${endLabel}`);
                opcodes.push(`${elseLabel}:`);
                if (node.alter) visitNode(node.alter);
                opcodes.push(`${endLabel}:`);}
                break;

            case "WhileStatement":
                {const loop = generateLabel("loop");
                const endLoop = generateLabel("endloop");
                opcodes.push(`${loop}:`);
                visitNode(node.test);
                opcodes.push("testa");
                opcodes.push(`jz ${endLoop}`);
                visitNode(node.then);
                opcodes.push(`jmp ${loop}`);
                opcodes.push(`${endLoop}:`);}
                break;
            
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    visitNode(ast);
    return opcodes.join("\n") + "\nhlt";
}

// Function to print the entire AST
function printAST(ast) {
    function printTree(body, n = 0){
        body.forEach(node => {
            printParseTree(node,n);
        });
    }
    function printParseTree(node, indent = 0) {
        // Helper function for indentation
        function addIndent(indent1) {
            return ' '.repeat(indent1 * 2); // Two spaces per indentation level
        }
    
        // Print the node type
        let output = addIndent(indent) + node.type;
    
        // Add additional details for certain types of nodes
        if (node.type === 'Literal') {
            output += `: ${node.value}`;
        } else if (node.type === 'Identifier') {
            output += `: ${node.name}`;
        } else if (node.type === 'VariableDeclaration') {
            output += ` (${node.name})`;
        } else if (node.type === 'VariableAssignment') {
            output += ` (${node.name})`;
        } else if (node.type === 'FunctionCall') {
            output += `: ${node.name}(args=${node.args.length})`;
        } else if (node.type === 'FunctionDeclaration') {
            output += ` ${node.name}`;
            output += '(';
            output += node.params.join(',');
            output += ')';
        } else if (node.type === 'BlockStatement') {
            output += ' ==>';
        } else if (node.type === 'BinaryExpression') {
            output += ` (${node.operator})`;
        } else if (node.type === 'Program') {
            output += ' ==>';
        } else if (node.type === 'IfStatement') {
            output += ` [if${(node.alter)?" else":""}]`;
        } else if (node.type === 'CustomBlock'){
            node.insts.split('\n').forEach(text => {
                output += `\n${addIndent(indent+1)}${text}`;
            });
        } else if (node.type === 'WhileStatement') {
            output += ``;
        }
    
        console.log(output);
    
        // Recursively print child nodes if they exist
        if (node.type === 'VariableDeclaration' && node.value) {
            printParseTree(node.value, indent + 1);
        } else if (node.type === 'VariableAssignment' && node.value) {
            printParseTree(node.value, indent + 1);
        } else if (node.type === 'PrintStatement' && node.argument) {
            printParseTree(node.argument, indent + 1);
        } else if (node.type === 'BinaryExpression') {
            printParseTree(node.left, indent + 1);
            printParseTree(node.right, indent + 1);
        } else if (node.type === 'FunctionDeclaration') {
            printTree(node.body, indent + 1);
        } else if (node.type === 'FunctionCall') {
            printTree(node.args, indent + 1);
        } else if (node.type === 'Return') {
            printParseTree(node.value, indent + 1);
        } else if (node.type === 'BlockStatement') {
            printTree(node.body, indent + 1);
        } else if (node.type === 'IfStatement') {
            printParseTree(node.test, indent + 1);
            printParseTree(node.then, indent + 1);
            if (node.alter) printParseTree(node.alter, indent + 1);
        } else if (node.type === 'WhileStatement') {
            printParseTree(node.test, indent + 1);
            printParseTree(node.then, indent + 1);
        } else if (node.type === 'Program') {
            printTree(node.body, indent + 1);
        }
    }
    console.log('Abstract Syntax Tree:');
    printParseTree(ast);
}

class Compiler {
    constructor(text) {
        this.m_text = text;
        this.m_Out = "";
    }

    compiling() {
        const tokens = tokenizer(this.m_text);
        // console.log(tokens);
        const parse = parser(tokens);
        // console.log(parse);
        // printAST(parse);
        const sematic_parse = semanticAnalyzer(parse);
        console.log("Semantic analysis passed.");
        printAST(sematic_parse);
        const opcode = generateOpcodes(sematic_parse);
        console.log(opcode);
        this.m_Out = opcode;
    }
}