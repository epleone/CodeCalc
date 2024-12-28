import { OPERATORS, FUNCTIONS, CONSTANTS } from './operators.js';

const Calculator = (function() {
    // 1. 预处理模块 - 处理属性调用和运算符生成
    function preprocess(expr, operators, functions) {
        // 动态添加属性调用运算符
        for (const [name, func] of Object.entries(FUNCTIONS)) {
            if (func.asProperty) {
                // 添加对应的后缀运算符
                operators.add('.' + name);
                OPERATORS['.' + name] = {
                    precedence: 3,  // 与其他后缀运算符同级
                    args: 1,
                    func: func.func,
                    position: 'postfix'
                };
            }
        }

        return expr;  // 不需要修改表达式，直接返回
    }

    // 预处理辅助函数
    function collectFunctionName(expr, start) {
        let funcName = '';
        let i = start;
        while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
            funcName += expr[i];
            i++;
        }
        return { funcName, length: i - start };
    }

    function collectPrecedingExpr(expr, start) {
        let depth = 0;
        let i = start;

        // 跳过空白字符
        while (i >= 0 && /\s/.test(expr[i])) i--;

        if (i >= 0) {
            if (expr[i] === ')') {
                depth = 1;
                i--;
                while (i >= 0 && depth > 0) {
                    if (expr[i] === '(') depth--;
                    if (expr[i] === ')') depth++;
                    i--;
                }
                while (i >= 0 && /[a-zA-Z0-9]/.test(expr[i])) i--;
            } else {
                while (i >= 0 && /[a-zA-Z0-9]/.test(expr[i])) i--;
            }
        }

        return {
            start: i,
            expr1: expr.slice(0, i + 1),
            expr2: expr.slice(i + 1, start + 1)
        };
    }

    // 2. 词法分析模块
    function tokenize(expr, operators, functions, constants) {
        const tokens = [];
        let i = 0;
        expr = expr.replace(/\s/g, '');

        function collectNumber() {
            let num = '';
            let hasDecimal = false;
            
            while (i < expr.length) {
                // 处理小数点
                if (expr[i] === '.') {
                    // 如果后面跟着字母，说明是属性调用
                    if (i + 1 < expr.length && /[a-zA-Z]/.test(expr[i + 1])) {
                        break;
                    }
                    // 如果已经有小数点了，就停止
                    if (hasDecimal) {
                        break;
                    }
                    hasDecimal = true;
                    num += expr[i];
                    i++;
                    continue;
                }
                
                // 处理数字
                if (/\d/.test(expr[i])) {
                    num += expr[i];
                    i++;
                } else {
                    break;
                }
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

            // 处理属性调用
            if (char === '.') {
                let j = i + 1;
                let funcName = '';
                while (j < expr.length && /[a-zA-Z]/.test(expr[j])) {
                    funcName += expr[j];
                    j++;
                }
                if (operators.has('.' + funcName)) {
                    tokens.push(['operator', '.' + funcName]);
                    i = j;
                    continue;
                }
            }

            if (char === '-' && isStartOfNumber(tokens)) {
                i++;
                tokens.push(['number', parseFloat('-' + collectNumber())]);
                continue;
            }

            if (/\d/.test(char)) {
                tokens.push(['number', parseFloat(collectNumber())]);
                continue;
            }

            if (/[a-zA-Z]/.test(char)) {
                const name = collectIdentifier();
                if (functions.has(name)) {
                    tokens.push(['function', name]);
                } else if (constants.has(name)) {
                    tokens.push(['number', CONSTANTS[name]]);
                }
                continue;
            }

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

    // 3. 语法分析模块
    function buildAst(tokens, operators, functions) {
        let current = 0;
        const maxDepth = 100;

        function createNode(value, args = []) {
            return { value, args };
        }

        function checkRecursionDepth(depth) {
            if (depth > maxDepth) {
                throw new Error('表达式过于复杂或可能存在无限递归');
            }
        }

        function parseExpression(depth = 0) {
            checkRecursionDepth(depth);
            return parseAdditive(depth + 1);
        }

        function parseAdditive(depth = 0) {
            checkRecursionDepth(depth);
            let left = parseMultiplicative(depth + 1);

            while (current < tokens.length) {
                const [type, token] = tokens[current];
                if (type !== 'operator' || (token !== '+' && token !== '-')) {
                    break;
                }
                current++;
                const right = parseMultiplicative(depth + 1);
                left = createNode(token, [left, right]);
            }

            return left;
        }

        function parseMultiplicative(depth = 0) {
            checkRecursionDepth(depth);
            let left = parseUnary(depth + 1);

            while (current < tokens.length) {
                const [type, token] = tokens[current];
                if (type !== 'operator' || (token !== '*' && token !== '/')) {
                    break;
                }
                current++;
                const right = parseUnary(depth + 1);
                left = createNode(token, [left, right]);
            }

            return left;
        }

        function parseUnary(depth = 0) {
            checkRecursionDepth(depth);
            const [type, token] = tokens[current];
            
            if (type === 'operator' && OPERATORS[token] && 
                OPERATORS[token].position === 'prefix') {
                current++;
                const operand = parseUnary(depth + 1);
                return createNode(token, [operand]);
            }

            return parsePostfix(depth + 1);
        }

        function parsePostfix(depth = 0) {
            checkRecursionDepth(depth);
            let left = parsePrimary(depth + 1);

            while (current < tokens.length) {
                const [type, token] = tokens[current];
                if (type !== 'operator' || !OPERATORS[token] || 
                    OPERATORS[token].position !== 'postfix') {
                    break;
                }
                current++;
                left = createNode(token, [left]);
            }

            return left;
        }

        function parsePrimary(depth = 0) {
            checkRecursionDepth(depth);
            const [type, token] = tokens[current];
            current++;

            if (type === 'number') {
                return createNode(token);
            }

            if (type === 'function') {
                const args = parseFunctionArgs(depth + 1);
                return createNode(token, args);
            }

            if (type === 'operator' && token === '(') {
                const expr = parseExpression(depth + 1);
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

        function parseFunctionArgs(depth = 0) {
            checkRecursionDepth(depth);
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
                args.push(parseExpression(depth + 1));

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
        const ast = parseExpression(0);
        if (current < tokens.length) {
            throw new Error('表达式解析未完成');
        }
        return ast;
    }

    // 4. 求值模块
    function evaluate(node, operators, functions) {
        if (!node) return 0;
        if (typeof node.value === 'number') return node.value;

        const args = node.args.map(arg => evaluate(arg, operators, functions));

        if (operators.has(node.value)) {
            return OPERATORS[node.value].func(...args);
        }

        if (functions.has(node.value)) {
            const func = FUNCTIONS[node.value].func;
            return node.value === 'max' || node.value === 'min' ?
                args.length === 1 ? func(args) : func(...args) :
                func(...args);
        }

        throw new Error(`未知的操作符或函数: ${node.value}`);
    }

    // 5. 辅助函数
    function isStartOfNumber(tokens) {
        return !tokens.length || 
            (tokens[tokens.length-1][0] === 'operator' && 
             tokens[tokens.length-1][1] === '(') ||
            (tokens[tokens.length-1][0] === 'separator');
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

    // 6. 公共API
    return {
        calculate(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            // 预处理时动态添加运算符
            expr = preprocess(expr, operators, functions);
            const tokens = tokenize(expr, operators, functions, constants);
            const ast = buildAst(tokens, operators, functions);
            return evaluate(ast, operators, functions);
        },

        getASTNode(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            expr = preprocess(expr, operators, functions);
            const tokens = tokenize(expr, operators, functions, constants);
            return buildAst(tokens, operators, functions);
        },

        generateAST(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            expr = preprocess(expr, operators, functions);
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