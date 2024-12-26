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

        // 将辅助函数移到 tokenize 内部
        function collectNumber() {
            let num = '';
            while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
                num += expr[i];
                i++;
            }
            return num;
        }

        function collectIdentifier() {
            let name = '';
            while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
                name += expr[i];
                i++;
            }
            return name;
        }

        while (i < expr.length) {
            const char = expr[i];

            // 1. 处理负数
            if (char === '-' && isStartOfNumber(tokens)) {
                // 收集负数
                i++;  // 跳过负号
                let num = '-' + collectNumber();
                tokens.push(['number', parseFloat(num)]);
                continue;
            }

            // 2. 处理普通数字
            if (/\d/.test(char)) {
                let num = collectNumber();
                tokens.push(['number', parseFloat(num)]);
                continue;
            }

            // 3. 处理函数名和常量
            if (/[a-zA-Z]/.test(char)) {
                let name = collectIdentifier();
                if (functions.has(name)) {
                    tokens.push(['function', name]);
                } else if (constants.has(name)) {
                    tokens.push(['number', CONSTANTS[name]]);
                }
                continue;
            }

            // 4. 处理运算符、括号和分隔符
            if (operators.has(char)) {
                tokens.push(['operator', char]);
            } else if ('()'.includes(char)) {
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

        // 处理运算符的核心函数
        function processOperator(operatorStack, output) {
            const op = operatorStack.pop();
            const node = createNode(op);

            if (operators.has(op)) {
                // 处理普通运算符
                const argsCount = OPERATORS[op].args;
                node.args = Array(argsCount)
                    .fill()
                    .map(() => output.pop())
                    .reverse();
            } else if (functions.has(op)) {
                // 处理函数调用
                const args = [];
                let currentArg = [];
                
                // 收集参数直到遇到左括号
                while (output.length) {
                    const current = output[output.length - 1];
                    
                    // 遇到左括号时结束
                    if (current.value === '(') {
                        output.pop();  // 移除左括号
                        break;
                    }
                    
                    // 弹出当前节点
                    const param = output.pop();
                    
                    // 遇到逗号时，处理当前参数
                    if (param.value === ',') {
                        if (currentArg.length === 1) {
                            args.unshift(currentArg[0]);
                        } else if (currentArg.length > 1) {
                            args.unshift(processExpression(currentArg));
                        }
                        currentArg = [];
                    } else {
                        // 收集当前参数
                        currentArg.unshift(param);
                    }
                }
                
                // 处理最后一个参数
                if (currentArg.length === 1) {
                    args.unshift(currentArg[0]);
                } else if (currentArg.length > 1) {
                    args.unshift(processExpression(currentArg));
                }
                
                node.args = args;
            }

            output.push(node);
        }

        // 辅助函数：处理复合表达式
        function processExpression(nodes) {
            if (nodes.length === 0) return null;
            if (nodes.length === 1) return nodes[0];
            
            nodes = [...nodes];
            
            // 1. 从内到外处理所有函数调用
            let i = 0;
            while (i < nodes.length) {
                const node = nodes[i];
                if (node.value === ')') {
                    let j = i;
                    let depth = 1;
                    while (j >= 0 && depth > 0) {
                        j--;
                        if (j >= 0) {
                            if (nodes[j].value === ')') depth++;
                            if (nodes[j].value === '(') depth--;
                        }
                    }
                    
                    // 如果找到了函数调用
                    if (j > 0 && functions.has(nodes[j-1].value)) {
                        const funcArgs = [];
                        let start = j + 1;
                        let currentDepth = 0;
                        
                        // 分割并处理每个参数，考虑嵌套的括号
                        for (let k = j + 1; k < i; k++) {
                            if (nodes[k].value === '(') currentDepth++;
                            else if (nodes[k].value === ')') currentDepth--;
                            
                            // 只在当前深度为0时处理逗号
                            if ((nodes[k].value === ',' && currentDepth === 0) || k === i - 1) {
                                const end = k === i - 1 ? k + 1 : k;
                                const argNodes = nodes.slice(start, end);
                                if (argNodes.length > 0) {
                                    // 递归处理每个参数
                                    const processedArg = processExpression(argNodes);
                                    if (processedArg) {
                                        funcArgs.push(processedArg);
                                    }
                                }
                                start = k + 1;
                            }
                        }
                        
                        // 创建函数节点
                        const func = nodes[j-1];
                        func.args = funcArgs;
                        
                        // 替换原始节点序列
                        nodes.splice(j-1, i-j+2, func);
                        i = j-1;
                    }
                }
                i++;
            }
            
            // 2. 处理运算符（按优先级）
            const precedences = [3, 2, 1];  // 从高到低的优先级
            for (const precedence of precedences) {
                for (let i = nodes.length - 1; i >= 0; i--) {
                    const node = nodes[i];
                    if (typeof node.value === 'string' && 
                        OPERATORS[node.value] && 
                        OPERATORS[node.value].precedence === precedence) {
                        const op = node;
                        const argsCount = OPERATORS[op.value].args;
                        
                        if (argsCount === 1) {
                            // 处理单目运算符
                            op.args = [processExpression(nodes.slice(i + 1))];
                            nodes.splice(i, nodes.length - i, op);
                        } else {
                            // 处理双目运算符
                            op.args = [
                                processExpression(nodes.slice(0, i)),
                                processExpression(nodes.slice(i + 1))
                            ].filter(Boolean);
                            return op;
                        }
                    }
                }
            }
            
            return nodes[0];
        }

        // 主处理逻辑
        for (const [type, token] of tokens) {
            switch (type) {
                case 'number':
                    output.push(createNode(token));
                    break;
                case 'function':
                    operatorStack.push(token);
                    break;
                case 'separator':
                    // 处理分隔符前的所有操作符
                    while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                        processOperator(operatorStack, output);
                    }
                    output.push(createNode(','));
                    break;
                case 'operator':
                    if (token === '(') {
                        operatorStack.push(token);
                    }
                    else if (token === ')') {
                        // 处理括号内的所有操作符
                        while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                            processOperator(operatorStack, output);
                        }
                        if (!operatorStack.length) {
                            throw new Error("括号不匹配");
                        }
                        operatorStack.pop();  // 弹出左括号
                        // 如果左括号前是函数，立即处理该函数
                        if (operatorStack.length && functions.has(operatorStack[operatorStack.length - 1])) {
                            processOperator(operatorStack, output);
                        }
                    }
                    else {
                        while (operatorStack.length && 
                               operatorStack[operatorStack.length - 1] !== '(' && 
                               operators.has(operatorStack[operatorStack.length - 1]) &&
                               OPERATORS[operatorStack[operatorStack.length - 1]].precedence >= 
                               OPERATORS[token].precedence) {
                            processOperator(operatorStack, output);
                        }
                        operatorStack.push(token);
                    }
                    break;
            }
        }

        // 处理剩余的运算符
        while (operatorStack.length) {
            if (operatorStack[operatorStack.length - 1] === '(') {
                throw new Error("括号不匹配");
            }
            processOperator(operatorStack, output);
        }

        return output[0] || null;
    }

    function evaluate(node, operators, functions) {
        if (!node) return 0;

        // 1. 处理数字节点
        if (typeof node.value === 'number') {
            return node.value;
        }

        // 2. 递归计算参数
        const args = node.args.map(arg => evaluate(arg, operators, functions));

        // 3. 执行运算
        if (operators.has(node.value)) {
            return OPERATORS[node.value].func(...args);
        }

        if (functions.has(node.value)) {
            const func = FUNCTIONS[node.value].func;
            // 特殊处理 max 和 min 函数
            if (node.value === 'max' || node.value === 'min') {
                return args.length === 1 ? func(args) : func(...args);
            }
            return func(...args);
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

    // 辅助函数：检查是否应该将负号视为负数的一部分
    function isStartOfNumber(tokens) {
        return !tokens.length || 
               (tokens[tokens.length-1][0] === 'operator' && tokens[tokens.length-1][1] === '(') ||
               (tokens[tokens.length-1][0] === 'separator');
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
        "max(-1,-1-1,1, min(10, -1-1, 2))",
        "-1",
        "1 + 2",
        "2 * (3 + 4)",
        "(1 + 2) * (-3 - 4)",
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