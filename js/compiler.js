
function check_keyword(text) {
    switch (text) {
        case "print":
            return { type: 'print', value: 'print' };
        case "let":
            return { type: 'let', value: 'let' };
        case "exit":
            return { type: 'exit', value: 'exit' };
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
            tokens.push({ type: 'number', value });
            continue;
        }
        if (char === ';') { tokens.push({ type: 'semicolon', value: char }); current++; continue; }
        if (char === '=') { tokens.push({ type: 'assignment', value: char }); current++; continue; }
        if (/[+\-*/()]/.test(char)) { tokens.push({ type: 'operator', value: char }); current++; continue; }
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


// function parser(tokens) {
//     let current = 0;

//     function walk() {
//         let token = tokens[current];

//         // Handle numbers
//         if (token.type === 'number') {
//             current++;
//             return { type: 'Literal', value: token.value };
//         }

//         // Handle print statements
//         if (token.type === 'print') {
//             current++;

//             // Ensure the next token is an opening parenthesis
//             if (tokens[current]?.type !== 'operator' || tokens[current]?.value !== '(') {
//                 throw new TypeError("Expected '(' after 'print'");
//             }
//             current++;

//             // Check for an argument or empty parentheses
//             let argument = null;
//             if (tokens[current]?.type !== 'operator' || tokens[current]?.value !== ')') {
//                 argument = walk(); // Parse the argument
//             }

//             // Ensure the next token is a closing parenthesis
//             if (tokens[current]?.type !== 'operator' || tokens[current]?.value !== ')') {
//                 throw new TypeError("Expected ')' after print argument");
//             }
//             current++;

//             // Ensure the next token is a semicolon
//             if (tokens[current]?.type !== 'semicolon') {
//                 throw new TypeError("Expected ';' after print statement");
//             }
//             current++;

//             return { type: 'PrintStatement', argument };
//         }
//         // Handle parenthetical expressions
//         if (token.type === 'operator' && token.value === '(') {
//             current++; // Skip '('
//             const left = walk(); // Parse the left-hand side of the expression

//             const operator = tokens[current];
//             if (operator.type !== 'operator') {
//                 throw new TypeError(`Expected operator inside parentheses, found: ${operator.type}`);
//             }
//             current++; // Consume the operator

//             const right = walk(); // Parse the right-hand side of the expression

//             if (tokens[current]?.value !== ')') {
//                 throw new TypeError('Expected closing parenthesis');
//             }
//             current++; // Skip ')'

//             return {
//                 type: 'BinaryExpression',
//                 operator: operator.value,
//                 left,
//                 right,
//             };
//         }

//         // Handle identifiers
//         if (token.type === 'identifier') {
//             current++;
//             return { type: 'Identifier', name: token.value };
//         }

//         // Handle binary expressions
//         if (token.type === 'operator') {
//             const left = walk();
//             const operator = token.value;
//             current++;
//             const right = walk();
//             return {
//                 type: 'BinaryExpression',
//                 operator,
//                 left,
//                 right,
//             };
//         }

//         throw new TypeError(`Unexpected token: ${token.type}`);   
//     }

//     function parseLet() {
//         const token = tokens[current];
//         if (token.type !== 'let') {
//             throw new TypeError("Expected 'let' keyword");
//         }
//         current++;

//         // Parse the variable name
//         const nameToken = tokens[current];
//         if (nameToken.type !== 'identifier') {
//             throw new TypeError(`Expected identifier, found: ${nameToken.type}`);
//         }
//         const name = nameToken.value;
//         current++;

//         // Ensure there is an '='
//         const assignmentToken = tokens[current];
//         if (assignmentToken.type !== 'assignment') {
//             throw new TypeError("Expected '=' after identifier");
//         }
//         current++;

//         // Parse the right-hand side (expression)
//         const value = walk();

//         // Ensure the statement ends with a semicolon
//         const semicolonToken = tokens[current];
//         if (semicolonToken.type !== 'semicolon') {
//             throw new TypeError("Expected ';' after variable declaration");
//         }
//         current++;

//         return {
//             type: 'VariableDeclaration',
//             name,
//             value,
//         };
//     }

//     const ast = [];
//     while (current < tokens.length) {
//         const token = tokens[current];

//         if (token.type === 'let') {
//             ast.push(parseLet());
//         } else {
//             ast.push(walk());
//         }
//     }
//     return ast;

// }
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

    // Walk through the tokens and build the AST nodes
    function walk() {
        const token = peek();

        // Handle variable declarations
        if (token.type === 'let') {
            return parseVariableDeclaration();
        }

        // Handle print statements
        if (token.type === 'print') {
            return parsePrintStatement();
        }

        // Handle expressions
        return parseExpression();
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

    // Parse a print statement
    function parsePrintStatement() {
        consume('print'); // Consume the 'print' keyword
        consume('operator'); // Consume the '('
        let argument = null;
        if (peek().type !== 'operator' || peek().value !== ')') {
            argument = parseExpression(); // Parse the expression inside print
        }
        consume('operator'); // Consume the ')'
        consume('semicolon'); // Ensure the statement ends with a semicolon

        return {
            type: 'PrintStatement',
            argument,
        };
    }

    // Parse an expression
    function parseExpression() {
        return parseBinaryExpression();
    }

    // Parse a binary expression
    function parseBinaryExpression() {
        let left = parsePrimary(); // Parse the left-hand operand

        while (peek() && peek().type === 'operator' && peek().value !== '(' && peek().value !== ')') {
            const operator = consume('operator'); // Consume the operator
            const right = parsePrimary(); // Parse the right-hand operand
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right,
            };
        }

        return left;
    }

    // Parse primary expressions (literals, identifiers, parenthetical expressions)
    function parsePrimary() {
        const token = peek();

        // Parse literals (numbers)
        if (token.type === 'number') {
            consume('number');
            return { type: 'Literal', value: token.value };
        }

        // Parse identifiers
        if (token.type === 'identifier') {
            consume('identifier');
            return { type: 'Identifier', name: token.value };
        }

        // Parse parenthetical expressions
        if (token.type === 'operator' && token.value === '(') {
            consume('operator'); // Consume '('
            const expression = parseExpression(); // Parse the inner expression
            consume('operator'); // Consume ')'
            return expression;
        }

        throw new TypeError(`Unexpected token: ${token?.type || 'EOF'}`);
    }

    // Main parsing loop: parse each statement
    const ast = [];
    while (current < tokens.length) {
        ast.push(walk());
    }

    return ast;
}


