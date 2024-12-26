import { OPERATORS, FUNCTIONS, CONSTANTS } from './operators.js';

// 创建一个立即执行函数表达式(IIFE)来实现模块模式
const Calculator = (function() {
    // 私有函数和变量
    function createNode(value) {
        return {
            value,
            args: []
        };
    }

    function tokenize(expr, operators, functions, constants) {
        const tokens = [];
        let i = 0;
        expr = expr.replace(/\s/g, '');

        while (i < expr.length) {
            const char = expr[i];

            // 处理数字
            if (/\d/.test(char)) {
                let num = '';
                while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
                    num += expr[i];
                    i++;
                }
                tokens.push(['number', parseFloat(num)]);
                continue;
            }

            // 处理函数名、常数和变量
            if (/[a-zA-Z]/.test(char)) {
                let name = '';
                while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
                    name += expr[i];
                    i++;
                }
                if (functions.has(name)) {
                    tokens.push(['function', name]);
                } else if (constants.has(name)) {
                    tokens.push(['number', CONSTANTS[name]]);
                }
                continue;
            }

            // 处理运算符和括号
            if (operators.has(char) || '()'.includes(char)) {
                tokens.push(['operator', char]);
            } else if (char === ',') {
                tokens.push(['separator', char]);
            }

            i++;
        }

        return tokens;
    }

    function buildAst(tokens, operators, functions) {
        const output = [];
        const operatorStack = [];

        function processOperator(operators, output) {
            const op = operatorStack.pop();
            const node = createNode(op);

            if (operators.has(op)) {
                const argsCount = OPERATORS[op].args;
                node.args = Array(argsCount).fill().map(() => output.pop()).reverse();
            } else if (functions.has(op)) {
                const args = [];
                while (output.length && output[output.length - 1].value !== ',') {
                    args.push(output.pop());
                }
                node.args = args.reverse();
            }

            output.push(node);
        }

        for (const [tokenType, token] of tokens) {
            if (tokenType === 'number') {
                output.push(createNode(token));
            }
            else if (tokenType === 'function') {
                operatorStack.push(token);
            }
            else if (tokenType === 'operator') {
                if (token === '(') {
                    operatorStack.push(token);
                }
                else if (token === ')') {
                    while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                        processOperator(operators, output);
                    }
                    if (operatorStack.length) {
                        operatorStack.pop();
                        if (operatorStack.length && functions.has(operatorStack[operatorStack.length - 1])) {
                            processOperator(operators, output);
                        }
                    }
                }
                else {
                    while (operatorStack.length && 
                           operatorStack[operatorStack.length - 1] !== '(' && 
                           operators.has(operatorStack[operatorStack.length - 1]) &&
                           OPERATORS[operatorStack[operatorStack.length - 1]].precedence >= 
                           OPERATORS[token].precedence) {
                        processOperator(operators, output);
                    }
                    operatorStack.push(token);
                }
            }
        }

        while (operatorStack.length) {
            processOperator(operators, output);
        }

        return output[0] || null;
    }

    function evaluate(node, operators, functions) {
        if (!node) return 0;

        if (typeof node.value === 'number') {
            return node.value;
        }

        const args = node.args.map(arg => evaluate(arg, operators, functions));

        if (operators.has(node.value)) {
            return OPERATORS[node.value].func(...args);
        }

        if (functions.has(node.value)) {
            return FUNCTIONS[node.value].func(...args);
        }

        throw new Error(`未知的操作符或函数: ${node.value}`);
    }

    function generateMermaidAST(node, counter = {count: 0}) {
        if (!node) return { nodes: '', edges: '' };

        const currentId = `node${counter.count++}`;
        let nodes = `${currentId}["${typeof node.value === 'number' ? 
            node.value.toString() : 
            node.value}"];\n`;
        let edges = '';

        for (let i = 0; i < node.args.length; i++) {
            const child = node.args[i];
            const childResult = generateMermaidAST(child, counter);
            nodes += childResult.nodes;
            edges += childResult.edges;
            edges += `${currentId} -->|"arg${i + 1}"| node${counter.count-1};\n`;
        }

        return { nodes, edges };
    }

    // 返回公共API
    return {
        calculate(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const tokens = tokenize(expr, operators, functions, constants);
            const ast = buildAst(tokens, operators, functions);
            return evaluate(ast, operators, functions);
        },

        // 新增方法：获取AST节点
        getASTNode(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const tokens = tokenize(expr, operators, functions, constants);
            return buildAst(tokens, operators, functions);
        },

        generateAST(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const tokens = tokenize(expr, operators, functions, constants);
            const ast = buildAst(tokens, operators, functions);
            
            const { nodes, edges } = generateMermaidAST(ast);
            return `graph TD;\n${nodes}${edges}`;
        }
    };
})();

export default Calculator;

// 使用示例
if (typeof window === 'undefined') {
    const expressions = [
        "1 + 2",
        "2 * (3 + 4)",
        "(1 + 2) * (3 + 4)",
        "max(1, 2, 3)",
        "1# + 2",
        "1#",
        "150°",
        "deg(150)",
        "rad(PI/2)",
        "e#"
    ];

    for (const expr of expressions) {
        try {
            console.log(`\n处理表达式: ${expr}`);
            const result = Calculator.calculate(expr);
            console.log(`结果: ${result}`);
        } catch (e) {
            console.log(`错误: ${e.message}`);
        }
    }
} 