
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
function checkVariableName(expr) {
    // 修改正则表达式，只匹配单个等号的赋值
    // 使用负向前瞻确保等号前面不是其它赋值运算符
    const assignmentRegex = /([^=+\-*/%&|^<>!~]+?)(?<![\+\-\*\/%&\|\^<>!~])\s*=/g;
    let match;
    
    while ((match = assignmentRegex.exec(expr)) !== null) {
        const varName = match[1].trim();  // 去除前后空格
        
        // 检查是否是合法的变量名格式
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
            if (/\s/.test(varName)) {
                throw new Error(`变量名 "${varName}" 不能包含空格`);
            }
            throw new Error(`变量名 "${varName}" 格式不正确，只能包含字母、数字和下划线，且不以数字开头`);
        }
        
        // 修改检查的前缀
        if (varName.startsWith('_cc_')) {
            throw new Error(`变量名不能以 "_cc_" 开头，这是系统保留的前缀`);
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
        const constName = `_cc_str_i${stringConstantCounter++}`;
        
        // 将字符串内容保存到变量字典中
        // 处理转义字符
        const processedContent = content.replace(/\\(['"\\])/g, '$1');
        ccVariables.set(constName, processedContent);
        
        return constName;
    });

    // 检查是否有未闭合的字符串
    const unclosedQuoteRegex = /(['"])[^'"]*$/;
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
            date = new Date(now.toISOString().split('T')[0] + 'T00:00:00');
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
            date = new Date(now.toISOString().split('T')[0] + 'T' + dateString);
            break;
        case 'HH:mm':
            date = new Date(now.toISOString().split('T')[0] + 'T' + dateString + ':00');
            break;
        default:
            return null;
    }

    return isNaN(date.getTime()) ? null : date;
}

// 处理日期, 保存到变量字典中
function processDate(expr) {
    // 添加日期常量计数器
    let dateConstantCounter = 0;

    // 匹配日期格式
    const datePatterns = [
        { regex: /#\s*(\d{4}-\d{1,2}-\d{1,2}\s+\d{2}:\d{2}:\d{2})/, format: 'YYYY-MM-DD HH:mm:ss' },
        { regex: /#\s*(\d{4}-\d{1,2}-\d{1,2}\s+\d{2}:\d{2})/, format: 'YYYY-MM-DD HH:mm' },
        { regex: /#\s*(\d{4}-\d{1,2}-\d{1,2})/, format: 'YYYY-MM-DD' },
        { regex: /#\s*(\d{1,2}-\d{1,2}\s+\d{2}:\d{2}:\d{2})/, format: 'MM-DD HH:mm:ss' },
        { regex: /#\s*(\d{1,2}-\d{1,2}\s+\d{2}:\d{2})/, format: 'MM-DD HH:mm' },
        { regex: /#\s*(\d{4}-\d{2})/, format: 'YYYY-MM' },
        { regex: /#\s*(\d{1,2}-\d{1,2})/, format: 'MM-DD' },
        { regex: /#\s*(\d{4})/, format: 'YYYY' },
        { regex: /#\s*(\d{2}:\d{2}:\d{2})/, format: 'HH:mm:ss' },
        { regex: /#\s*(\d{2}:\d{2})/, format: 'HH:mm' },
        { regex: /#\s*now/, format: 'now' },
        { regex: /#\s*today/, format: 'today' },
    ];

    // 继续处理直到没有更多匹配
    let lastExpr;
    do {
        lastExpr = expr;
        // 遍历所有模式并替换为日期常量标识符
        for (const { regex, format } of datePatterns) {
            const match = regex.exec(expr);
            if (match) {
                const [fullMatch, dateString] = match;
                const date = parseDate(dateString, format);
                if (date) {
                    // 生成日期常量标识符
                    const constName = `_cc_date_i${dateConstantCounter++}`;
                    // 将时间戳保存到变量字典中
                    ccVariables.set(constName, date.getTime());
                    // 只替换当前匹配到的日期
                    expr = expr.substring(0, match.index) + 
                           constName + 
                           expr.substring(match.index + fullMatch.length);
                    break; // 找到一个匹配后跳出当前循环，重新开始搜索
                }
            }
        }
    } while (expr !== lastExpr); // 当没有任何改变时停止循环

    return expr;
}

 // 处理时间间隔
 function processDuration(expr) {
    const TIME_UNITS = {
        SECOND: 1000,
        MINUTE: 1000 * 60,
        HOUR: 1000 * 60 * 60,
        DAY: 1000 * 60 * 60 * 24,
        WEEK: 1000 * 60 * 60 * 24 * 7,
    };

    // 定义时间单位格式，年和月不支持，因为定义是模糊的
    const DURATION_PATTERNS = [
        { 
            regex: /#\s*(\d+)\s*w\b/, 
            format: 'week',
            toMs: value => BigInt(value) * BigInt(TIME_UNITS.WEEK)
        },
        { 
            regex: /#\s*(\d+)\s*d\b/, 
            format: 'day',
            toMs: value => BigInt(value) * BigInt(TIME_UNITS.DAY)
        },
        { 
            regex: /#\s*(\d+)\s*h\b/, 
            format: 'hour',
            toMs: value => BigInt(value) * BigInt(TIME_UNITS.HOUR)
        },
        { 
            regex: /#\s*(\d+)\s*m\b/, 
            format: 'minute',
            toMs: value => BigInt(value) * BigInt(TIME_UNITS.MINUTE)
        },
        { 
            regex: /#\s*(\d+)\s*s\b/, 
            format: 'second',
            toMs: value => BigInt(value) * BigInt(TIME_UNITS.SECOND)
        },
        { 
            regex: /#\s*(\d+)\s*ms\b/, 
            format: 'millisecond',
            toMs: value => value
        }
    ];

    let durationConstantCounter = 0;

    // 处理单个匹配
    function processMatch(match, pattern) {
        const [fullMatch, value] = match;
        const timeValue = pattern.toMs(parseInt(value));

        const constName = `_cc_duration_i${durationConstantCounter++}`;
        ccVariables.set(constName, timeValue);
        
        return {
            fullMatch,
            constName
        };
    }

    // 替换表达式中的匹配
    function replaceMatch(expr, matchInfo, matchIndex) {
        return expr.substring(0, matchIndex) + 
               matchInfo.constName + 
               expr.substring(matchIndex + matchInfo.fullMatch.length);
    }

    // 主处理循环
    let lastExpr;
    do {
        lastExpr = expr;
        
        for (const pattern of DURATION_PATTERNS) {
            const match = pattern.regex.exec(expr);
            if (!match) continue;

            const matchInfo = processMatch(match, pattern);
            expr = replaceMatch(expr, matchInfo, match.index);
            break; // 找到一个匹配后重新开始搜索
        }
    } while (expr !== lastExpr);

    return expr;
}

export {
    ccVariables,
    normalizeSymbols,
    checkParentheses,
    checkVariableName,
    processStringLiterals,
    processDate,
    processDuration
}
