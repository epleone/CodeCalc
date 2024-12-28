// 使用 IIFE 创建模块作用域
const Calculator = (function() {
    // 定义常量和类型（原来是从 operators.js 和 types.js 导入的）
    const OPERATORS = window.OPERATORS;
    const FUNCTIONS = window.FUNCTIONS;
    const CONSTANTS = window.CONSTANTS;
    const DELIMITERS = window.DELIMITERS;
    const SEPARATORS = window.SEPARATORS;
    const TYPE = window.TYPE;
    const Types = window.Types;

    // 添加变量字典
    const variables = new Map();
    // 添加字符串常量计数器
    let stringConstantCounter = 0;

    // 1. 预处理模块 - 处理属性调用和运算符生成
    function preprocess(expr, operators, functions) {
        // 检查括号匹配
        function checkParentheses(expr) {
            // 移除字符串字面量，避免干扰括号匹配检查
            const noStrings = expr.replace(/'[^']*'|"[^"]*"/g, '');
            
            // 检查括号是否匹配
            const stack = [];
            let maxDepth = 0;  // 记录最大嵌套深度
            
            for (let i = 0; i < noStrings.length; i++) {
                if (noStrings[i] === '(') {
                    stack.push(i);
                    maxDepth = Math.max(maxDepth, stack.length);
                    
                    // 检查嵌套深度是否过大
                    if (maxDepth > 100) {
                        throw new Error('括号嵌套深度过大');
                    }
                    
                    // 检查左括号后是否直接跟右括号
                    if (noStrings[i + 1] === ')') {
                        throw new Error(`空括号对，位置: ${i}`);
                    }
                } else if (noStrings[i] === ')') {
                    if (stack.length === 0) {
                        throw new Error(`多余的右括号，位置: ${i}`);
                    }
                    
                    // 获取对应的左括号位置
                    const openPos = stack.pop();
                    // 检查括号内的内容长度
                    if (i - openPos > 1000) {
                        throw new Error(`括号内容过长，开始位置: ${openPos}`);
                    }
                }
            }
            
            if (stack.length > 0) {
                const positions = stack.join(', ');
                throw new Error(`缺少右括号，对应左括号位置: ${positions}`);
            }
            
            // 检查括号前后的非法组合，修改规则以允许函数调用
            const invalidPatterns = [
                // 允许标识符后跟左括号（函数调用）
                { pattern: /\)[\w\d]/, message: '右括号后直接跟标识符' },
                { pattern: /\)\(/, message: '右括号后直接跟左括号' },
                { pattern: /,\s*\)/, message: '逗号后直接跟右括号' },
                { pattern: /\(\s*,/, message: '左括号后直接跟逗号' },
                // 检查连续的括号对（允许函数调用）
                { pattern: /\(\s*\)(?!\s*[.,)\]}])/, message: '独立的空括号对' }
            ];
            
            for (const {pattern, message} of invalidPatterns) {
                if (pattern.test(noStrings)) {
                    throw new Error(`括号使用错误: ${message}`);
                }
            }
        }

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

        // 先检查括号匹配
        checkParentheses(expr);

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
        let lastTokenType = null;  // 添加上一个 token 的类型记录

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
                    // 移除连续运算符的检查
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
                    lastTokenType = 'operator';
                    i += op.length;
                    foundOperator = true;
                    break;
                }
            }
            if (foundOperator) continue;

            // 检查分隔符和定界符
            if (separators.has(char)) {
                tokens.push(['separator', char]);
                lastTokenType = 'separator';
                i++;
            } else if (delimiters.has(char)) {
                tokens.push(['delimiter', char]);
                lastTokenType = 'delimiter';
                i++;
            } else {
                // 其他所有情况都作为字符串处理
                const str = collectString();
                if (str) {
                    if (functions.has(str)) {
                        tokens.push(['function', str]);
                        lastTokenType = 'function';
                    } else if (constants.has(str)) {
                        tokens.push(['constant', str]);
                        lastTokenType = 'constant';
                    } else {
                        tokens.push(['string', str]);
                        lastTokenType = 'string';
                    }
                }
            }
        }

        return tokens;
    }

    // 3. 语法分析模块
    function buildAst(tokens, operators, functions) {
        let current = 0;

        function createNode(value, args, type) {
            return { value, args, type };
        }

        function parsePrimary() {
            if (current >= tokens.length) {
                throw new Error('意外的表达式结束');
            }

            const [type, value] = tokens[current];
            current++;

            // 处理函数调用
            if (type === 'function') {
                if (current >= tokens.length || 
                    tokens[current][0] !== 'delimiter' || 
                    tokens[current][1] !== '(') {
                    throw new Error('函数调用缺少左括号');
                }
                current++; // 跳过左括号

                const args = [];
                while (current < tokens.length && 
                       (tokens[current][0] !== 'delimiter' || 
                        tokens[current][1] !== ')')) {
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
                    OPERATORS[value].precedence < precedence ||
                    OPERATORS[value].position !== 'infix') {
                    break;
                }

                current++;
                // 对于赋值运算符，使用右结合性
                const nextPrecedence = OPERATORS[value].isCompoundAssignment || value === '=' ?
                    OPERATORS[value].precedence :
                    OPERATORS[value].precedence + 1;
                    
                const right = parseExpression(nextPrecedence);
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
            if (variables.has(node.value)) {
                return variables.get(node.value);
            }
            return node.value;
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

            // 检查参数数量
            if (op.args !== undefined && args.length !== op.args) {
                throw new Error(`运算符 "${node.value}" 需要 ${op.args} 个参数，但得到了 ${args.length} 个`);
            }
            
            // 处理赋值运算符
            if (node.value === '=' || op.isCompoundAssignment) {
                const [left, right] = node.args;
                // 检查左侧是否为有效的变量名
                if (left.type !== 'string' || !isValidVariableName(left.value)) {
                    throw new Error('赋值运算符左侧必须是变量名');
                }
                
                // 计算右侧表达式
                const rightValue = evaluate(right, operators, functions);
                
                if (op.isCompoundAssignment) {
                    // 对于复合赋值，检查变量是否已定义
                    if (!variables.has(left.value)) {
                        throw new Error(`变量 "${left.value}" 未定义`);
                    }
                    
                    const oldValue = variables.get(left.value);
                    const result = op.func(oldValue, rightValue);
                    
                    // 更新变量的值
                    variables.set(left.value, result);
                    return result;
                } else {
                    // 普通赋值
                    variables.set(left.value, rightValue);
                    return rightValue;
                }
            }

            // 其他运算符的处理
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

            // 检查参数数量
            if (func.args !== undefined) {
                if (Array.isArray(func.args)) {
                    // 如果 args 是数组，表示可接受的参数数量范围
                    const [min, max] = func.args;
                    if (args.length < min || args.length > max) {
                        throw new Error(`函数 "${node.value}" 需要 ${min} 到 ${max} 个参数，但得到了 ${args.length} 个`);
                    }
                } else {
                    // 如果 args 是数字，表示固定的参数数量
                    if (args.length !== func.args) {
                        throw new Error(`函数 "${node.value}" 需要 ${func.args} 个参数，但得到了 ${args.length} 个`);
                    }
                }
            }
            
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

    // 添加到辅助函数部分
    function isValidVariableName(name) {
        // 检查是否是合法的变量名（字母或下划线开头，后面可以是字母、数字或下划线）
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && 
               !OPERATORS.hasOwnProperty(name) &&
               !FUNCTIONS.hasOwnProperty(name) &&
               !CONSTANTS.hasOwnProperty(name) &&
               !/^_cc__str_idx_/.test(name);  // 不能是内部字符串常量名
    }

    // 6. 返回公共API
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

        tokenize(expr, operators, functions, constants) {
            return tokenize(expr, operators, functions, constants);
        },

        preprocess(expr, operators, functions) {
            return preprocess(expr, operators, functions);
        },

        // 添加获取所有变量的方法
        getAllVariables() {
            return Object.fromEntries(variables);
        },

        // 添加清除所有内容（包括字符串常量）的方法
        clearAllCache() {
            variables.clear();
            stringConstantCounter = 0;
        }
    };
})();

// 如果在 Node.js 环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
} 