function codeGenerator(node) {
    if (node.type === 'Literal') {
        return node.value;
    }

    if (node.type === 'Expression') {
        return `(${codeGenerator(node.left)} ${node.operator} ${codeGenerator(node.right)})`;
    }

    throw new TypeError(`Unknown node type: ${node.type}`);
}


// Function to print the entire AST
function printAST(ast) {
    function printParseTree(node, indent = 0) {
        // Helper function for indentation
        function addIndent() {
            return ' '.repeat(indent * 2); // Two spaces per indentation level
        }
    
        // Print the node type
        let output = addIndent() + node.type;
    
        // Add additional details for certain types of nodes
        if (node.type === 'Literal') {
            output += `: ${node.value}`;
        } else if (node.type === 'Identifier') {
            output += `: ${node.name}`;
        } else if (node.type === 'VariableDeclaration') {
            output += ` (${node.name})`;
        } else if (node.type === 'PrintStatement') {
            output += node.argument ? ' (with argument)' : ' (empty)';
        } else if (node.type === 'BinaryExpression') {
            output += ` (${node.operator})`;
        }
    
        console.log(output);
    
        // Recursively print child nodes if they exist
        if (node.type === 'VariableDeclaration' && node.value) {
            printParseTree(node.value, indent + 1);
        } else if (node.type === 'PrintStatement' && node.argument) {
            printParseTree(node.argument, indent + 1);
        } else if (node.type === 'BinaryExpression') {
            printParseTree(node.left, indent + 1);
            printParseTree(node.right, indent + 1);
        }
    }
    console.log('Abstract Syntax Tree:');
    ast.forEach(node => {
        printParseTree(node);
    });
}

class Compiler {
    constructor(text) {
        this.m_text = text;

        this.m_Out = "";
    }

    compiling() {
        const tokens = tokenizer(this.m_text);
        const parse = parser(tokens);
        // console.log(parse);
        printAST(parse);
    }
}