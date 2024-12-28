import { OPERATORS, FUNCTIONS, CONSTANTS } from './operators.js';

const Calculator = (function() {
    // 1. 预处理模块 - 处理属性调用和运算符生成
    function preprocess(expr, operators, functions) {
        // 动态添加属性调用运算符
        for (const [name, func] of Object.entries(FUNCTIONS)) {
            if (func.asProperty) {
                operators.add('.' + name);
                OPERATORS['.' + name] = {
                    precedence: 3,
                    args: 1,
                    func: func.func,
                    position: 'postfix'
                };
            }
        }

        // 按长度降序排列运算符，确保先匹配较长的运算符
        const sortedOperators = new Set([...operators].sort((a, b) => b.length - a.length));

        return { expr, operators: sortedOperators };
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

        // 从 OPERATORS 中获取所有分隔符
        const delimiters = new Set(
            Object.entries(OPERATORS)
                .filter(([_, op]) => op.type === 'delimiter')
                .map(([key]) => key)
        );

        // 从 OPERATORS 中获取所有分隔符
        const separators = new Set(
            Object.entries(OPERATORS)
                .filter(([_, op]) => op.type === 'separator')
                .map(([key]) => key)
        );

        function isUnaryMinus() {
            // 负号的条件：
            // 1. 是表达式开始
            // 2. 前一个token是左括号
            // 3. 前一个token是运算符
            // 4. 前一个token是分隔符(逗号)
            return tokens.length === 0 || 
                   (tokens[tokens.length-1][0] === 'operator' && tokens[tokens.length-1][1] === '(') ||
                   (tokens[tokens.length-1][0] === 'operator' && tokens[tokens.length-1][1] !== ')') ||
                   tokens[tokens.length-1][0] === 'separator';
        }

        function collectString() {
            let str = '';
            
            while (i < expr.length) {
                const char = expr[i];
                const remainingExpr = expr.slice(i);
                
                // 检查是否是运算符
                let isOperator = false;
                for (const op of operators) {
                    if (remainingExpr.startsWith(op)) {
                        isOperator = true;
                        break;
                    }
                }
                if (isOperator) break;

                // 检查是否是分隔符或定界符
                if (delimiters.has(char) || separators.has(char)) break;

                str += char;
                i++;
            }
            return str;
        }

        function collectIdentifier() {
            let name = '';
            while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
                name += expr[i];
                i++;
            }
            return name;
        }

        while (i < expr.length) {
            const char = expr[i];

            // 检查运算符
            let foundOperator = false;
            for (const op of operators) {
                if (expr.startsWith(op, i)) {
                    // 特殊处理减号，区分一元负号和二元减号
                    if (op === '-') {
                        if (isUnaryMinus()) {
                            tokens.push(['operator', 'unary-']);  // 使用一元负号
                        } else {
                            tokens.push(['operator', '-']);       // 使用二元减号
                        }
                    } else {
                        tokens.push(['operator', op]);
                    }
                    i += op.length;
                    foundOperator = true;
                    break;
                }
            }
            if (foundOperator) continue;

            // 检查函数名
            if (/[a-zA-Z]/.test(char)) {
                const name = collectIdentifier();
                if (functions.has(name)) {
                    tokens.push(['function', name]);
                } else if (constants.has(name)) {
                    tokens.push(['constant', name]);
                } else {
                    // 不是函数或常量，作为普通字符串处理
                    tokens.push(['string', name]);
                }
                continue;
            }

            // 处理分隔符和定界符
            if (separators.has(char)) {
                tokens.push(['separator', char]);
            } else if (delimiters.has(char)) {
                tokens.push(['delimiter', char]);
            } else {
                // 其他所有情况都作为字符串处理
                const str = collectString();
                if (str) tokens.push(['string', str]);
                continue;
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
            return parseByPrecedence(1, depth + 1);  // 从最低优先级开始
        }

        // 按优先级解析
        function parseByPrecedence(precedence, depth = 0) {
            checkRecursionDepth(depth);
            
            // 如果是最高优先级，解析一元运算符
            if (precedence === 4) {
                return parseUnary(depth + 1);
            }

            let left = parseByPrecedence(precedence + 1, depth + 1);

            while (current < tokens.length) {
                const [type, token] = tokens[current];
                
                // 检查是否是当前优先级的中缀运算符
                if (type !== 'operator' || 
                    !OPERATORS[token] || 
                    OPERATORS[token].position !== 'infix' ||
                    OPERATORS[token].precedence !== precedence) {
                    break;
                }

                current++;
                const right = parseByPrecedence(
                    // 对于右结合运算符（如 **），使用同级递归
                    token === '**' ? precedence : precedence + 1, 
                    depth + 1
                );
                left = createNode(token, [left, right]);
            }

            return left;
        }

        function parseUnary(depth = 0) {
            checkRecursionDepth(depth);
            const [type, token] = tokens[current];
            
            // 处理前缀运算符
            if (type === 'operator' && 
                OPERATORS[token]?.position === 'prefix') {
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
                
                // 处理后缀运算符
                if (type !== 'operator' || 
                    !OPERATORS[token] || 
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

            // 处理字符串（包括数字）
            if (type === 'string') {
                return createNode(token);
            }

            // 处理常量
            if (type === 'constant') {
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

        // 处理字符串节点，尝试转换为数值
        if (node.type === 'string') {
            const str = node.value;
            
            // 处理大数
            if (str.includes('e') || str.includes('E')) {
                return parseFloat(str);
            }

            // 尝试转换为数值
            const num = parseFloat(str);
            if (!isNaN(num)) return num;

            // 如果无法转换为数值，保持字符串
            return str;
        }

        // 处理常量
        if (node.type === 'constant') {
            return CONSTANTS[node.value];
        }

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
            const { expr: processedExpr, operators: sortedOperators } = preprocess(expr, operators, functions);
            const tokens = tokenize(processedExpr, sortedOperators, functions, constants);
            const ast = buildAst(tokens, operators, functions);
            return evaluate(ast, operators, functions);
        },

        getASTNode(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const { expr: processedExpr, operators: sortedOperators } = preprocess(expr, operators, functions);
            const tokens = tokenize(processedExpr, sortedOperators, functions, constants);
            return buildAst(tokens, operators, functions);
        },

        generateAST(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const { expr: processedExpr, operators: sortedOperators } = preprocess(expr, operators, functions);
            const tokens = tokenize(processedExpr, sortedOperators, functions, constants);
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