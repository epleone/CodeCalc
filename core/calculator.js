import { 
    OPERATORS,
    FUNCTIONS,
    CONSTANTS,
    DELIMITERS,
    SEPARATORS 
} from './operators.js';

import { 
    DURATION_UNIT_DEFINITIONS,
    normalizeSymbols,
    checkParentheses,
    checkVariableName,
    processMatrix,
    rewriteLegacyHashTimestamp
} from './preprocessUtils.js';

import {
    isFunctionDefinition,
    isConstantDefinition,
    getCustomFunctionName,
    getCustomConstantName,
    updateCustomFromStorage,
} from './customFunctions.js';

import { Utils, CCnode, Datestamp } from './utils.js';
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

        // 当出现 #整数且不是合法 duration literal时，改成时间戳毫秒格式，并自动可视化为日期。
        // 例如：#1693827361289 -> #1693827361289ms >#@
        expr = rewriteLegacyHashTimestamp(expr);

        // 处理矩阵
        expr = processMatrix(expr);
        
        // 检查括号匹配
        checkParentheses(expr, MAX_DEPTH);

        // 单变量函数默认支持后缀调用 .f
        for (const func of Object.values(FUNCTIONS)) {
            if (func.args === 1) {
                func.asProperty = true;
            }
        }

        for (const [name, func] of Object.entries(FUNCTIONS)) {
            let resolved = func;
            while (resolved.alias) {
                resolved = FUNCTIONS[resolved.alias];
            }
            if (!resolved?.asProperty) continue;

            operators.add('.' + name);
            OPERATORS['.' + name] = {
                precedence: resolved.precedence !== undefined ? resolved.precedence : 5,  // 和后置运算符 %, ‰, ! 的优先级相同
                args: 1,
                func: resolved.func,
                position: 'postfix',
                ...(resolved.argTypes && { argTypes: resolved.argTypes }),
                ...(resolved.preventSelfReference && { preventSelfReference: resolved.preventSelfReference })
            };
        }

        // 按长度降序排列运算符，确保先匹配较长的运算符
        const sortedOperators = new Set([...operators].sort((a, b) => b.length - a.length));

        return { expr, operators: sortedOperators };
    }

    // 2. 词法分析模块
    function tokenize(expr, operators, functions, constants) {
        function isIdentifierStart(char) {
            return /[a-zA-Z_$]/.test(char || '');
        }

        function isIdentifierChar(char) {
            return /[a-zA-Z0-9_$]/.test(char || '');
        }

        function isOperandToken(token) {
            if (!token) return false;
            const [type, value] = token;
            if (type === 'number' || type === 'identifier' || type === 'constant' || type === 'string_literal' || type === 'date_literal' || type === 'duration_literal') {
                return true;
            }
            // 管道 token（>func）视为操作数，避免 1>sin+1 中的 + 被收成 unary+
            if (type === 'pipe') {
                return true;
            }
            // 裸函数名（少数残留路径）也视为操作数
            if (type === 'function') {
                return true;
            }
            if (type === 'delimiter' && value === ')') {
                return true;
            }
            if (type === 'operator' && OPERATORS[value]?.position === 'postfix') {
                return true;
            }
            return false;
        }

        function shouldBeUnaryOperator() {
            if (tokens.length === 0) return true;
            const [prevType, prevValue] = tokens[tokens.length - 1];
            if (prevType === 'operator' && prevValue === '%') {
                return false;
            }
            return !isOperandToken(tokens[tokens.length - 1]);
        }

        function canStartModuloRightOperand() {
            let j = i + 1;
            while (j < expr.length && /\s/.test(expr[j])) j++;
            const nextChar = expr[j];
            if (!nextChar) return false;
            return /\d/.test(nextChar) || nextChar === '.' || nextChar === '(' || nextChar === '@' || nextChar === '#' || nextChar === '"' || nextChar === "'" || nextChar === '`' || isIdentifierStart(nextChar);
        }

        function isInFunctionArgs() {
            return parenContextStack.includes('func');
        }

        function readQuotedString() {
            const quote = expr[i];
            i++;
            let content = '';

            while (i < expr.length) {
                const char = expr[i];
                if (char === '\\' && i + 1 < expr.length) {
                    const escaped = expr[i + 1];
                    if (escaped === quote || escaped === '\\' || escaped === "'" || escaped === '"' || escaped === '`') {
                        content += escaped;
                    } else {
                        content += '\\' + escaped;
                    }
                    i += 2;
                    continue;
                }
                if (char === quote) {
                    i++;
                    return content;
                }
                content += char;
                i++;
            }

            throw new Error('未闭合的字符串字面量');
        }

        function readIdentifier() {
            const start = i;
            i++;
            // $12 这类行号变量只吃 $ + 数字，便于 $1x2 → $1 * 2
            if (expr[start] === '$' && i < expr.length && /\d/.test(expr[i])) {
                while (i < expr.length && /\d/.test(expr[i])) i++;
                return expr.slice(start, i);
            }
            while (i < expr.length && isIdentifierChar(expr[i])) {
                i++;
            }
            return expr.slice(start, i);
        }

        function readNumber() {
            const start = i;
            const allowThousands = !isInFunctionArgs();

            if ((expr.startsWith('0x', i) || expr.startsWith('0X', i)) && /[0-9a-fA-F]/.test(expr[i + 2] || '')) {
                i += 2;
                while (i < expr.length && /[0-9a-fA-F]/.test(expr[i])) i++;
                return expr.slice(start, i);
            }

            if ((expr.startsWith('0b', i) || expr.startsWith('0B', i)) && /[01]/.test(expr[i + 2] || '')) {
                i += 2;
                while (i < expr.length && /[01]/.test(expr[i])) i++;
                return expr.slice(start, i);
            }

            if ((expr.startsWith('0o', i) || expr.startsWith('0O', i)) && /[0-7]/.test(expr[i + 2] || '')) {
                i += 2;
                while (i < expr.length && /[0-7]/.test(expr[i])) i++;
                return expr.slice(start, i);
            }

            let j = i;
            if (expr[j] !== '.') {
                while (j < expr.length && /[\d,]/.test(expr[j])) {
                    if (expr[j] === ',' && !allowThousands) break;
                    j++;
                }
            }

            let intPart = expr.slice(i, j);
            if (intPart.includes(',')) {
                if (/^\d{1,3}(?:,\d{3})+$/.test(intPart)) {
                    intPart = intPart.replace(/,/g, '');
                } else {
                    const firstComma = intPart.indexOf(',');
                    intPart = intPart.slice(0, firstComma);
                    j = i + intPart.length;
                }
            }

            if (!intPart && expr[j] === '.') {
                intPart = '0';
            }

            let fracPart = '';
            if (expr[j] === '.' && /\d/.test(expr[j + 1] || '')) {
                const fracStart = j;
                j++;
                while (j < expr.length && /\d/.test(expr[j])) j++;
                fracPart = expr.slice(fracStart, j);
            }

            let expPart = '';
            if (j < expr.length && /[eE]/.test(expr[j])) {
                let k = j + 1;
                if (k < expr.length && /[+-]/.test(expr[k])) k++;
                const expDigitsStart = k;
                while (k < expr.length && /\d/.test(expr[k])) k++;
                if (k > expDigitsStart) {
                    expPart = expr.slice(j, k);
                    j = k;
                }
            }

            i = j;
            return intPart + fracPart + expPart;
        }

        function parseDateLiteralValue(dateString, format) {
            const now = new Date();
            let date;

            switch (format) {
                case 'now':
                    date = now;
                    break;
                case 'today':
                    date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'YYYY-MM-DD HH:mm:ss':
                    date = new Date(dateString);
                    break;
                case 'YYYY-MM-DD HH:mm':
                    date = new Date(dateString + ':00');
                    break;
                case 'YYYY-MM-DD':
                    date = new Date(dateString + 'T00:00:00');
                    break;
                case 'MM-DD HH:mm:ss':
                    dateString = dateString.replace(/^(\d{1,2})-(\d{1,2})/, (match, m, d) =>
                        `${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                    date = new Date(now.getFullYear() + '-' + dateString);
                    break;
                case 'MM-DD HH:mm':
                    dateString = dateString.replace(/^(\d{1,2})-(\d{1,2})/, (match, m, d) =>
                        `${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                    date = new Date(now.getFullYear() + '-' + dateString + ':00');
                    break;
                case 'YYYY-MM':
                    date = new Date(dateString + '-01T00:00:00');
                    break;
                case 'MM-DD':
                    dateString = dateString.replace(/(\d{1,2})-(\d{1,2})/, (match, m, d) =>
                        `${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                    date = new Date(now.getFullYear() + '-' + dateString + 'T00:00:00');
                    break;
                case 'YYYY':
                    date = new Date(dateString + '-01-01T00:00:00');
                    break;
                default:
                    return null;
            }

            return isNaN(date.getTime()) ? null : date;
        }

        function tryReadDateLiteral() {
            if (expr[i] !== '@') return null;

            let j = i + 1;
            while (j < expr.length && /\s/.test(expr[j])) j++;
            const rest = expr.slice(j);

            const patterns = [
                {
                    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})(?![\d:])/,
                    format: 'YYYY-MM-DD HH:mm:ss',
                    extract: m => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} ${m[4]}:${m[5]}:${m[6]}`
                },
                {
                    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?![\d:])/,
                    format: 'YYYY-MM-DD HH:mm',
                    extract: m => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} ${m[4]}:${m[5]}`
                },
                {
                    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})(?![-\d])/,
                    format: 'YYYY-MM-DD',
                    extract: m => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
                },
                {
                    regex: /^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})(?![\d:])/,
                    format: 'MM-DD HH:mm:ss',
                    extract: m => `${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')} ${m[3]}:${m[4]}:${m[5]}`
                },
                {
                    regex: /^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?![\d:])/,
                    format: 'MM-DD HH:mm',
                    extract: m => `${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')} ${m[3]}:${m[4]}`
                },
                {
                    regex: /^(\d{4})-(\d{1,2})(?![-\d])/,
                    format: 'YYYY-MM',
                    extract: m => `${m[1]}-${m[2].padStart(2, '0')}`
                },
                {
                    regex: /^(\d{1,2})-(\d{1,2})(?![-\d])/,
                    format: 'MM-DD',
                    extract: m => `${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
                },
                {
                    regex: /^(\d{4})(?![-\d])/,
                    format: 'YYYY',
                    extract: m => m[1]
                },
                {
                    regex: /^(now)(?![a-zA-Z0-9_])/,
                    format: 'now',
                    extract: m => m[1]
                },
                {
                    regex: /^(today)(?![a-zA-Z0-9_])/,
                    format: 'today',
                    extract: m => m[1]
                }
            ];

            for (const { regex, format, extract } of patterns) {
                const match = regex.exec(rest);
                if (!match) continue;
                const parsed = parseDateLiteralValue(extract(match), format);
                if (!parsed) continue;
                return {
                    value: parsed,
                    nextIndex: j + match[0].length
                };
            }

            return null;
        }

        function tryReadDurationLiteral() {
            if (expr[i] !== '#') return null;

            let j = i + 1;
            while (j < expr.length && /\s/.test(expr[j])) j++;

            const readParenthesizedExpression = (start) => {
                if (expr[start] !== '(') return null;
                let cursor = start + 1;
                let depth = 1;
                while (cursor < expr.length && depth > 0) {
                    const currentChar = expr[cursor];
                    if (currentChar === '(') {
                        depth++;
                    } else if (currentChar === ')') {
                        depth--;
                    }
                    cursor++;
                }
                if (depth !== 0) {
                    throw new Error('时长字面量中括号未闭合');
                }
                const raw = expr.slice(start + 1, cursor - 1).trim();
                if (!raw) {
                    throw new Error('时长字面量括号内不能为空');
                }
                return { raw, nextIndex: cursor };
            };

            const clockMatch = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?![\d:])/.exec(expr.slice(j));
            if (clockMatch) {
                const hours = Number(clockMatch[1]);
                const minutes = Number(clockMatch[2]);
                const seconds = Number(clockMatch[3] ?? '0');
                if (minutes >= 60 || seconds >= 60) {
                    throw new Error('时分秒格式错误，分钟和秒需小于60');
                }
                const totalMilliseconds = (((hours * 60) + minutes) * 60 + seconds) * 1000;
                return {
                    value: {
                        parts: [
                            {
                                unit: 'milliseconds',
                                valueType: 'number',
                                value: String(totalMilliseconds)
                            }
                        ]
                    },
                    nextIndex: j + clockMatch[0].length
                };
            }

            const seenUnits = new Set();
            const parts = [];

            while (j < expr.length) {
                while (j < expr.length && /\s/.test(expr[j])) j++;
                if (j >= expr.length) break;

                let valueType = null;
                let valueRaw = null;

                const parenthesized = readParenthesizedExpression(j);
                if (parenthesized) {
                    valueType = 'expression';
                    valueRaw = parenthesized.raw;
                    j = parenthesized.nextIndex;
                } else {
                    const numberMatch = /^[+-]?\d+(?:\.\d+)?/.exec(expr.slice(j));
                    if (!numberMatch) {
                        break;
                    }
                    valueType = 'number';
                    valueRaw = numberMatch[0];
                    j += numberMatch[0].length;
                }

                while (j < expr.length && /\s/.test(expr[j])) j++;

                let matchedUnit = null;
                let canonicalUnit = null;
                for (const [unitText, unitKey] of DURATION_UNIT_DEFINITIONS) {
                    const tail = expr.slice(j, j + unitText.length);
                    if (tail.length !== unitText.length) continue;
                    if (tail.toLowerCase() !== unitText.toLowerCase()) continue;
                    matchedUnit = unitText;
                    canonicalUnit = unitKey;
                    break;
                }

                if (!matchedUnit) {
                    if (parts.length === 0) {
                        return null;
                    }
                    throw new Error('时长字面量缺少合法单位');
                }

                if (seenUnits.has(canonicalUnit)) {
                    throw new Error(`时长单位 "${canonicalUnit}" 重复赋值`);
                }
                seenUnits.add(canonicalUnit);

                parts.push({
                    unit: canonicalUnit,
                    valueType,
                    value: valueRaw
                });
                j += matchedUnit.length;
            }

            if (parts.length === 0) {
                return null;
            }

            return {
                value: { parts },
                nextIndex: j
            };
        }

        function maybeXAsMultiply() {
            const char = expr[i];
            if (char !== 'x' && char !== 'X') return false;
            if (!isOperandToken(tokens[tokens.length - 1])) return false;

            // 紧贴字母/_：不当乘法（2xa、2xor）；空格后仍可（2 x a）；$ 可紧贴（2x$1）
            const nextRaw = expr[i + 1];
            if (nextRaw && /[a-zA-Z_]/.test(nextRaw)) return false;

            let nextIndex = i + 1;
            while (nextIndex < expr.length && /\s/.test(expr[nextIndex])) nextIndex++;
            const nextChar = expr[nextIndex];
            if (!nextChar) return false;
            const canStartOperand = /\d/.test(nextChar) || nextChar === '.' || nextChar === '(' || nextChar === '@' || nextChar === '#' || nextChar === '"' || nextChar === "'" || nextChar === '`' || isIdentifierStart(nextChar);
            if (!canStartOperand) return false;

            if (variables.has(char)) {
                throw new Error(`变量 "${char}" 已存在，无法使用${char}作为乘法符号`);
            }

            addWarning(`使用${char}作为乘法符号`);
            tokens.push(['operator', '*']);
            i++;
            return true;
        }

        function isPostfixOperatorName(opName) {
            if (!OPERATORS[opName]) return false;

            let current = opName;
            const visited = new Set();
            while (OPERATORS[current] && !visited.has(current)) {
                visited.add(current);
                const meta = OPERATORS[current];
                if (meta.position === 'postfix') {
                    return true;
                }
                if (!meta.alias) {
                    break;
                }
                current = meta.alias;
            }
            return false;
        }

        const spacedPostfixCandidates = Object.keys(OPERATORS)
            .filter(op => op.length > 1 && op.startsWith('>') && isPostfixOperatorName(op))
            .sort((a, b) => b.length - a.length);

        function matchSpacedPostfixOperator() {
            if (expr[i] !== '>') return null;

            const tryMatchWithOptionalSpaces = (operatorName) => {
                let cursor = i;

                for (let idx = 0; idx < operatorName.length; idx++) {
                    const ch = operatorName[idx];

                    if (idx > 0) {
                        while (cursor < expr.length && /\s/.test(expr[cursor])) {
                            cursor++;
                        }
                    }

                    if (expr[cursor] !== ch) {
                        return null;
                    }
                    cursor++;
                }

                // 对以字母/数字/下划线结尾的操作符（如 >cn）做边界校验
                const tailChar = operatorName[operatorName.length - 1];
                if (/[a-zA-Z0-9_$]/.test(tailChar)) {
                    const nextChar = expr[cursor] || '';
                    if (/[a-zA-Z0-9_$]/.test(nextChar)) {
                        return null;
                    }
                }

                return { op: operatorName, nextIndex: cursor };
            };

            for (const operatorName of spacedPostfixCandidates) {
                const matched = tryMatchWithOptionalSpaces(operatorName);
                if (matched) {
                    return matched;
                }
            }

            return null;
        }

        const tokens = [];
        let i = 0;
        const parenContextStack = [];

        // 使用新的 DELIMITERS 和 SEPARATORS
        const delimiters = new Set(Object.keys(DELIMITERS));
        const separators = new Set(Object.keys(SEPARATORS));

        const sortedOperators = [...operators].sort((a, b) => b.length - a.length);

        while (i < expr.length) {
            const char = expr[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (char === '"' || char === "'" || char === '`') {
                tokens.push(['string_literal', readQuotedString()]);
                continue;
            }

            if (char === '@' && !isOperandToken(tokens[tokens.length - 1])) {
                const dateLiteral = tryReadDateLiteral();
                if (dateLiteral) {
                    tokens.push(['date_literal', dateLiteral.value]);
                    i = dateLiteral.nextIndex;
                    continue;
                }
            }

            if (char === '#' && !isOperandToken(tokens[tokens.length - 1])) {
                const durationLiteral = tryReadDurationLiteral();
                if (durationLiteral) {
                    tokens.push(['duration_literal', durationLiteral.value]);
                    i = durationLiteral.nextIndex;
                    continue;
                }
            }

            if (char === '(') {
                const prev = tokens[tokens.length - 1];
                const context = prev && prev[0] === 'function' ? 'func' : 'group';
                parenContextStack.push(context);
                tokens.push(['delimiter', '(']);
                i++;
                continue;
            }

            if (char === ')') {
                if (parenContextStack.length > 0) {
                    parenContextStack.pop();
                }
                tokens.push(['delimiter', ')']);
                i++;
                continue;
            }

            if (separators.has(char)) {
                tokens.push(['separator', char]);
                i++;
                continue;
            }

            if (maybeXAsMultiply()) {
                continue;
            }

            const spacedPostfix = matchSpacedPostfixOperator();
            if (spacedPostfix && OPERATORS[spacedPostfix.op]) {
                if (OPERATORS[spacedPostfix.op].alias) {
                    tokens.push(['operator', OPERATORS[spacedPostfix.op].alias]);
                } else {
                    tokens.push(['operator', spacedPostfix.op]);
                }
                i = spacedPostfix.nextIndex;
                continue;
            }

            // 函数管道：>func / > func（后面不是 '('）→ pipe token
            // 常量/已定义变量仍留给比较运算符 >
            if (char === '>') {
                let j = i + 1;
                while (j < expr.length && /\s/.test(expr[j])) j++;
                if (j < expr.length && isIdentifierStart(expr[j])) {
                    let k = j;
                    while (k < expr.length && isIdentifierChar(expr[k])) k++;
                    const name = expr.slice(j, k);
                    let t = k;
                    while (t < expr.length && /\s/.test(expr[t])) t++;
                    if (expr[t] !== '(') {
                        const isFunc = functions.has(name);
                        const isConst = constants.has(name);
                        const isVar = variables.has(name);
                        if (isFunc || (!isConst && !isVar)) {
                            let resolved = name;
                            if (isFunc && FUNCTIONS[name]?.alias) {
                                resolved = FUNCTIONS[name].alias;
                            }
                            tokens.push(['pipe', resolved]);
                            i = k;
                            continue;
                        }
                    }
                }
            }

            if (/\d/.test(char) || (char === '.' && /\d/.test(expr[i + 1]))) {
                tokens.push(['number', readNumber()]);
                continue;
            }

            // 检查操作符
            let foundOperator = false;
            const remainingExpr = expr.slice(i);
            for (const op of sortedOperators) {
                if (remainingExpr.startsWith(op)) {
                    if (/^[a-zA-Z_]+$/.test(op)) {
                        const prevChar = expr[i - 1];
                        const nextChar = expr[i + op.length];
                        if (isIdentifierStart(prevChar) || isIdentifierStart(nextChar)) {
                            continue;
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
                    } else if (op === '%') {
                        if (!isOperandToken(tokens[tokens.length - 1])) {
                            throw new Error('百分号前缺少操作数');
                        }
                        tokens.push(['operator', canStartModuloRightOperand() ? '%' : 'unary%']);
                    } else if (op === '@') {
                        tokens.push(['operator', isOperandToken(tokens[tokens.length - 1]) ? 'matmul@' : '@']);
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
                    i += op.length;
                    foundOperator = true;
                    break;
                }
            }
            if (foundOperator) continue;

            if (isIdentifierStart(char)) {
                const identifier = readIdentifier();
                if (functions.has(identifier)) {
                    if (FUNCTIONS[identifier] && FUNCTIONS[identifier].alias) {
                        tokens.push(['function', FUNCTIONS[identifier].alias]);
                    } else {
                        tokens.push(['function', identifier]);
                    }
                } else if (constants.has(identifier)) {
                    tokens.push(['constant', identifier]);
                } else {
                    tokens.push(['identifier', identifier]);
                }
                continue;
            }

            if (constants.has(char)) {
                tokens.push(['constant', char]);
                i++;
                continue;
            }

            // `.f` 形式：函数存在但不支持后缀调用时给出明确错误
            if (char === '.' && isIdentifierStart(expr[i + 1])) {
                let j = i + 1;
                while (j < expr.length && isIdentifierChar(expr[j])) j++;
                const name = expr.slice(i + 1, j);
                if (functions.has(name)) {
                    throw new Error(`函数${name}不支持作为后缀调用`);
                }
            }

            throw new Error(`无法识别的字符: "${char}"`);
        }
        return tokens;
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

        // 表达式级逗号仅在函数实参外启用；实参内仍用 separator 切分
        let arglistEnabled = true;

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
                case 'number':
                case 'string_literal':
                case 'date_literal':
                case 'duration_literal':
                    // 这些都是叶子节点
                    return createNode(value, [], type);
                    
                case 'delimiter':
                    if (value === '(') {
                        // 括号内恢复表达式级逗号，以支持 f((1,2 > max))
                        const prevArglistEnabled = arglistEnabled;
                        arglistEnabled = true;
                        try {
                            const expr = parseExpression(0);
                            expectDelimiter(')');
                            return expr;
                        } finally {
                            arglistEnabled = prevArglistEnabled;
                        }
                    }
                    throw new Error(`意外的定界符: ${value}`);
                    
                default:
                    throw new Error(`意外的token类型: ${type}`);
            }
        }

        function parseFunctionCall(funcName) {
            expectDelimiter('(');
            const args = [];
            const prevArglistEnabled = arglistEnabled;
            arglistEnabled = false;
            
            try {
                while (current < tokens.length) {
                    if (tokens[current][0] === 'delimiter' && 
                        tokens[current][1] === ')') {
                        break;
                    }
                    
                    args.push(parseExpression(0));

                    if (current >= tokens.length) {
                        break;
                    }

                    if (tokens[current][0] === 'separator') {
                        current++;
                        continue;
                    }

                    if (tokens[current][0] === 'delimiter' && tokens[current][1] === ')') {
                        break;
                    }

                    throw new Error(`函数 "${funcName}" 的参数需要用逗号分隔`);
                }
                
                expectDelimiter(')');
            } finally {
                arglistEnabled = prevArglistEnabled;
            }
            return createNode(funcName, args, 'function');
        }

        // 表达式级逗号扁平化
        function flattenArglist(node) {
            return node.type === 'arglist' ? node.args : [node];
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

            // 表达式级逗号（多参收集）与比较/管道同级
            const COMMA_PRECEDENCE = 1;

            let left = parseUnary(precedence);
            
            while (current < tokens.length) {
                const [type, value] = tokens[current];
                
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

                // 表达式级逗号：a,b > f ≡ f(a,b)；单独的 arglist 在求值时报错
                if (arglistEnabled && type === 'separator' && value === ',') {
                    if (COMMA_PRECEDENCE < precedence) {
                        break;
                    }
                    current++;
                    const right = parseExpression(COMMA_PRECEDENCE + 1);
                    left = createNode(',', [...flattenArglist(left), right], 'arglist');
                    continue;
                }

                // 函数管道 token：xxx > f ≡ f(xxx)，优先级与比较相同（1）
                if (type === 'pipe') {
                    const PIPE_PRECEDENCE = 1;
                    if (PIPE_PRECEDENCE < precedence) {
                        break;
                    }
                    current++;
                    if (!FUNCTIONS[value]) {
                        throw new Error(`函数 "${value}" 不存在`);
                    }
                    left = createNode(value, flattenArglist(left), 'function');
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
                if (op.isCompoundAssignment && left.type !== 'identifier') {
                    throw new Error('赋值运算符左侧必须是变量名');
                }
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
        function evaluateDurationPartValue(part) {
            if (part.valueType === 'number') {
                return Number(part.value);
            }

            if (part.valueType === 'expression') {
                if (part.value.includes('#')) {
                    throw new Error('时长字面量括号内不支持嵌套 # 表达式');
                }
                const innerTokens = tokenize(part.value, operators, functions, constants);
                const innerAst = buildAst(innerTokens, operators, functions);
                const innerResult = evaluate(innerAst, operators, functions, constants, depth + 1);
                const numeric = Number(Utils.convertTypes(innerResult, 'number'));
                if (!Number.isFinite(numeric)) {
                    throw new Error(`时长字面量单位 "${part.unit}" 的值必须是有限数字`);
                }
                return numeric;
            }

            throw new Error(`未知的时长值类型: ${part.valueType}`);
        }

        function buildDatestampFromDurationLiteral(durationLiteral) {
            const values = {
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            };

            for (const part of durationLiteral.parts) {
                const numericValue = evaluateDurationPartValue(part);
                if ((part.unit === 'years' || part.unit === 'months') && !Number.isInteger(numericValue)) {
                    throw new Error(`${part.unit === 'years' ? '年' : '月'}必须是整数`);
                }
                values[part.unit] += numericValue;
            }

            const totalMilliseconds = ((((values.weeks * 7 + values.days) * 24 + values.hours) * 60 + values.minutes) * 60 + values.seconds) * 1000 + values.milliseconds;
            return new Datestamp(values.years, values.months, totalMilliseconds);
        }

        if (depth > MAX_DEPTH) {
            throw new Error('表达式求值嵌套深度过大，可能存在无限递归');
        }

        if (!node) return 0;

        // 逗号列表仅作管道多参收集，不能独立求值
        if (node.type === 'arglist') {
            throw new Error('逗号表达式仅用于函数管道');
        }

        // 处理数字字面量
        if (node.type === 'number') {
            return new CCnode(node.value);
        }

        // 处理字符串字面量
        if (node.type === 'string_literal') {
            return node.value;
        }

        // 处理日期字面量
        if (node.type === 'date_literal') {
            return node.value;
        }

        if (node.type === 'duration_literal') {
            return buildDatestampFromDurationLiteral(node.value);
        }

        // 处理标识符节点 - 赋值表达式左侧的变量名
        if (node.type === 'identifier') {
            if (variables.has(node.value)) {
                return variables.get(node.value);
            }
            throw new Error(`变量 "${node.value}" 未定义`);
        }
                

        // 处理常量
        if (node.type === 'constant') {
            return CONSTANTS[node.value];
        }

        // 处理运算符
        if (node.type === 'operator') {
            const op = OPERATORS[node.value];
            
            // 处理赋值运算符
            if (op.isCompoundAssignment) {
                const [left, right] = node.args;
                // 检查参数数量
                if (op.args !== undefined && node.args.length !== op.args) {
                    throw new Error(`运算符 "${node.value}" 需要 ${op.args} 个参数，但得到了 ${node.args.length} 个`);
                }
                // 检查左侧是否为标识符类型的节点
                if (left.type !== 'identifier') {
                    throw new Error('不能赋值常量，赋值运算符左侧必须是变量名');
                }
                
                // 检查变量名是否合法
               checkVariableName(left.value, operators, functions, constants);
                
                // 计算右侧表达式
                const rightValue = evaluate(right, operators, functions, constants, depth + 1);
                
                // 对于等号，直接赋值
                if (node.value === '=') {
                    // 普通赋值
                    variables.set(left.value, rightValue);
                    let strRightValue = Utils.convertTypes(rightValue, 'string');

                    if (left.value === 'x' || left.value === 'X') {
                        addWarning(`将无法使用${left.value}作为乘法符号`);
                    }
                    
                    if (left.value.startsWith('$')){
                        addInfo(`默认变量: ${left.value} = ${strRightValue}`)
                    }
                    else{
                        addInfo(`自定义变量: ${left.value} = ${strRightValue}`)
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

            // 非赋值运算符：递归计算参数
            const args = node.args.map(arg => evaluate(arg, operators, functions, constants, depth + 1));

            // 检查参数数量
            if (op.args !== undefined && args.length !== op.args) {
                throw new Error(`运算符 "${node.value}" 需要 ${op.args} 个参数，但得到了 ${args.length} 个`);
            }

            // 其他运算符的处理
            const convertedArgs = convertArguments(args, op.argTypes);

            return op.func(...convertedArgs);
        }

        // 处理函数
        if (node.type === 'function') {
            const func = FUNCTIONS[node.value];
            const args = node.args.map(arg => evaluate(arg, operators, functions, constants, depth + 1));

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
    function formatOutput(result) {

        // console.log('result的类型: ', typeof result);
        const display = Utils.formatToDisplayString(result);

        if(display.info)
        {
            addInfo(display.info);
        }

        if(display.warning)
        {
            addWarning(display.warning);
        }

        return { 
            value: display.value,
            info: infos.length > 0 ? infos : null, 
            warning: warnings.length > 0 ? warnings : null
        };
    }

    // 6. 返回公共API
    return {
        calculate(expr, options = {}) {
            // TODO: 添加超时处理
            clearMessages(); // 清除之前的消息

            // 检查是否自定义函数定义语句（getCustomFunctionName 非 null 即为定义）
            const funcName = getCustomFunctionName(expr);
            if (funcName) {
                return {
                    value: `𝒇: ${funcName} `,
                    customFunc: true,
                    customName: funcName,
                };
            }

            // 检查是否自定义常数定义语句（getCustomConstantName 非 null 即为定义）
            const constantName = getCustomConstantName(expr);
            if (constantName) {
                return {
                    value: `𝑪: ${constantName} `,
                    customConstant: true,
                    customName: constantName,
                };
            }

            // 这里是集合，而不是字典了
            const operators = new Set(Object.keys(OPERATORS));
            const functions = new Set(Object.keys(FUNCTIONS));
            const constants = new Set(Object.keys(CONSTANTS));

            const { expr: processedExpr, operators: sortedOperators } = preprocess(expr, operators, functions, constants);
            const tokens = tokenize(processedExpr, sortedOperators, functions, constants);
            const ast = buildAst(tokens, operators, functions);
            const result = evaluate(ast, operators, functions, constants);
            // raw 模式：返回未格式化的原始值（用于自定义函数 lambda 内层求值，保证类型一致）
            if (options && options.raw) {
                return {
                    value: result,
                    info: infos.length > 0 ? infos : null,
                    warning: warnings.length > 0 ? warnings : null
                };
            }
            // 添加格式化处理
            const exprResult = formatOutput(result);
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

        hasVariable(name) {
            return variables.has(name);
        },

        getVariable(name) {
            return variables.get(name);
        },

        setVariable(name, value) {
            variables.set(name, value);
        },

        deleteVariable(name) {
            variables.delete(name);
        },

        // 修改清除方法，同时清除变量和消息
        clearAllCache() {
            variables.clear();  // 清除所有变量
            clearMessages();    // 清除所有消息
        },

        // 获取自定义函数列表
        getCustomFunctions() {
            return getCustomFunctions();
        },

        // 删除自定义函数
        removeCustomFunction(funcName) {
            return removeCustomFunction(funcName, FUNCTIONS);
        },

        // 清除所有自定义函数
        clearCustomFunctions() {
            clearCustomFunctions(FUNCTIONS);
        }
    };
})();


// 导出
export { Calculator, OPERATORS, FUNCTIONS, CONSTANTS };
export { isFunctionDefinition, isConstantDefinition, updateCustomFromStorage };

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

// node .\calculator.js
// TEST('0xff');
// Calculator.calculate('1 + 2');

// TEST('#0.5w');
// TEST('{1 2 3}');
// TEST('{1; 2; 3}');
// TEST('{[1 2 3], [4 5 6]}');
// TEST('{[1 2 3]; [4 5 6]}');
// TEST('{1 2 3;4 5 6;7 8 9}');

// TEST('{{1 2 3}}');
// TEST('{{1; 2; 3}}');
// TEST('{{1 2 3};{4 5 6};{7 8 9}}');

// TEST('[1, 2].T @ [3, 4]');

