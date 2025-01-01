/**
 * 代码说明需要遵守的标准：
 * 1. 所有配置都必须在配置文件中定义和读取，包括运算符、函数、常量、分隔符、定界符
 * 2. operators, functions, constants可能会修改，需要统一读取并使用参数传递，
 * 函数内部不需要单独从外部读取
 * 3. 防止卡死，最大遍历深度限制为100
 */

// 使用 IIFE 创建模块作用域
const Calculator = (function() {
    // 定义常量和类型
    const MAX_DEPTH = 100;  // 添加全局最大深度常量
    const OPERATORS = window.OPERATORS;
    const FUNCTIONS = window.FUNCTIONS;
    const CONSTANTS = window.CONSTANTS;
    const DELIMITERS = window.DELIMITERS;
    const SEPARATORS = window.SEPARATORS;
    const TYPE = window.TYPE;
    const Types = window.Types;

    // 添加变量字典
    const variables = new Map();
    
    // 添加警告和提示信息收集器
    const warnings = [];
    const infos = [];

    // 添加信息收集方法
    function addWarning(message) {
        if (!warnings.includes(message)) {  // 检查是否已存在相同消息
            warnings.push(message);
        }
    }

    function addInfo(message) {
        if (!infos.includes(message)) {  // 检查是否已存在相同消息
            infos.push(message);
        }
    }

    function clearMessages() {
        warnings.length = 0;
        infos.length = 0;
    }

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
                    if (maxDepth > MAX_DEPTH) {
                        throw new Error('括号嵌套深度过大');
                    }
                    
                    // 检查左括号后是否直接跟右括号
                    // 无参函数，这个是允许的
                    // if (noStrings[i + 1] === ')') {
                    //     throw new Error(`空括号对，位置: ${i}`);
                    // }

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
                
                // 修改检查的前缀
                if (varName.startsWith('_ccstr_i')) {
                    throw new Error(`变量名不能以 "_ccstr_i" 开头，这是系统保留的前缀`);
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
            // 将计数器移到函数内部
            let stringConstantCounter = 0;
            
            // 匹配字符串字面量的正则表达式
            const stringLiteralRegex = /(['"])((?:\\.|[^\\])*?)\1/g;
            
            // 替换所有字符串字面量为字符串常量标识符
            const processed = expr.replace(stringLiteralRegex, (match, quote, content) => {
                // 修改生成的标识符前缀
                const constName = `_ccstr_i${stringConstantCounter++}`;
                
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

        // 先处理字符串字面量
        expr = processStringLiterals(expr);

        // 再检查括号匹配
        checkParentheses(expr);

        // 最后检查变量名
        expr = checkVariableName(expr);

        // 动态添加属性调用运算符
        for (const [name, func] of Object.entries(FUNCTIONS)) {
            if (func.asProperty) {
                operators.add('.' + name);
                OPERATORS['.' + name] = {
                    precedence: 3,
                    args: 1,
                    func: func.func,
                    position: 'postfix',
                    ...(func.acceptAny && { acceptAny: true }),
                    ...(func.preventSelfReference && { preventSelfReference: func.preventSelfReference })
                };
            }
        }

        // 按长度降序排列运算符，确保先匹配较长的运算符
        const sortedOperators = new Set([...operators].sort((a, b) => b.length - a.length));

        return { expr, operators: sortedOperators };
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

                // 如果当前积累的字符串可能是特殊形式的开始（如 0x），继续收集
                if (str === '0' && (char === 'x' || char === 'b' || char === 'o')) {
                    str += char;
                    i++;
                    continue;
                }

                // 检查是否是操作符
                for (const op of sortedOperators) {
                    // 只有当当前字符串不是任何函数或常量的前缀时，才考虑运算符
                    const isPrefix = [...functions, ...constants].some(name => 
                        name.startsWith(str + char));
                    
                    if (!isPrefix && remainingExpr.startsWith(op)) {
                        shouldBreak = true;
                        break;
                    }
                }

                // 检查是否是分隔符或定界符
                if (delimiters.has(char) || separators.has(char)) {
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
                    // 如果是赋值运算符，将前一个字符串token改为identifier类型
                    if (op === '=' || OPERATORS[op].isCompoundAssignment) {
                        if (tokens.length > 0 && tokens[tokens.length - 1][0] === 'string') {
                            tokens[tokens.length - 1][0] = 'identifier';
                        }
                    }
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
                            // 检查是否有别名
                            if (OPERATORS[op] && OPERATORS[op].alias) {
                                tokens.push(['operator', OPERATORS[op].alias]);
                            } else {
                                tokens.push(['operator', op]);
                            }
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
                        // 检查函数是否有别名
                        if (FUNCTIONS[str] && FUNCTIONS[str].alias) {
                            tokens.push(['function', FUNCTIONS[str].alias]);
                        } else {
                            tokens.push(['function', str]);
                        }
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

        // 在返回tokens之前添加后处理
        function postProcessTokens(tokens) {
            // 检查是否存在变量x
            const hasXVariable = tokens.some(token => 
                (token[0] === 'identifier' || token[0] === 'string') && 
                token[1] === 'x'
            );

            if (!hasXVariable && !variables.has('x')) {
                // 如果没有x变量，处理所有的字符串token
                for (let i = 0; i < tokens.length; i++) {
                    if (tokens[i][0] === 'string') {
                        // 跳过16进制数的处理
                        if (tokens[i][1].startsWith('0x')) {
                            continue;
                        }

                        // 检查是否是变量名,如果是则跳过处理
                        if (variables.has(tokens[i][1])) {
                            continue;
                        }
                        
                        const parts = tokens[i][1].split('x');
                        if (parts.length > 1) {
                            // 重构tokens数组
                            const newTokens = [];
                            for (let j = 0; j < parts.length; j++) {
                                if (parts[j]) {
                                    newTokens.push(['string', parts[j]]);
                                }
                                if (j < parts.length - 1) {
                                    newTokens.push(['operator', '*']);
                                    addWarning('使用x作为乘法符号');
                                }
                            }
                            // 替换原来的token
                            tokens.splice(i, 1, ...newTokens);
                            i += newTokens.length - 1; // 调整索引
                        }
                    }
                }
            }
            return tokens;
        }

        const processedTokens = postProcessTokens(tokens);
        return processedTokens;
    }

    // 3. 语法分析模块
    function buildAst(tokens, operators, functions) {
        let current = 0;
        let depth = 0;
        
        // 添加token统计
        const validTokenCount = tokens.filter(token => {
            const [type] = token;
            return type !== 'delimiter' && type !== 'separator';
        }).length;

        // 添加节点计数器
        let nodeCount = 0;

        function checkDepth() {
            if (depth > MAX_DEPTH) {
                throw new Error('表达式嵌套深度过大，可能存在无限递归');
            }
        }

        function createNode(value, args, type) {
            nodeCount++;  // 每创建一个节点就计数
            return { value, args, type };
        }

        function parsePrimary() {
            if (current >= tokens.length) {
                throw new Error('意外的表达式结束');
            }

            const [type, value] = tokens[current];
            current++;

            // 根据不同类型创建相应的节点
            switch(type) {
                case 'function':
                    // 处理函数调用
                    return parseFunctionCall(value);
                
                case 'constant':
                case 'identifier':
                case 'string':
                    // 这些都是叶子节点
                    return createNode(value, [], type);
                    
                case 'delimiter':
                    if (value === '(') {
                        const expr = parseExpression(0);
                        expectDelimiter(')');
                        return expr;
                    }
                    throw new Error(`意外的定界符: ${value}`);
                    
                default:
                    throw new Error(`意外的token类型: ${type}`);
            }
        }

        function parseFunctionCall(funcName) {
            expectDelimiter('(');
            const args = [];
            
            while (current < tokens.length) {
                if (tokens[current][0] === 'delimiter' && 
                    tokens[current][1] === ')') {
                    break;
                }
                
                args.push(parseExpression(0));
                
                if (tokens[current][0] === 'separator') {
                    current++;
                }
            }
            
            expectDelimiter(')');
            return createNode(funcName, args, 'function');
        }

        function expectDelimiter(expected) {
            if (current >= tokens.length || 
                tokens[current][0] !== 'delimiter' || 
                tokens[current][1] !== expected) {
                throw new Error(`期望定界符 "${expected}"`);
            }
            current++;
        }

        function parseUnary() {
            depth++;
            checkDepth();

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

            depth--;
        }

        function parseExpression(precedence = 0) {
            depth++;
            checkDepth();

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

            depth--;
            return left;
        }

        const ast = parseExpression();

        // 检查节点数量是否合理
        if (nodeCount < validTokenCount) {
            throw new Error(`解析错误：AST节点不全(${nodeCount} < ${validTokenCount})`);
        }

        // 添加防止函数和运算符自引用的检查
        function checkASTForSelfApplication(ast) {
            if (ast.type === 'function') {
                const funcName = ast.value;
                // 检查设置了 preventSelfReference 的函数
                if (FUNCTIONS[funcName] && FUNCTIONS[funcName].preventSelfReference) {
                    // 只检查直接参数
                    if (ast.args.some(arg => arg.type === 'function' && arg.value === funcName)) {
                        throw new Error(`函数 ${funcName} 不能直接作用在自己身上`);
                    }
                }
            } else if (ast.type === 'operator') {
                const opName = ast.value;
                // 检查设置了 preventSelfReference 的运算符
                if (OPERATORS[opName] && OPERATORS[opName].preventSelfReference) {
                    // 只检查直接参数
                    if (ast.args.some(arg => arg.type === 'operator' && arg.value === opName)) {
                        throw new Error(`运算符 ${opName} 不能直接作用在自己身上`);
                    }
                }
            }
            // 继续检查子节点
            ast.args?.forEach(checkASTForSelfApplication);
        }

        // 执行自引用检查
        checkASTForSelfApplication(ast);

        return ast;
    }

    // 在 evaluate 函数之前添加参数转换函数
    function convertArguments(args, acceptAny, nodeArgs, context) {
        const { name, type } = context;
        if (!acceptAny) {
            return args.map(arg => Types.toNumber(arg));
        }
        return args;
    }

    // 4. 求值模块
    function evaluate(node, operators, functions, depth = 0) {
        if (depth > MAX_DEPTH) {
            throw new Error('表达式求值嵌套深度过大，可能存在无限递归');
        }

        if (!node) return 0;

        // 处理字符串节点 - 可能是变量名
        if (node.type === 'string') {
            if (variables.has(node.value)) {
                return variables.get(node.value);
            }
            // 如果不是变量，则转换为数字
            return Types.toNumber(node.value);

            // return node.value;
        }

        // 处理标识符节点 - 赋值表达式左侧的变量名
        if (node.type === 'identifier') {
            // 这里该不该报提醒？
            if (variables.has(node.value)) {
                return variables.get(node.value);
            }
            return node.value;  // 不转换为数字
        }
                

        // 处理常量
        if (node.type === 'constant') {
            return CONSTANTS[node.value];
        }

        // 递归计算参数
        const args = node.args.map(arg => evaluate(arg, operators, functions, depth + 1));

        // 处理运算符
        if (node.type === 'operator') {
            const op = OPERATORS[node.value];

            // 检查参数数量
            if (op.args !== undefined && args.length !== op.args) {
                throw new Error(`运算符 "${node.value}" 需要 ${op.args} 个参数，但得到了 ${args.length} 个`);
            }
            
            // 处理赋值运算符
            if (node.value === '=' || op.isCompoundAssignment) {
                const [left, right] = node.args;
                // 检查左侧是否为标识符类型的节点
                if (left.type !== 'identifier' && left.type !== 'string') {
                    throw new Error('赋值运算符左侧必须是变量名');
                }

                // 检查左侧是否是合法的变量名
                if (!isValidVariableName(left.value)) {
                    throw new Error(`"${left.value}" 不是合法的变量名`);
                }
                
                // 计算右侧表达式
                const rightValue = evaluate(right, operators, functions, depth + 1);
                
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
                    addInfo(`添加变量 ${left.value}: ${rightValue}`)

                    // 检查是否是x变量，提示无法使用x做为乘法
                    if (left.value === 'x') {
                        addWarning(`将无法使用x做为乘法符号`)
                    }
                    return rightValue;
                }
            }

            // 其他运算符的处理
            const convertedArgs = convertArguments(args, op.acceptAny, node.args, {
                name: node.value,
                type: '运算符'
            });
            
            return op.func(...convertedArgs);
        }

        // 处理函数
        if (node.type === 'function') {
            const func = FUNCTIONS[node.value];

            // 检查参数数量
            if (func.args !== undefined) {
                if (func.args === -1) {
                    // 不限制参数数量的情况
                    if (args.length === 0) {
                        throw new Error(`函数 "${node.value}" 至少需要1个参数`);
                    }
                } else {
                    // 处理固定参数数量
                    if (args.length !== func.args) {
                        throw new Error(`函数 "${node.value}" 需要 ${func.args} 个参数，但得到了 ${args.length} 个`);
                    }
                }
            }
            
            // 检查并转换参数
            const convertedArgs = convertArguments(args, func.acceptAny, node.args, {
                name: node.value,
                type: '函数'
            });
            
            return func.func(...convertedArgs);
        }

        throw new Error(`未处理的节点类型: ${node.type}`);
    }

    // 5. 辅助函数
    // 添加到辅助函数部分
    function isValidVariableName(name) {
        // 检查是否是合法的变量名（字母或下划线开头，后面可以是字母、数字或下划线）
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && 
               !OPERATORS.hasOwnProperty(name) &&
               !FUNCTIONS.hasOwnProperty(name) &&
               !CONSTANTS.hasOwnProperty(name) &&
               !/^_ccstr_i/.test(name);  // 修改检查的前缀
    }

    // 6. 返回公共API
    return {
        calculate(expr) {
            clearMessages(); // 清除之前的消息

            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const { expr: processedExpr, operators: sortedOperators } = preprocess(expr, operators, functions);
            const tokens = tokenize(processedExpr, sortedOperators, functions, constants);
            const ast = buildAst(tokens, operators, functions);
            const result = evaluate(ast, operators, functions);
            return { 
                value: result,
                info: infos.length > 0 ? infos : null, 
                warning: warnings.length > 0 ? warnings : null
            };
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

        // 修改清除方法，同时清除变量和消息
        clearAllCache() {
            variables.clear();  // 清除所有变量
            clearMessages();    // 清除所有消息
        }
    };
})();

// 如果在 Node.js 环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
} 