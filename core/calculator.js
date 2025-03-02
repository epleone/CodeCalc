import { 
    OPERATORS,
    FUNCTIONS,
    CONSTANTS,
    DELIMITERS,
    SEPARATORS 
} from './operators.js';

import { 
    ccVariables,
    normalizeSymbols,
    checkParentheses,
    checkVariableName,
    processStringLiterals,
    processDate,
    processTimestamp,
    processMatrix
} from './preprocessUtils.js';

import { Utils } from './utils.js';
import { config } from './cfg.js';
/**
 * 代码标准：
 * 1. 所有配置都必须在配置文件中定义和读取，包括运算符、函数、常量、分隔符、定界符
 * 2. operators, functions, constants可能会修改，需要统一读取并使用参数传递，
 * 函数内部不需要单独从外部读取
 * 3. 防止卡死，最大遍历深度限制为100
 */

// 使用 IIFE 创建模块作用域
const Calculator = (function() {
    // 定义常量和类型
    const MAX_DEPTH = 100;  // 添加全局最大深度常量
    
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
    function preprocess(expr, operators, functions, constants) {

        // 替换可能输错的半角符号
        const normalized = normalizeSymbols(expr);

        if (normalized !== expr) {
            addWarning(`格式化: "${normalized}"`);
        }
        
        expr = normalized;

        // 清除cc 临时系统变量
        ccVariables.clear();

        // 处理日期
        // console.log('processDate 1: ', expr);
        expr = processDate(expr);
        // console.log('processDate 2: ', expr);

        // 处理时间间隔
        // console.log('processTimestamp 1: ', expr);
        expr = processTimestamp(expr);
        // console.log('processTimestamp 2: ', expr);

        // 处理字符串字面量
        expr = processStringLiterals(expr);

        // 处理矩阵
        expr = processMatrix(expr);
        
        // 在空格不影响语义之后，清除空格
        expr = expr.replace(/\s/g, '');

        // TODO: 打印ccVariables
        // console.log('ccVariables: ', ccVariables);

        // ccVariables添加到variables
        for (const [key, value] of ccVariables) {
            variables.set(key, value);
        }

        // 检查括号匹配
        checkParentheses(expr, MAX_DEPTH);

        // TODO: 如果有新属性，需要手动动态添加
        for (const [name, func] of Object.entries(FUNCTIONS)) {
            if (func.asProperty) {
                operators.add('.' + name);
                OPERATORS['.' + name] = {
                    precedence: 8,
                    args: 1,
                    func: func.func,
                    position: 'postfix',
                    ...(func.argTypes && { argTypes: func.argTypes }),
                    ...(func.repr && { repr: func.repr }),
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

        // 检查区分正号+和加号+，负号-和减号-
        function shouldBeUnaryOperator() {
            if (tokens.length === 0) return true;
            
            const [type, value] = tokens[tokens.length - 1];

            // 在后缀操作符中，%和‰后，必须是减法
            if (value === '%' || value === '‰')
                return false;
            
            // 只有在这些情况下是二元运算符，其他都是一元运算符
            return !(
                type === 'string' ||           // 数字/变量后
                type === 'constant' ||         // 常量后
                (type === 'delimiter' && value === ')') ||  // 右括号后
                type === 'function' ||         // 函数名后
                type === 'identifier' ||       // 标识符后
                (type === 'operator' && value.startsWith('.'))  // 属性访问运算符后
            );
        }  

        function collectString() {
            let str = '';
            while (i < expr.length) {
                const char = expr[i];
                const potentialStr = str + char;

                // 如果当前积累的字符串可能是特殊形式的开始（如 0x），继续收集
                if (str === '0' && (char === 'x' || char === 'b' || char === 'o')) {
                    str += char;
                    i++;
                    continue;
                }

                // 处理科学计数法
                // 1. 检查是否是有效的数字部分
                if (/^\d+\.?\d*$/.test(str)) {
                    // 2. 检查是否遇到科学计数法标记 e/E
                    if (char === 'e' || char === 'E') {
                        str += char;
                        i++;
                        // 3. 检查指数部分的符号
                        if (i < expr.length && (expr[i] === '+' || expr[i] === '-')) {
                            str += expr[i];
                            i++;
                        }
                        // 4. 收集指数部分的数字
                        while (i < expr.length && /\d/.test(expr[i])) {
                            str += expr[i];
                            i++;
                        }
                        continue;
                    }
                }

                // 检查是否是分隔符或定界符
                if (delimiters.has(char) || separators.has(char)) {
                    break;
                }

                // 检查是否是操作符
                const isOperator = sortedOperators.some(op => expr.startsWith(op, i));

                // 只有当当前字符串不是任何函数或常量的前缀时，才考虑运算符
                const isPrefix = [...functions, ...constants].some(name => name.startsWith(potentialStr));

                if (isOperator && !isPrefix) {
                    break;
                }

                str += char;
                i++;
            }
            return str;
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
                                    // 保持原始token类型
                                    if (constants.has(parts[j])) {
                                        newTokens.push(['constant', parts[j]]);
                                    } else {
                                        newTokens.push(['string', parts[j]]);
                                    }
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

        const tokens = [];
        let i = 0;

        // 使用新的 DELIMITERS 和 SEPARATORS
        const delimiters = new Set(Object.keys(DELIMITERS));
        const separators = new Set(Object.keys(SEPARATORS));

        const sortedOperators = [...operators].sort((a, b) => b.length - a.length);
        let lastTokenType = null;  // 添加上一个 token 的类型记录

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
                    if (op === '+') {
                        // 特殊处理加号
                        if (shouldBeUnaryOperator()) {
                            tokens.push(['operator', 'unary+']);
                        } else {
                            tokens.push(['operator', '+']);
                        }
                    } else if (op === '-') {
                        // 特殊处理减号
                        if (shouldBeUnaryOperator()) {
                            tokens.push(['operator', 'unary-']);
                        } else {
                            tokens.push(['operator', '-']);
                        }
                    // } else if (op === '@') {
                    //     // 先统一标记为@，后面根据情况判断是日期符号还是矩阵乘法
                    //     tokens.push(['operator', '@']);  
                    // }else if (op === '%') {
                    //     // 先统一标记为%，后面根据情况判断是百分号还是取模
                    //     tokens.push(['operator', '%']);  
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

        function parseUnary(precedence = 0) {
            depth++;
            checkDepth();

            if (current >= tokens.length) {
                throw new Error('意外的表达式结束');
            }

            const [type, value] = tokens[current];
            
            // 处理前缀运算符
            if (type === 'operator' && 
                OPERATORS[value] && 
                OPERATORS[value].position === 'prefix') {
                
                current++;
                
                // 直接使用运算符的优先级,不需要特殊处理
                // 在 operators.js 中设置 unary- 的优先级小于 **
                const right = parseExpression(OPERATORS[value].precedence);
                
                depth--;
                return createNode(value, [right], 'operator');
            }
            
            depth--;
            return parsePrimary();
        }

        function parseExpression(precedence = 0) {
            depth++;
            checkDepth();

            let left = parseUnary(precedence);
            
            while (current < tokens.length) {
                const [type, value] = tokens[current];
                
                // 区分百分号运算符和取模运算符
                if (type === 'operator' && value === '%') {
                    // 看下一个token来判断是百分号还是取模
                    const nextToken = tokens[current + 1];
                    
                    // 判断是否是取模运算符 - 后面必须是可以作为操作数的token
                    const isModulo = nextToken && (
                        nextToken[0] === 'string' ||  // 数字或变量
                        nextToken[0] === 'constant' || // 常量
                        nextToken[0] === 'function' || // 函数
                        (nextToken[0] === 'delimiter' && nextToken[1] === '(') // 左括号
                    );

                    if (isModulo) {
                        // 作为取模运算符处理
                        if (OPERATORS['%'].precedence < precedence) {
                            break;
                        }
                        current++;
                        const right = parseExpression(OPERATORS['%'].precedence + 1);
                        left = createNode('%', [left, right], 'operator');
                    } else {
                        // 作为百分号处理
                        current++;
                        left = createNode('unary%', [left], 'operator');
                    }
                    continue;
                }

                // 区分日期符号和矩阵乘法
                if (type === 'operator' && value === '@') {
                    // 看前一个token来判断是日期符号还是矩阵乘法
                    const prevToken = tokens[current - 1];
                    
                    // 判断是否是矩阵乘法运算符 - 前面必须是可以作为操作数的token
                    const isMatmul = prevToken && (
                        prevToken[0] === 'string' ||  // 数字或变量
                        prevToken[0] === 'constant' || // 常量
                        prevToken[0] === 'function' || // 函数
                        (prevToken[0] === 'delimiter' && prevToken[1] === ')') // 右括号
                    );

                    if (isMatmul) {
                        // 作为矩阵乘法运算符处理
                        if (OPERATORS['matmul@'].precedence < precedence) {
                            break;
                        }
                        current++;
                        const right = parseExpression(OPERATORS['matmul@'].precedence + 1);
                        left = createNode('matmul@', [left, right], 'operator');
                    } else {
                        // 作为日期符号处理
                        current++;
                        const right = parseExpression(OPERATORS['@'].precedence + 1);
                        left = createNode('@', [right], 'operator');
                    }
                    continue;
                }
                
                // 处理后缀运算符
                if (type === 'operator' && 
                    OPERATORS[value] && 
                    OPERATORS[value].position === 'postfix') {
                    // 检查优先级 - 只有当当前运算符优先级大于等于传入的优先级时才处理
                    if (OPERATORS[value].precedence < precedence) {
                        break;
                    }
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
                const op = OPERATORS[value];
                const nextPrecedence = op.isCompoundAssignment ? 
                    op.precedence :  
                    op.precedence + 1;  
                    
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
        function checkASTForSelfApplication(ast, depth = 0) {
            // 添加深度检查
            if (depth > MAX_DEPTH) {
                throw new Error('自引用检查嵌套深度过大，可能存在无限递归');
            }

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
            // 继续检查子节点，增加深度计数
            ast.args?.forEach(arg => checkASTForSelfApplication(arg, depth + 1));
        }

        // 执行自引用检查
        checkASTForSelfApplication(ast);

        return ast;
    }

    // 在 evaluate 函数之前添加参数转换函数
    function convertArguments(args, argTypes) {
        // console.log("convertArguments1: ", argTypes);
        if (!argTypes) {
            // console.log("convertArguments2: 默认参数");
            return args.map(arg => Utils.convertTypes(arg));
        }

        return args.map(arg => Utils.convertTypes(arg, argTypes));
    }

    // 4. 求值模块
    function evaluate(node, operators, functions, constants, depth = 0) {
        if (depth > MAX_DEPTH) {
            throw new Error('表达式求值嵌套深度过大，可能存在无限递归');
        }

        if (!node) return 0;

        // 处理单独的字符串节点：a = 1 中的 1
        // 也可能是变量名
        if (node.type === 'string') {
            if (variables.has(node.value)) {
                return variables.get(node.value);
            }
            // 如果不是变量，则转换为数字
            return Utils.convertTypes(node.value);

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
        const args = node.args.map(arg => evaluate(arg, operators, functions, constants, depth + 1));

        // 处理运算符
        if (node.type === 'operator') {
            const op = OPERATORS[node.value];

            // 检查参数数量
            if (op.args !== undefined && args.length !== op.args) {
                throw new Error(`运算符 "${node.value}" 需要 ${op.args} 个参数，但得到了 ${args.length} 个`);
            }
            
            // 处理赋值运算符
            if (op.isCompoundAssignment) {
                const [left, right] = node.args;
                // 检查左侧是否为标识符类型的节点
                if (left.type !== 'identifier' && left.type !== 'string') {
                    throw new Error('赋值运算符左侧必须是变量名');
                }
                
                // 检查变量名是否合法
               checkVariableName(left.value, operators, functions, constants);
                
                // 计算右侧表达式
                const rightValue = evaluate(right, operators, functions, constants, depth + 1);
                
                // 对于等号，直接赋值
                if (node.value === '=') {
                    // 普通赋值
                    variables.set(left.value, rightValue);
                    addInfo(`添加变量 ${left.value}: ${rightValue}`)

                    // 检查是否是x变量，提示无法使用x做为乘法
                    if (left.value === 'x') {
                        addWarning(`将无法使用x做为乘法符号`)
                    }
                    return rightValue;
                }
                else {
                    // 对于复合赋值，检查变量是否已定义
                    if (!variables.has(left.value)) {
                        throw new Error(`变量 "${left.value}" 未定义`);
                    }
                    
                    let oldValue = variables.get(left.value);
                    // 转换参数类型
                    const convertedArgs = convertArguments([oldValue, rightValue], op.argTypes);
                    const result = op.func(...convertedArgs);
                    
                    // 更新变量的值
                    variables.set(left.value, result);
                    return result;
                }
            }

            // 其他运算符的处理
            const convertedArgs = convertArguments(args, op.argTypes);
            
            return op.func(...convertedArgs);
        }

        // 处理函数
        if (node.type === 'function') {
            const func = FUNCTIONS[node.value];

            // 检查参数数量
            if (func.args !== undefined) {
                if (func.args === -1) {
                    // 不限制参数数量, 至少1个参数
                    if (args.length === 0) {
                        throw new Error(`函数 "${node.value}" 至少需要1个参数`);
                    }
                }
                else if (func.args === -2) {
                    // 不限制参数数量, 0个参数也可以
                }
                else{
                    // 处理固定参数数量
                    if (args.length !== func.args) {
                        throw new Error(`函数 "${node.value}" 需要 ${func.args} 个参数，但得到了 ${args.length} 个`);
                    }
                }
            }
            
            // 检查并转换参数
            const convertedArgs = convertArguments(args, func.argTypes);
            
            return func.func(...convertedArgs);
        }

        throw new Error(`未处理的节点类型: ${node.type}`);
    }

    // 5. 格式化输出模块, 添加额外提醒信息info
    function formatOutput(result, ast, operators, functions) {

        // console.log('result的类型: ', typeof result);
        result = Utils.formatToDisplayString(result);

        // 如果result是对象，则添加info 
        if(typeof result === 'object' && result !== null)
        {
            if(result.info)
            {
                addInfo(result.info);
            }

            if(result.warning)
            {
                addWarning(result.warning);
            }
            
            result = result.value;
        }

        // 防御性检查
        if (!ast) {
            return { 
                value: result,
                info: infos.length > 0 ? infos : null, 
                warning: warnings.length > 0 ? warnings : null
            };
        }

        try {
            // 直接使用 ast 节点
            let targetNode = ast;

            // 如果是赋值运算符(只支持等号)，获取右侧表达式节点
            //if (targetNode.type === 'operator' && OPERATORS[targetNode.value]?.isCompoundAssignment) {
            if (targetNode.type === 'operator' && targetNode.value === '=') {
                targetNode = targetNode.args[1];
            }

            // 根据节点类型查找对应的 repr 方法
            let repr;
            if (targetNode.type === 'function' && FUNCTIONS[targetNode.value]) {
                repr = FUNCTIONS[targetNode.value].repr;
            } else if (targetNode.type === 'operator' && OPERATORS[targetNode.value]) {
                repr = OPERATORS[targetNode.value].repr;
            }

            // 如果找到了 repr 方法就调用它
            if (typeof repr === 'function') {
                try {
                    // console.log('result: ', result);
                    const formattedResult = repr(result);
                    // console.log('formattedResult: ', formattedResult);
                    // 确保 repr 返回了有效值, 并添加到INFO中
                    if (formattedResult !== undefined && formattedResult !== null) {
                        // result = formattedResult;
                        addInfo(formattedResult);
                    }
                } catch (error) {
                    throw new Error(`${error.message}`);
                }
            }

            return { 
                value: result,
                info: infos.length > 0 ? infos : null, 
                warning: warnings.length > 0 ? warnings : null
            };
        } catch (error) {
            addWarning(`格式化输出时发生错误: ${error.message}`);
            return { 
                value: result,
                info: infos.length > 0 ? infos : null, 
                warning: warnings.length > 0 ? warnings : null
            };
        }
    }

    // 6. 返回公共API
    return {
        calculate(expr) {
            // TODO: 添加超时处理
            clearMessages(); // 清除之前的消息

            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const { expr: processedExpr, operators: sortedOperators } = preprocess(expr, operators, functions, constants);
            const tokens = tokenize(processedExpr, sortedOperators, functions, constants);
            const ast = buildAst(tokens, operators, functions);
            const result = evaluate(ast, operators, functions, constants);
            // 添加格式化处理，传入完整的上下文
            const exprResult = formatOutput(result, ast, operators, functions);
            
            return exprResult;
        },

        getASTNode(expr) {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const { expr: processedExpr, operators: sortedOperators } = preprocess(expr, operators, functions, constants);
            const tokens = tokenize(processedExpr, sortedOperators, functions, constants);
            return buildAst(tokens, operators, functions);
        },

        getCfg() {
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            return {
                operators,
                functions,
                constants
            };
        },

        setCfg(key, value) {
            config.set(key, value);
        },

        tokenize(expr, operators, functions, constants) {
            return tokenize(expr, operators, functions, constants);
        },

        preprocess(expr, operators, functions, constants) {
            return preprocess(expr, operators, functions, constants);
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


// 修改导出方式
export { Calculator, OPERATORS, FUNCTIONS, CONSTANTS };

// 测试

function TEST(expr){
    try{
        console.log('expr: ', expr);
        console.log(Calculator.calculate(expr));
    }
    catch(e){
        console.log('error: ', e.message);
    }
    console.log('---------------------------------------------------');
}

// console.log(Calculator.calculate('eigenvalues({1 2 3; 4 5 6; 7 8 9})'));

// console.log(Calculator.calculate('{[1 3 5], [2 4 6]}.inv'));
// TEST('[]');
// TEST('[1]');

// TEST('[1 2 3]');
// TEST('[1,2,3]');
// TEST('[1;2;3]');

// TEST('[1,2,3;4,5,6;7,8,9]');

// TEST('[1 2 3]');
// TEST('[1 2 3;4 5 6]');
// TEST('[1 2 3;4 5 6;7 8 9]');
// TEST('[1 2 3, 4 5 6]');

// TEST('[a b+1 c]');

// TEST('[a -b b+1]');





// TEST('{1 2 3}');
// TEST('{[1 2 3]}');
// TEST('{1; 2; 3}');
// TEST('a = [1 2 3]');
// // TEST('{a}');
// TEST('{a;a}');
// TEST('{a,a}');

// TEST('{1 2 3;4 5 6}');
