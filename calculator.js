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
        let current = 0;  // 当前处理的token位置

        // 创建节点
        function createNode(value, args = []) {
            return { value, args };
        }

        // 解析表达式
        function parseExpression() {
            return parseAdditive();
        }

        // 解析加法和减法
        function parseAdditive() {
            let left = parseMultiplicative();

            while (current < tokens.length) {
                const [type, token] = tokens[current];
                if (type !== 'operator' || (token !== '+' && token !== '-')) {
                    break;
                }
                current++;
                const right = parseMultiplicative();
                left = createNode(token, [left, right]);
            }

            return left;
        }

        // 解析乘法和除法
        function parseMultiplicative() {
            let left = parseUnary();

            while (current < tokens.length) {
                const [type, token] = tokens[current];
                if (type !== 'operator' || (token !== '*' && token !== '/')) {
                    break;
                }
                current++;
                const right = parseUnary();
                left = createNode(token, [left, right]);
            }

            return left;
        }

        // 解析一元运算符
        function parseUnary() {
            const [type, token] = tokens[current];
            
            // 处理负号
            if (type === 'operator' && token === '-') {
                current++;
                const operand = parseUnary();
                return createNode('-', [operand]);
            }

            return parsePostfix();
        }

        // 解析后缀运算符
        function parsePostfix() {
            let left = parsePrimary();

            while (current < tokens.length) {
                const [type, token] = tokens[current];
                if (type !== 'operator' || !OPERATORS[token] || 
                    OPERATORS[token].args !== 1 || 
                    OPERATORS[token].precedence !== 3) {
                    break;
                }
                current++;
                left = createNode(token, [left]);
            }

            return left;
        }

        // 解析基本表达式（数字、函数调用、括号）
        function parsePrimary() {
            const [type, token] = tokens[current];
            current++;

            if (type === 'number') {
                return createNode(token);
            }

            if (type === 'function') {
                const args = parseFunctionArgs();
                return createNode(token, args);
            }

            if (type === 'operator' && token === '(') {
                const expr = parseExpression();
                if (current >= tokens.length || 
                    tokens[current][0] !== 'operator' || 
                    tokens[current][1] !== ')') {
                    throw new Error('括号不匹配');
                }
                current++;  // 跳过右括号
                return expr;
            }

            throw new Error(`意外的token: ${token}`);
        }

        // 解析函数参数
        function parseFunctionArgs() {
            const args = [];
            
            // 检查左括号
            if (tokens[current][0] !== 'operator' || tokens[current][1] !== '(') {
                throw new Error('函数调用缺少左括号');
            }
            current++;  // 跳过左括号

            // 空参数列表
            if (tokens[current][0] === 'operator' && tokens[current][1] === ')') {
                current++;
                return args;
            }

            // 解析参数列表
            while (true) {
                args.push(parseExpression());

                if (tokens[current][0] === 'operator' && tokens[current][1] === ')') {
                    current++;
                    break;
                }

                if (tokens[current][0] !== 'separator' || tokens[current][1] !== ',') {
                    throw new Error('函数参数格式错误');
                }
                current++;  // 跳过逗号
            }

            return args;
        }

        // 开始解析
        const ast = parseExpression();
        if (current < tokens.length) {
            throw new Error('表达式解析未完成');
        }
        return ast;
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