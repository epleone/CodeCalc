import { OPERATORS, FUNCTIONS, CONSTANTS, DELIMITERS, SEPARATORS } from './operators.js';
import { TYPE, Types } from './types.js';

const Calculator = (function() {
    // 添加变量字典
    const variables = new Map();
    // 添加字符串常量计数器
    let stringConstantCounter = 0;

    // 1. 预处理模块 - 处理属性调用和运算符生成
    function preprocess(expr, operators, functions) {
        // 检查变量名是否合法
        function checkVariableName(expr) {
            // 匹配可能的赋值表达式
            const assignmentRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
            let match;
            
            while ((match = assignmentRegex.exec(expr)) !== null) {
                const varName = match[1];
                
                // 检查是否以保留的字符串常量前缀开头
                if (varName.startsWith('_cc__str_idx_')) {
                    throw new Error(`变量名不能以 "_cc__str_idx_" 开头，这是系统保留的前缀`);
                }
                
                // 检查是否与运算符冲突
                if (OPERATORS.hasOwnProperty(varName)) {
                    throw new Error(`变量名 "${varName}" 与运算符冲突`);
                }
                
                // 检查是否与函数名冲突
                if (FUNCTIONS.hasOwnProperty(varName)) {
                    throw new Error(`变量名 "${varName}" 与函数名冲突`);
                }
                
                // 检查是否与常量冲突
                if (CONSTANTS.hasOwnProperty(varName)) {
                    throw new Error(`变量名 "${varName}" 与常量冲突`);
                }
                
                // 检查是否是保留字
                const reservedWords = ['if', 'else', 'true', 'false', 'null', 'undefined'];
                if (reservedWords.includes(varName)) {
                    throw new Error(`变量名 "${varName}" 是保留字`);
                }
            }
            
            return expr;
        }

        // 处理字符串字面量
        function processStringLiterals(expr) {
            // 重置字符串常量计数器
            stringConstantCounter = 0;
            
            // 匹配字符串字面量的正则表达式
            const stringLiteralRegex = /(['"])((?:\\.|[^\\])*?)\1/g;
            
            // 替换所有字符串字面量为字符串常量标识符
            const processed = expr.replace(stringLiteralRegex, (match, quote, content) => {
                // 生成唯一的字符串常量标识符
                const constName = `_cc__str_idx_${stringConstantCounter++}`;
                
                // 将字符串内容保存到变量字典中
                // 处理转义字符
                const processedContent = content.replace(/\\(['"\\])/g, '$1');
                variables.set(constName, processedContent);
                
                return constName;
            });

            // 检查是否有未闭合的字符串
            const unclosedQuoteRegex = /(['"])[^'"]*$/;
            if (unclosedQuoteRegex.test(processed)) {
                throw new Error('未闭合的字符串字面量');
            }

            return processed;
        }

        // 检查变量名
        expr = checkVariableName(expr);
        
        // 处理字符串字面量
        expr = processStringLiterals(expr);

        // 动态添加属性调用运算符
        for (const [name, func] of Object.entries(FUNCTIONS)) {
            if (func.asProperty) {
                operators.add('.' + name);
                OPERATORS['.' + name] = {
                    precedence: 3,
                    args: 1,
                    func: func.func,
                    position: 'postfix',
                    types: func.types
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

        // 使用新的 DELIMITERS 和 SEPARATORS
        const delimiters = new Set(Object.keys(DELIMITERS));
        const separators = new Set(Object.keys(SEPARATORS));

        const sortedOperators = [...operators].sort((a, b) => b.length - a.length);

        function shouldBeUnaryMinus() {
            if (tokens.length === 0) return true;
            
            const lastToken = tokens[tokens.length - 1];
            const [type, value] = lastToken;
            
            // 如果前一个 token 是数字、常量或右括号，那就是减号
            if (type === 'string' || 
                type === 'constant' || 
                (type === 'delimiter' && value === ')')) {
                return false;
            }
            
            // 如果前一个 token 是左括号、分隔符，那就是负号
            if ((type === 'delimiter' && value === '(') ||
                type === 'separator') {
                return true;
            }

            // 如果前一个 token 是运算符，那就是负号
            if (type === 'operator') {
                return true;
            }

            return false; // 其他情况默认为减号
        }

        function collectString() {
            let str = '';
            while (i < expr.length) {
                const char = expr[i];
                const remainingExpr = expr.slice(i);

                // 检查是否是操作符、函数名或常量
                let shouldBreak = false;

                // 检查是否是操作符
                for (const op of sortedOperators) {
                    if (remainingExpr.startsWith(op)) {
                        shouldBreak = true;
                        break;
                    }
                }

                // 检查是否是分隔符或定界符
                if (delimiters.has(char) || separators.has(char)) {
                    shouldBreak = true;
                }

                // 如果当前积累的字符串是一个函数名或常量，并且遇到了左括号，就应该停止
                if (str && (functions.has(str) || constants.has(str)) && char === '(') {
                    shouldBreak = true;
                }

                if (shouldBreak) break;

                str += char;
                i++;
            }
            return str;
        }

        while (i < expr.length) {
            const char = expr[i];
            const remainingExpr = expr.slice(i);

            // 检查操作符
            let foundOperator = false;
            for (const op of sortedOperators) {
                if (remainingExpr.startsWith(op)) {
                    if (op === '-') {
                        // 特殊处理减号
                        if (shouldBeUnaryMinus()) {
                            tokens.push(['operator', 'unary-']);
                        } else {
                            tokens.push(['operator', '-']);
                        }
                    } else {
                        // 其他操作符的处理
                        if (separators.has(op)) {
                            tokens.push(['separator', op]);
                        } else if (delimiters.has(op)) {
                            tokens.push(['delimiter', op]);
                        } else {
                            tokens.push(['operator', op]);
                        }
                    }
                    i += op.length;
                    foundOperator = true;
                    break;
                }
            }
            if (foundOperator) continue;

            // 检查分隔符和定界符
            if (separators.has(char)) {
                tokens.push(['separator', char]);
                i++;
            } else if (delimiters.has(char)) {
                tokens.push(['delimiter', char]);
                i++;
            } else {
                // 其他所有情况都作为字符串处理
                const str = collectString();
                if (str) {
                    if (functions.has(str)) {
                        tokens.push(['function', str]);
                    } else if (constants.has(str)) {
                        tokens.push(['constant', str]);
                    } else {
                        tokens.push(['string', str]);
                    }
                }
            }
        }

        return tokens;
    }

    // 3. 语法分析模块
    function buildAst(tokens, operators, functions) {
        let current = 0;

        function createNode(value, args = [], type = null) {
            // 如果指定了类型，直接使用
            if (type) {
                return { type, value, args };
            }
            
            // 根据 token 类型创建节点
            if (operators.has(value)) {
                return { type: 'operator', value, args };
            } else if (functions.has(value)) {
                return { type: 'function', value, args };
            } else if (CONSTANTS.hasOwnProperty(value)) {
                return { type: 'constant', value, args };
            } else {
                return { type: 'string', value, args };
            }
        }

        function parsePrimary() {
            if (current >= tokens.length) {
                throw new Error('意外的表达式结束');
            }

            const [type, value] = tokens[current];
            current++;

            // 处理函数调用
            if (type === 'function') {
                // 检查是否有左括号
                if (current < tokens.length && 
                    tokens[current][0] === 'delimiter' && 
                    tokens[current][1] === '(') {
                    current++; // 跳过左括号
                    const args = [];
                    
                    // 收集函数参数
                    while (current < tokens.length && 
                           !(tokens[current][0] === 'delimiter' && 
                             tokens[current][1] === ')')) {
                        args.push(parseExpression(0));
                        if (tokens[current][0] === 'separator') {
                            current++; // 跳过逗号
                        }
                    }
                    
                    if (current >= tokens.length) {
                        throw new Error('缺少右括号');
                    }
                    current++; // 跳过右括号
                    
                    return createNode(value, args, 'function');
                }
            }

            // 处理括号表达式
            if (type === 'delimiter' && value === '(') {
                const expr = parseExpression(0);
                if (current >= tokens.length || 
                    tokens[current][0] !== 'delimiter' || 
                    tokens[current][1] !== ')') {
                    throw new Error('缺少右括号');
                }
                current++; // 跳过右括号
                return expr;
            }

            // 处理其他基本类型
            return createNode(value, [], type);
        }

        function parseUnary() {
            if (current >= tokens.length) {
                throw new Error('意外的表达式结束');
            }

            const [type, value] = tokens[current];
            // 处理所有前缀运算符
            if (type === 'operator' && 
                OPERATORS[value] && 
                OPERATORS[value].position === 'prefix') {
                current++;
                const operand = parseUnary();  // 递归处理后续前缀运算符
                return createNode(value, [operand], 'operator');
            }
            return parsePrimary();
        }

        function parseExpression(precedence = 0) {
            let left = parseUnary();

            while (current < tokens.length) {
                const [type, value] = tokens[current];
                
                // 处理后缀运算符
                if (type === 'operator' && 
                    OPERATORS[value] && 
                    OPERATORS[value].position === 'postfix') {
                    current++;
                    left = createNode(value, [left], 'operator');
                    continue;
                }
                
                // 处理中缀运算符
                if (type !== 'operator' || 
                    !OPERATORS[value] || 
                    OPERATORS[value].precedence <= precedence ||
                    OPERATORS[value].position !== 'infix') {
                    break;
                }

                current++;
                const right = parseExpression(OPERATORS[value].precedence);
                left = createNode(value, [left, right], 'operator');
            }

            return left;
        }

        return parseExpression();
    }

    // 4. 求值模块
    function evaluate(node, operators, functions) {
        console.log('开始计算节点:', node);

        if (!node) return 0;

        // 处理字符串节点 - 可能是变量名
        if (node.type === 'string') {
            console.log('处理字符串节点:', node.value);
            // 如果是变量名，返回变量值
            if (variables.has(node.value)) {
                return variables.get(node.value);
            }
            return node.value;  // 否则保持字符串形式
        }

        // 处理常量
        if (node.type === 'constant') {
            console.log('处理常量节点:', node.value, '=', CONSTANTS[node.value]);
            return CONSTANTS[node.value];
        }

        // 递归计算参数
        console.log('计算参数:', node.args);
        const args = node.args.map(arg => evaluate(arg, operators, functions));
        console.log('参数计算结果:', args);

        // 处理运算符
        if (node.type === 'operator') {
            const op = OPERATORS[node.value];
            console.log('处理运算符:', node.value, '类型定义:', op.types);
            
            // 特殊处理赋值运算符
            if (node.value === '=') {
                const [left, right] = node.args;
                if (left.type !== 'string') {
                    throw new Error('赋值运算符左侧必须是变量名');
                }
                const value = evaluate(right, operators, functions);
                variables.set(left.value, value);
                return value;
            }

            // 根据运算符定义的类型要求转换参数
            const convertedArgs = args.map((arg, index) => {
                if (op.types && op.types[index] === TYPE.NUMBER) {
                    const converted = Types.toNumber(arg);
                    console.log(`参数 ${index} 转换:`, arg, '->', converted);
                    return converted;
                }
                return arg;
            });
            
            const result = op.func(...convertedArgs);
            console.log('运算结果:', result);
            return result;
        }

        // 处理函数
        if (node.type === 'function') {
            const func = FUNCTIONS[node.value];
            console.log('处理函数:', node.value, '类型定义:', func.types);
            
            // 根据函数定义的类型要求转换参数
            const convertedArgs = args.map((arg, index) => {
                if (func.types && func.types[index] === TYPE.NUMBER) {
                    const converted = Types.toNumber(arg);
                    console.log(`参数 ${index} 转换:`, arg, '->', converted);
                    return converted;
                }
                return arg;
            });
            
            // 特殊处理 max 和 min 函数
            let result;
            if (node.value === 'max' || node.value === 'min') {
                result = args.length === 1 ? func.func(convertedArgs) : func.func(...convertedArgs);
            } else {
                result = func.func(...convertedArgs);
            }
            
            console.log('函数计算结果:', result);
            return result;
        }

        console.error('未知节点类型:', node);
        throw new Error(`未知的节点类型: ${node.type}`);
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
        },

        tokenize(expr, operators, functions, constants) {
            return tokenize(expr, operators, functions, constants);
        },

        preprocess(expr, operators, functions) {
            return preprocess(expr, operators, functions);
        },

        // 添加获取变量值的方法
        getVariable(name) {
            return variables.get(name);
        },

        // 添加设置变量值的方法
        setVariable(name, value) {
            variables.set(name, value);
            return value;
        },

        // 添加清除所有变量的方法
        clearVariables() {
            // 只清除非字符串常量的变量
            for (const [key] of variables) {
                if (!key.startsWith('_cc__str_idx_')) {
                    variables.delete(key);
                }
            }
        },

        // 添加获取所有变量的方法
        getAllVariables() {
            return Object.fromEntries(variables);
        },

        // 添加清除所有内容（包括字符串常量）的方法
        clearAll() {
            variables.clear();
            stringConstantCounter = 0;
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