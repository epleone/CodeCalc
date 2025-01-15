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


// 写一个函数，处理 #1y2m3w4d5h6mm7s8ms 这种类型, 转换成 #timestamp(1, 2, 3, 4, 5, 6, 7, 8)
// 年匹配 y,year,years
// 月匹配 m,month,months
// 周匹配 w,week,weeks
// 天匹配 d,day,days
// 小时匹配 h,hour,hours
// 分钟匹配 mm,minute,minutes
// 秒匹配 s,second,seconds
// 毫秒匹配 ms,millisecond,milliseconds

function processTimestamp(expr) {
    // 定义时间单位的匹配模式，按顺序排列
    const patterns = [
        { units: ['years?', 'y(?![a-z])'], index: 0 },  // 年
        { units: ['months?', 'm(?![a-z])'], index: 1 },  // 月
        { units: ['weeks?', 'w(?![a-z])'], index: 2 },  // 周
        { units: ['days?', 'd(?![a-z])'], index: 3 },  // 天
        { units: ['hours?', 'h(?![a-z])'], index: 4 },  // 小时
        { units: ['minutes?', 'mm'], index: 5 }, // 分钟
        { units: ['seconds?', 's(?![a-z])'], index: 6 },  // 秒
        { units: ['milliseconds?', 'ms'], index: 7 }  // 毫秒
    ];

    // 在 patterns 定义后添加一个新的辅助函数
    function extractParenthesesContent(str) {
        if (!str.startsWith('(')) return null;
        let count = 0;
        let end = -1;
        
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '(') count++;
            if (str[i] === ')') count--;
            if (count === 0) {
                end = i;
                break;
            }
        }
        
        if (end === -1) return null;
        return {
            content: str.substring(1, end),
            length: end + 1
        };
    }

    // 修改 processSingleTimestamp 函数中的相关部分
    function processSingleTimestamp(expr) {
        if (expr === '#') return expr;
        if (/^#\s*$/.test(expr)) return expr;

        // 移除开头的#
        let remaining = expr.slice(1).trim();
        const values = new Array(8).fill('0');

        // 依次处理每个时间单位
        for (const { units, index } of patterns) {
            remaining = remaining.trim();
            
            // 先检查是否有括号
            if (remaining.startsWith('(')) {
                const result = extractParenthesesContent(remaining);
                if (result) {
                    // 检查括号后是否跟着正确的单位
                    const unitPattern = new RegExp(`^\\s*(${units.join('|')})`, 'i');
                    const afterParens = remaining.substring(result.length).trim();
                    const unitMatch = afterParens.match(unitPattern);
                    
                    if (unitMatch) {
                        values[index] = result.content; // 保存括号内的表达式
                        remaining = afterParens.substring(unitMatch[0].length);
                        continue;
                    }
                }
            }

            // 如果没有括号，使用原来的匹配逻辑
            const pattern = new RegExp(
                `^(-?\\d*\\.?\\d+)\\s*(${units.join('|')})`,
                'i'
            );
            const match = remaining.match(pattern);
            
            if (match) {
                values[index] = match[1];
                remaining = remaining.slice(match[0].length);
            }
        }

        // 如果还有剩余内容，报错
        remaining = remaining.trim();
        if (remaining) {
            throw new Error(`无法识别的时间格式: ${remaining}`);
        }

        return `timestamp(${values.join(', ')})`;
    }

    // 主处理逻辑：找到所有的时间戳表达式并处理
    let result = '';
    let pos = 0;
    
    while (pos < expr.length) {
        // 检查是否是运算符后面跟着的#
        if (pos > 0 && expr[pos] === '#' && /[+\-*/>=<]/.test(expr[pos - 1])) {
            result += expr[pos];
            pos++;
            continue;
        }

        if (expr[pos] === '#') {
            // 找到这个时间戳表达式的结束位置
            let end = pos + 1;
            let foundNumber = false;
            let inWhitespace = false;  // 标记是否在空白区域
            let parenCount = 0;  // 添加括号计数
            
            while (end < expr.length) {
                const char = expr[end];
                
                // 处理括号
                if (char === '(') {
                    parenCount++;
                    end++;
                    continue;
                }
                if (char === ')') {
                    parenCount--;
                    end++;
                    continue;
                }
                
                // 如果在括号内，继续处理直到括号闭合
                if (parenCount > 0) {
                    end++;
                    continue;
                }
                
                // 处理空白字符
                if (/\s/.test(char)) {
                    inWhitespace = true;
                    end++;
                    continue;
                }
                
                // 如果之前有空白，现在遇到了非法字符，就停止
                if (inWhitespace && !/[a-zA-Z0-9\-.(]/.test(char)) {
                    break;
                }
                
                // 如果遇到运算符
                if (/[+*/>=<]|#/.test(char)) {
                    break;
                }
                
                // 特殊处理减号：只有在已经找到数字且不在括号内时才视为运算符
                if (char === '-' && foundNumber && parenCount === 0) {
                    break;
                }
                
                // 记录是否找到数字
                if (/\d/.test(char)) {
                    foundNumber = true;
                    inWhitespace = false;  // 重置空白标记
                }
                
                end++;
            }
            
            // 处理这个时间戳表达式
            const timeExpr = expr.substring(pos, end);
            result += processSingleTimestamp(timeExpr);
            pos = end;
        } else {
            result += expr[pos];
            pos++;
        }
    }

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


// 一个测试函数，测试processTimestamp
function testProcessTimestamp() {
    const tests = [
        '#1y2m3w4d5h6mm7s8ms',
        '#1year2month3week4day5hour6minute7second8millisecond',
        '#5y', '#10m', '#2w', '#3d', '#12h', '#30mm', '#45s', '#100ms',

        '#1.5y', '#2.5m', '#0.5w', '#1.5d',

        // 测试空格
        '# 1y 2m 3w', 
        
        // 测试组合
        '#1y3d', '#2m12h', '#1w30mm', '#5d100ms',
        
        // 多个表达式混合
        '#1y2m3w4d5h6mm7s8ms + #1y2m3w',
        '#2m12h + #1y2m3w',
        '#2m + #1d',
        '#2m - #1d', // 会吞掉负号，能否支持负号#-1d？
        '@now + #1y2m3w >@',
        '@now - #1y2m3w >#w',
        '#-1.5d',

        //添加括号测试
        '#(1+2)y(3x4)m(5-2w)w',

        // 空白报错
        '#y','#1ym','#1y2mw',

        // 括号测试
        '#(1+2)y(3*4)m(5-2)w',
        '#(x+1)y(y*2)m',
        '#(a+b)d(c*d)h',
        '#(1.5*2)y(3/2)m',
        '#(foo())y(bar())m',
        
        // 混合测试
        '#(1+2)y3m(4-1)w',
        '#1y(2*3)m4d',
    ];
    
    // 执行测试并输出结果
    tests.forEach((expr, index) => {
        try {
            const result = processTimestamp(expr);
            console.log(`Test ${index + 1} passed:`, {
                input: expr,
                output: result
            });
        } catch (error) {
            console.error(`Test ${index + 1} failed:`, {
                input: expr,
                error: error.message
            });
        }
    });
}

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    testProcessTimestamp();
}