import { Datestamp } from './utils.js';

// 添加cc临时变量字典
const ccVariables = new Map();


// 添加全角符号替换函数
function normalizeSymbols(expr) {
    // 定义替换映射
    const symbolMap = {
        '（': '(',
        '）': ')',
        '，': ',',
        '”': '"',
        '’': "'",
        '【': '[',
        '】': ']',
        '《': '<',
        '》': '>',
        '＋': '+',
        '－': '-',
        '＝': '=',
        '÷': '/',
        '。': '.',
        '［': '[',
        '］': ']',
        '｛': '{',
        '｝': '}',
        '１': '1',
        '２': '2',
        '３': '3',
        '４': '4',
        '５': '5',
        '６': '6',
        '７': '7',
        '８': '8',
        '９': '9',
        '０': '0'
    };

    // 创建正则表达式匹配所有需要替换的符号
    const pattern = new RegExp(Object.keys(symbolMap).join('|'), 'g');
    
    // 执行替换
    const normalized = expr.replace(pattern, match => {
        const replacement = symbolMap[match];
        if (replacement) {
            return replacement;
        }
        return match;
    });

    return normalized;
}

// 检查括号匹配
function checkParentheses(expr, MAX_DEPTH = 1000) {
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
function checkVariableName(varName, operators, functions, constants) {
    // 检查是否是合法的变量名格式
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
        if (/\s/.test(varName)) {
            throw new Error(`变量名 "${varName}" 不能包含空格`);
        }
        throw new Error(`变量名 "${varName}" 格式不正确，只能包含字母、数字和下划线，且不以数字开头`);
    }
    
    // 检查是否以系统保留前缀开头
    if (varName.startsWith('_cc_')) {
        throw new Error(`变量名不能以 "_cc_" 开头，这是系统保留的前缀`);
    }

    // 检查是否与运算符冲突
        if (operators.hasOwnProperty(varName)) {
        throw new Error(`变量名 "${varName}" 与运算符冲突`);
    }
    
    // 检查是否与函数名冲突
    if (functions.hasOwnProperty(varName)) {
        throw new Error(`变量名 "${varName}" 与函数名冲突`);
    }
    
    // 检查是否与常量冲突
    if (constants.hasOwnProperty(varName)) {
        throw new Error(`变量名 "${varName}" 与常量冲突`);
    }
    
    // 检查是否是保留字
    const reservedWords = ['if', 'else', 'true', 'false', 'null', 'undefined'];
    if (reservedWords.includes(varName)) {
        throw new Error(`变量名 "${varName}" 是保留字`);
    }
}

