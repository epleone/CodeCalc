import { Utils, Datestamp } from './utils.js';

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
        '；': ';',
        '’': "'",
        '【': '[',
        '】': ']',
        '「': '{',
        '」': '}',
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
        // { pattern: /\(\s*\)(?!\s*[.,)\]}])/, message: '独立的空括号对' }
    ];
    
    for (const {pattern, message} of invalidPatterns) {
        if (pattern.test(noStrings)) {
            throw new Error(`错误: ${message}`);
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
        // console.log('输入:', timeStr);

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

        // console.log('输出:', finalResult);
        return finalResult;
    }

    // 用正则表达式将 `>#` 替换为 `>timestamp`
    expr = expr.replace(/>\s*#/g, '>timestamp');

    const timeStrs = expr.split('#');
    // console.log('timeStrs:', timeStrs);

    let result = timeStrs[0];
    for(let i = 1; i < timeStrs.length; i++){
        // console.log('输入:', timeStrs[i]);
        const normalized = normalizeTimeString(timeStrs[i]);
        // console.log('Normalize 输出:', normalized);
        result += parseTimeString(normalized);
    }

    // 将 `>timestamp` 替换回 `>#`  
    result = result.replace(/>timestamp/g, '>#');
    return result;
}


// 处理列向量
// 将表达式中的`[1 2 3]` 转换成 `ColVector(1, 2, 3)`
function processColVector(expr) {
    // console.log('vector expr1:', expr);

    // TODO: 支持变量[a -b 3] 这种情况
    // 匹配向量格式 [1 2 3] 或 [a b c], 处理空格、负号和变量名
    const vectorRegex = /\[([a-zA-Z_\d\s-]+)\]/g;

    // 将空格转成逗号
    expr = expr.replace(vectorRegex, (match, content) => {
        // 检查负号后面是否存在空格，除非是第一个元素，否则报错
        if(/-\s+/.test(match) && !/\[\s*-/.test(match)) {
            throw new Error('无法区分符号-，负号前需加空格，减号用逗号分隔向量');
        }
        
        // 去掉首尾的大括号以及周围的空格, 中间的空格并转成逗号
        let vecStr= match
                    .replace(/\[\s*/g, '')
                    .replace(/\s*\]/g, '')
                    .replace(/-\s*/g, '-') // 前面已经检查过了
                    .replace(/\s+/g, ',');
        return 'ColVector(' + vecStr + ')';
    });
    
    // console.log('vector expr2:', expr);

    // 检查是否出现连续 `[[` 或 `]]` 的情况
    if(/\[\s*\[/.test(expr) || /\]\s*\]/.test(expr)) {
        throw new Error('非法矩阵输入, 出现连续的`[[`或`]]`');
    }

    // 继续匹配向量
    const vectorRegex2 = /\[([^\]]+)\]/g;
    expr = expr.replace(vectorRegex2, (match, content) => {
        // 不可以有分号;
        if(/;/.test(match)) {
            throw new Error('向量不可用分号分割符，使用逗号或者空格分割');
        }
        
        if(/\d\s+\d/.test(content)) {
            throw new Error('非纯数字情况下, 向量只能使用逗号分割符');
        }

        // 将开头的[和结尾的]去掉
        return 'ColVector(' + match.slice(1, -1) + ')';
    });

    // console.log('vector expr3:', expr);

    return expr;
}


// 处理行向量
// 将表达式中的`<1 2 3>` 转换成 `RowVector(1, 2, 3)`
function processRowVector(expr) {
    // console.log('vector expr1:', expr);

    // 匹配向量格式 <1 2 3>, 处理只有空格和负号的情况
    const vectorRegex = /\<([a-zA-Z_\d\s-]+)\>/g;
    
    // 将空格转成逗号
    expr = expr.replace(vectorRegex, (match, content) => {
        // 检查负号后面是否存在空格，如果存在则报错
        if(/-\s+/.test(match) && !/\<\s*-/.test(match)) {
            throw new Error('无法区分符号-，负号前需加空格，减号用逗号分隔向量');
        }

        // 去掉首尾的尖括号以及周围的空格, 中间的空格并转成逗号
        let vecStr= match
                    .replace(/\<\s*/g, '')
                    .replace(/\s*\>/g, '')
                    .replace(/-\s*/g, '-') // 负号前面得有空格，否则会被当成减号? 目前是通过前面空格来控制负号还是减号
                    .replace(/\s+/g, ',');
        return 'RowVector(' + vecStr + ')';
    });
    
    // console.log('vector expr2:', expr);

    // 检查是否出现连续 `<<` 或 `>>` 的情况
    if(/\<\s*\</.test(expr) || /\>\s*\>/.test(expr)) {
        // TODO: 可能会和{ 1<<2 , 1 >>2 } 这种情况冲突， 无法处理位运算了
        throw new Error('非法矩阵输入, 出现连续的`<<`或`>>`');
    }

    // 继续匹配向量
    const vectorRegex2 = /\<([^\>]+)\>/g;
    expr = expr.replace(vectorRegex2, (match, content) => {
        // 不可以有分号;
        if(/;/.test(match)) {
            throw new Error('向量不可用分号分割符，使用逗号或者空格分割');
        }
        
        if(/\d\s+\d/.test(content)) {
            throw new Error('非纯数字情况下, 向量只能使用逗号分割符');
        }

        // 将开头的<和结尾的>去掉
        return 'RowVector(' + match.slice(1, -1) + ')';
    });

    // console.log('vector expr3:', expr);

    return expr;
}


function processMatrix(expr) {
    // console.log('matrix expr1:', expr);

    // 格式验证, 无法处理三维矩阵
    // 检查是否存在嵌套超过2层的大括号
    if(/\{[^{}]*\{[^{}]*\{/.test(expr)) {
        throw new Error('不支持嵌套超过2层的矩阵');
    }
    
    // TODO:列向量用 [] , 行向量(内部概念)用 < >

    // 第一步, {..., { * }, ..., { * }, ...}  --> {..., < * >, ..., < * >, ...}
    // 匹配两层大括号包裹的模式
    const matrixRegex_2brackets = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    expr = expr.replace(matrixRegex_2brackets, (match, content) => {
        // 将内部的{ * }转成向行列量 < * >
        const ctt = match.slice(1, -1).replace(/\s*\{/g, '\<').replace(/\}\s*/g, '\>');
        return "{" + ctt + "}";
    });

    // console.log('matrix expr2:', expr);
    

    // 第二步，判断是否是行向量。是的话，转成 --> < * >
    const matrixRegex = /\{([^{}]+)\}/g;
    //如果内部没有[ ], 没有 <> 没有; 就转成行向量
    expr = expr.replace(matrixRegex, (match, content) => {
        if(!content.match(/[\[\];\<\>]/)) {
            return '{<' + content + '>}';
        }
        return match;
    });

    // console.log('matrix expr3:', expr);

    // TODO： 分号处理需要考虑到变量，变量的话就是转置。 单元素矩阵转置？ 数字返回就好了？
    // 第三步, 如果存在分号，将内部不正式的元素转成向量 {...;1 2 3; ...}  --> {...;<1 2 3>; ...}
    expr = expr.replace(matrixRegex, (match, content) => {

        // 如果存在分号，将内部不正式的元素转成向量
        if(match.includes(';')){
            const ctt = match.slice(1, -1);
            // 将ctt安装分号分割成数组
            const arr0 = ctt.split(';').map(item => '<' + item.trim() + '>');

            // 分号`;`本质上是转置的语法糖

            //  对于只分割了一个元素, {1;2;3}, {a;a;a}   --> {<a>.T,<a>.T,<a>.T}
            // 只有一层< ... >, 且只有一个元素， 为了适配变量 {a;a;a}，需要调用转置
            const arr1 = arr0.map(item => {
                if(item.match(/^<.*>$/) && !item.match(/[,\s]/) ){
                    return item + '.T';
                }
                return item;
            });


            // 数字情况
            // {{1,2,3}; {4,5,6}}  --> { <<1,2,3>>, <<4,5,6>> }
            // 遍历arr1, 如果外部有两层 << ... >> ，则将其转成列向量 [ ... ]
            const arr2 = arr1.map(item => {
                if(item.match(/^<<.*>>$/)){
                    return '[' + item.slice(2, -2) + ']';
                }
                return item;
            });


            // {[1,2,3]; [4,5,6]}  --> {<[1,2,3]>,<[4,5,6]>}
            // 遍历arr2, 如果外部有 <[ ... ]> ，则将其转成列向量 < ... >
            
            const arr3 = arr2.map(item => {
                if(item.match(/^<\[.*\]>$/)){
                    return '<' + item.slice(2, -2) + '>';
                }
                return item;
            });

            // 将数组转成矩阵
            return '{' + arr3.join(',') + '}';
        }

        // 不包含分号，则直接返回
        return match;
    });

    // console.log('matrix expr4:', expr);

    // {1;1} --> {<1>.T,<1>.T} --> {[1, 1]}
    // 如果表达中存在>.T, 则转成矩阵
    expr = expr.replace(matrixRegex, (match, content) => {
        if(content.match(/>.T/)) {
            
            const ctt = match.slice(1, -1);
            // 将ctt安装分号分割成数组
            const arr0 = ctt.split(',').map(item => {
                // 去除开头的 < 和后面的 >.T
                if (item.trim().startsWith('<') && item.trim().endsWith('>.T')) {
                    return item.trim().slice(1, -3);
                }
                return item.trim();
            });

            return 'ColVector2(' + arr0.join(',') + ')';
        }

        return match;
    });

    // console.log('matrix expr5:', expr);

    // console.log('---------------------------------------------------');
    // throw new Error('test');

    // 第四步, 处理列向量
    expr = processColVector(expr);
    // console.log('matrix expr5:', expr);

    // 第五步, 处理行向量
    expr = processRowVector(expr);
    // console.log('matrix expr6:', expr);

    // 第六步, 处理矩阵
    expr = expr.replace(matrixRegex, (match, content) => {
        return 'matrix(' + match.slice(1, -1) + ')';
    }); 

    // console.log('matrix expr7:', expr);

    // console.log('---------------------------------------------------');
    // throw new Error('test');

    return expr;
}

export {
    ccVariables,
    normalizeSymbols,
    checkParentheses,
    checkVariableName,
    processStringLiterals,
    processDate,
    processTimestamp,
    processMatrix
}