// 处理字符串字面量
function processStringLiterals(expr) {
    // 将计数器移到函数内部
    let stringConstantCounter = 0;

    // 先处理 str(xxx) 格式
    const strFunctionRegex = /str\s*\(((?:[^)(]|\([^)(]*\))*)\)/g;
    let processed = expr.replace(strFunctionRegex, (match, content) => {
        const constName = `_cc_str_i${stringConstantCounter++}`;
        // 注意：这里不需要处理转义字符，因为内容将被直接作为字符串
        ccVariables.set(constName, content.trim());
        return constName;
    });

    // 匹配字符串字面量的正则表达式，添加对反引号的支持
    const stringLiteralRegex = /(['"`])((?:\\.|[^\\])*?)\1/g;

    // 再处理普通字符串字面量
    processed = processed.replace(stringLiteralRegex, (match, quote, content) => {
        const constName = `_cc_str_i${stringConstantCounter++}`;
        // 处理转义字符，添加对反引号的支持
        const processedContent = content.replace(/\\(['"\\`])/g, '$1');
        ccVariables.set(constName, processedContent);
        return constName;
    });

    // 检查是否有未闭合的字符串，添加对反引号的检查
    const unclosedQuoteRegex = /['"`][^'"`]*$/;
    if (unclosedQuoteRegex.test(processed)) {
        throw new Error('未闭合的字符串字面量');
    }

    return processed;
}

// 辅助函数：根据格式解析日期字符串
function parseDate(dateString, format) {
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
            dateString = dateString.replace(/(\d{1,2})-(\d{1,2})/, (match, m, d) => {
                return `${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            });
            date = new Date(now.getFullYear() + '-' + dateString + 'T00:00:00');
            break;
        case 'YYYY':
            date = new Date(dateString + '-01-01T00:00:00');
            break;
        case 'HH:mm:ss':
            {
                const [h, m, s] = dateString.split(':').map(Number);
                date = new Date(0);
                date.setUTCHours(h, m, s);
                return new Datestamp(0, 0, date.getTime()); // 转换为时间戳并返回
            }
            break;
        case 'HH:mm':
            {
                const [h, m] = dateString.split(':').map(Number);
                date = new Date(0);
                date.setUTCHours(h, m, 0);
                return new Datestamp(0, 0, date.getTime()); // 转换为时间戳并返回
            }
            break;
        default:
            return null;
    }

    return isNaN(date.getTime()) ? null : date;
}

// 处理日期, 保存到变量字典中
function processDate(expr) {
    let dateConstantCounter = 0;

    // 修改日期格式的正则表达式，使用更严格的匹配
    const datePatterns = [
        // 先匹配最长的格式
        { 
            regex: /(@)\s*(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/,
            format: 'YYYY-MM-DD HH:mm:ss',
            extract: m => `${m[2]}-${m[3].padStart(2,'0')}-${m[4].padStart(2,'0')} ${m[5]}:${m[6]}:${m[7]}`
        },
        { 
            regex: /(@)\s*(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})/,
            format: 'YYYY-MM-DD HH:mm',
            extract: m => `${m[2]}-${m[3].padStart(2,'0')}-${m[4].padStart(2,'0')} ${m[5]}:${m[6]}`
        },
        { 
            regex: /(@)\s*(\d{4})-(\d{1,2})-(\d{1,2})/,
            format: 'YYYY-MM-DD',
            extract: m => `${m[2]}-${m[3].padStart(2,'0')}-${m[4].padStart(2,'0')}`
        },
        { 
            regex: /(@)\s*(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/,
            format: 'MM-DD HH:mm:ss',
            extract: m => `${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')} ${m[4]}:${m[5]}:${m[6]}`
        },
        { 
            regex: /(@)\s*(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})/,
            format: 'MM-DD HH:mm',
            extract: m => `${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')} ${m[4]}:${m[5]}`
        },
        { 
            regex: /(@)\s*(\d{4})-(\d{1,2})/,
            format: 'YYYY-MM',
            extract: m => `${m[2]}-${m[3].padStart(2,'0')}`
        },
        { 
            regex: /(#)\s*(\d{1,2}):(\d{1,2}):(\d{1,2})/,
            format: 'HH:mm:ss',
            extract: m => `${m[2].padStart(2,'0')}:${m[3].padStart(2,'0')}:${m[4].padStart(2,'0')}`
        },
        { 
            regex: /(#)\s*(\d{1,2}):(\d{1,2})/,
            format: 'HH:mm',
            extract: m => `${m[2].padStart(2,'0')}:${m[3].padStart(2,'0')}`
        },
        { 
            regex: /(@)\s*(\d{1,2})-(\d{1,2})/,
            format: 'MM-DD',
            extract: m => `${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
        },
        { 
            regex: /(@)\s*(\d{4})/,
            format: 'YYYY',
            extract: m => m[2]
        },
        { 
            regex: /(@)\s*(now)/,
            format: 'now',
            extract: m => m[2]
        },
        { 
            regex: /(@)\s*(today)/,
            format: 'today',
            extract: m => m[2]
        }
    ];

    // 继续处理直到没有更多匹配
    let lastExpr;
    do {
        lastExpr = expr;
        // 遍历所有模式并替换为日期常量标识符
        for (const { regex, format, extract } of datePatterns) {
            const match = regex.exec(expr);
            if (match) {
                const dateString = extract(match);
                const date = parseDate(dateString, format);
                if (date) {
                    // 生成日期常量标识符
                    const constName = `_cc_date_i${dateConstantCounter++}`;
                    // 将date对象保存到变量字典中
                    ccVariables.set(constName, date);
                    // 替换整个匹配
                    expr = expr.substring(0, match.index) + 
                           constName + 
                           expr.substring(match.index + match[0].length);
                    break;
                }
            }
        }
    } while (expr !== lastExpr);

    return expr;
}


// 将语法糖`#1y2m3w4d5h6mm7s8ms` 转换成 `timestamp(1, 2, 3, 4, 5, 6, 7, 8)`
function processTimestamp(expr) {
    // 规范化时间字符串，给数字加括号
    function normalizeTimeString(timeStr) {
        // 定义所有可能的时间单位
        const units = [
            'years?', 'y',
            'months?', 'm',
            'weeks?', 'w',
            'days?', 'd',
            'hours?', 'h',
            'minutes?', 'mm',
            'seconds?', 's',
            'milliseconds?', 'ms'
        ].join('|');
    
        // 先将数字加上括号
        const pattern = new RegExp(`([+-]?\\d+\\.?\\d*)(${units})`, 'gi');
        const normalized = timeStr.replace(pattern, '($1)$2');

        return normalized;
    }

    /**
     * 用状态机FSM解析时间字符串, 格式为 (value)unit, 
     * 转成 timestamp(year, month, week, day, hour, minute, second, millisecond)
     * graph LR
     *   START -- "空格" --> START
     *   START -- "(" --> IN_BRACKETS
     *   START -- "其他字符" --> ERROR["抛出错误: 时间值必须在括号内"]
     *   
     *   IN_BRACKETS -- "(" --> IN_BRACKETS["嵌套括号"]
     *   IN_BRACKETS -- ")" --> EXPECT_UNIT["括号计数为0"]
     *   IN_BRACKETS -- ")" --> IN_BRACKETS["括号计数>0"]
     *   IN_BRACKETS -- "其他字符" --> IN_BRACKETS["累积currentValue"]
     *   
     *   EXPECT_UNIT -- "匹配到单位" --> EXPECT_OPEN["更新result和lastMatchedPos"]
     *   EXPECT_UNIT -- "未匹配到单位" --> EXPECT_OPEN
     *   
     *   EXPECT_OPEN -- "(" --> IN_BRACKETS
     *   EXPECT_OPEN -- "空格/+/-" --> EXPECT_OPEN
     *   EXPECT_OPEN -- "其他字符" --> END["结束解析"]
     */
    function parseTimeString(timeStr) {
        console.log('输入:', timeStr);

        if(timeStr.trim() === ''){
            return timeStr;
        }

        // 定义时间单位及其标识符
        const timeUnits = {
            years: ['y', 'year', 'years'],
            months: ['m', 'month', 'months'],
            weeks: ['w', 'week', 'weeks'],
            days: ['d', 'day', 'days'],
            hours: ['h', 'hour', 'hours'],
            minutes: ['mm', 'minute', 'minutes'],
            seconds: ['s', 'second', 'seconds'],
            milliseconds: ['ms', 'millisecond', 'milliseconds']
        };

        // 简化状态枚举
        const State = {
            START: 'START',           
            EXPECT_OPEN: 'EXPECT_OPEN',   
            IN_BRACKETS: 'IN_BRACKETS',    // 改名以更好地表达状态含义
            EXPECT_UNIT: 'EXPECT_UNIT',
            END: 'END'
        };

        let state = State.START;
        let pos = 0;
        let currentValue = '';
        let bracketCount = 0;
        let result = {
            years: '0',
            months: '0',
            weeks: '0',
            days: '0',
            hours: '0',
            minutes: '0',
            seconds: '0',
            milliseconds: '0'
        };
        let unitOrder = Object.keys(timeUnits);
        let currentUnitIndex = 0;
        let lastMatchedPos = 0;  // 记录最后一次成功匹配的位置

        // 首先定义一个按首字母分组的时间单位映射
        const unitsByFirstChar = {
            'y': ['years', 'year', 'y'],
            'm': ['milliseconds', 'millisecond', 'minutes', 'months', 'minute', 'month', 'mins', 'min', 'mm', 'ms', 'm'],
            'w': ['weeks', 'week', 'w'],
            'd': ['days', 'day', 'd'],
            'h': ['hours', 'hour', 'h'],
            's': ['seconds', 'second', 's']
        };

        while (pos < timeStr.length && state !== State.END) {
            const char = timeStr[pos];

            switch (state) {
                case State.START:
                    if (char === '(') {
                        state = State.IN_BRACKETS;
                        bracketCount = 1;
                        currentValue = '';
                    } else if (!char.trim()) {
                        // 允许空格，保持START状态
                    // 如果是unitsByFirstChar的单个字符，报错
                    } else if (unitsByFirstChar[char]) {
                        throw new Error(`时间单位:${timeStr.slice(pos, pos+5) + "..."} 没有值`);
                    } else {
                        // 必须匹配到括号，否则抛出错误
                        throw new Error('时间值必须在括号内');
                    }
                    break;

                case State.EXPECT_OPEN:
                    if (char === '(') {
                        state = State.IN_BRACKETS;
                        bracketCount = 1;
                        currentValue = '';
                    } else if (!char.trim() || char === '+' || char === '-') {
                        // 允许空格和运算符
                    } else {
                        if (lastMatchedPos === 0) {
                            lastMatchedPos = pos;
                        }
                        state = State.END;
                    }
                    break;

                case State.IN_BRACKETS:
                    if (char === '(') {
                        bracketCount++;
                        currentValue += char;
                    } else if (char === ')') {
                        bracketCount--;
                        if (bracketCount === 0) {
                            // 检查括号内是否为空
                            if (!currentValue.trim()) {
                                throw new Error('括号内不能为空');
                            }
                            state = State.EXPECT_UNIT;
                        } else {
                            currentValue += char;
                        }
                    } else {
                        currentValue += char;
                    }
                    break;

                case State.EXPECT_UNIT:
                    let unitStartPos = pos;    // 记录单位开始位置
                    let bestMatch = {
                        length: 0,
                        unitKey: '',
                        value: currentValue,
                        endPos: pos
                    };

                    // 修改匹配逻辑
                    const firstChar = timeStr[pos].toLowerCase();
                    if (unitsByFirstChar[firstChar]) {
                        // 获取这个首字母对应的所有可能单位
                        const possibleUnits = unitsByFirstChar[firstChar];
                        
                        // 尝试匹配每个可能的单位
                        for (const unit of possibleUnits) {
                            const potentialMatch = timeStr.slice(pos, pos + unit.length).toLowerCase();
                            if (potentialMatch === unit) {
                                // 找到匹配的单位，确定其对应的unitKey
                                let matchedUnitKey;
                                for (const [key, aliases] of Object.entries(timeUnits)) {
                                    if (aliases.includes(unit)) {
                                        // 检查这个单位是否已经被使用过
                                        if (result[key] !== '0') {
                                            throw new Error(`时间单位:${key} 重复赋值`);
                                        }
                                        matchedUnitKey = key;
                                        break;
                                    }
                                }
                                
                                if (matchedUnitKey) {
                                    bestMatch = {
                                        length: unit.length,
                                        unitKey: matchedUnitKey,
                                        value: currentValue,
                                        endPos: pos + unit.length - 1
                                    };
                                    pos += unit.length - 1;
                                    break;
                                }
                            }
                        }
                    }

                    // 如果找到匹配
                    if (bestMatch.length > 0) {
                        result[bestMatch.unitKey] = bestMatch.value;
                        pos = bestMatch.endPos;
                        lastMatchedPos = pos + 1;  // 恢复这行，更新到单位结束后的位置
                        currentUnitIndex = unitOrder.indexOf(bestMatch.unitKey) + 1;
                        state = State.EXPECT_OPEN;
                    } else {
                        pos = unitStartPos;
                        state = State.EXPECT_OPEN;
                    }
                    break;
            }
            pos++;
        }

        // 构建timestamp字符串
        const timestampArgs = [
            result.years || '0',
            result.months || '0',
            result.weeks || '0',
            result.days || '0',
            result.hours || '0',
            result.minutes || '0',
            result.seconds || '0',
            result.milliseconds || '0'
        ];

        let finalResult = `timestamp(${timestampArgs.join(', ')})`;
        
        // 如果还有未匹配的部分，直接拼接到结果后面
        if (lastMatchedPos < timeStr.length) {
            const remaining = timeStr.substring(lastMatchedPos).trim();
            if (remaining) {
                finalResult += ' ' + remaining;
            }
        }

        console.log('输出:', finalResult);
        return finalResult;
    }

    // 用正则表达式将 `>#` 替换为 `>timestamp`
    expr = expr.replace(/>\s*#/g, '>timestamp');

    const timeStrs = expr.split('#');
    console.log('timeStrs:', timeStrs);

    let result = timeStrs[0];
    for(let i = 1; i < timeStrs.length; i++){
        console.log('输入:', timeStrs[i]);
        const normalized = normalizeTimeString(timeStrs[i]);
        console.log('Normalize 输出:', normalized);
        result += parseTimeString(normalized);
    }

    // 将 `>timestamp` 替换回 `>#`  
    result = result.replace(/>timestamp/g, '>#');
    return result;
}




export {
    ccVariables,
    normalizeSymbols,
    checkParentheses,
    checkVariableName,
    processStringLiterals,
    processDate,
    processTimestamp
}
