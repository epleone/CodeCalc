// 添加cc临时变量字典
const ccVariables = new Map();

const DURATION_UNIT_DEFINITIONS = Object.freeze([
    ['milliseconds', 'milliseconds'],
    ['millisecond', 'milliseconds'],
    ['minutes', 'minutes'],
    ['minute', 'minutes'],
    ['months', 'months'],
    ['month', 'months'],
    ['seconds', 'seconds'],
    ['second', 'seconds'],
    ['years', 'years'],
    ['year', 'years'],
    ['weeks', 'weeks'],
    ['week', 'weeks'],
    ['hours', 'hours'],
    ['hour', 'hours'],
    ['days', 'days'],
    ['day', 'days'],
    ['mm', 'minutes'],
    ['ms', 'milliseconds'],
    ['y', 'years'],
    ['m', 'months'],
    ['w', 'weeks'],
    ['d', 'days'],
    ['h', 'hours'],
    ['s', 'seconds']
]);

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DURATION_UNIT_PATTERN = DURATION_UNIT_DEFINITIONS
    .map(([unitText]) => unitText)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');


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
        '×': 'x',
        '✕': 'x',
        '✖': 'x',
        '·': '*',
        '÷': '/',
        '：': ':',
        '。': '.',
        '！': '!',
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
        // 允许时长字面量里的 #(... )d / #(... )hour 等写法
        { pattern: /\)(?![xX])(?!(?:ms|mm|[ymwdhs])(?![a-zA-Z])|(?:years?|months?|weeks?|days?|hours?|minutes?|seconds?|milliseconds?)\b)[\w\d]/, message: '右括号后直接跟标识符' },
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
    if (!/^[a-zA-Z_$][a-zA-Z0-9_]*$/.test(varName)) {
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

// 将矩阵表达式中的参数加上逗号`<1 2 3>` --> `<1,2,3>`
function processMatrixArgs(expr) {
    // console.log('processMatrixArgs expr0:', expr);

    // 能够使用空格分割的情况，只有变量，数字和负号
    if (/^[a-zA-Z_\d\s.-]*$/.test(expr)) {
        expr = expr.trim();

        // 将开头的负号后面的空格去掉
        expr = expr.replace(/^(-+)\s+/g, '$1');

        // 检查负号后面是否存在空格，有就报错
        if(/-\s+/.test(expr)) {
            throw new Error('无法区分符号-，负号前需加空格，减号用逗号分隔向量');
        }
        
        // 去掉首尾的空格, 中间的空格并转成逗号
        expr = expr.replace(/\s+/g, ',');
    }

    // console.log('processMatrixArgs expr1:', expr);

    // 不可以有分号;
    if(/;/.test(expr)) {
        throw new Error('非法的分号分割符，使用逗号或者空格分割');
    }

    //如果有空格，没有逗号，则报错
    if(/\s+/.test(expr) && !/,/.test(expr)) {
        throw new Error('矩阵中的元素无法被空格分割，请使用逗号分割符');
    }

    // 检查是否存在被空格分隔的数字
    if(/\d\s+\d/.test(expr)) {
        throw new Error('矩阵中存在被空格分隔的数字，请使用逗号分割符');
    }   
    
    return expr;
}

// 处理中括号 [..., ..., ...] , 转换为向量/矩阵
function processBrackets(expr) {

    // console.log('Vector expr0:', expr);

    // 检查是否存在嵌套超过2层的中括号
    // if(/\[[^]]*\[[^]]*\[/.test(expr)) {
    //     throw new Error('不支持嵌套超过2层的中括号');
    // }

    // 检查中括号`[]`是否存在嵌套中括号 `[]`, 比如 `[..., [...], ...]`

    if(/\[[^\[\]]*\[/.test(expr)) {
        throw new Error('向量[..., ...]不支持向量作为参数');
    }

    if(/\[[^[\]]*;[^[\]]*\]/.test(expr)) {
        throw new Error('向量[..., ...]中不能使用分号;作为分隔符');
    }
    
    // 匹配 [1 2 3] 或 [a b c] 或 [[1 2 3] [4 5 6]] 或 [[a b c] [d e f]]
    const matrixIRegex = /\[([^\]]+)\]/g;


    // 匹配[...], 内部的表达式送给processMatrix1处理
    expr = expr.replace(matrixIRegex, (match, content) => {
        return 'Vector(' + processMatrixArgs(content) + ')';
    });


    // console.log('Vector expr1:', expr);

    // console.log('---------------------------------------------------');
    // throw new Error('test');

    return expr;
}


// 处理大括号 {...; ...; ...} , 转换为矩阵
// { M, M, M }: 矩阵向右堆叠, 也就是列向量拼接 matrix('col', M, M, M)
// { M; M; M }: 矩阵向下堆叠, 也就是行向量拼接 matrix('row', M, M, M)

function processBraces(expr) {
    const matrixRegex = /\{([^{}]+)\}/g;    // 匹配大括号 { ... }

    const RowVecRegex = /\⌈([^\⌈⌋]+)\⌋/g;  // 匹配⌈ ... ⌋ , 作为中间行向量

    // console.log('matrix expr1:', expr);

    // 格式验证, 无法处理三维矩阵
    // 检查是否存在嵌套超过2层的大括号
    if(/\{[^{}]*\{[^{}]*\{/.test(expr)) {
        throw new Error('不支持嵌套超过2层的矩阵');
    }


    // 第一步, {..., { * }, ..., { * }, ...}  --> {..., ⌈ * ⌋, ..., ⌈ * ⌋, ...}
    // 匹配两层大括号包裹的模式, 将内部的{ * }转成向行列量 ⌈ * ⌋
    const matrixRegex_2brackets = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    expr = expr.replace(matrixRegex_2brackets, (match, content) => {
        // 将内部的{ * }转成向行列量 ⌈ * ⌋
        const ctt = match.slice(1, -1).replace(/\s*\{/g, '\⌈').replace(/\}\s*/g, '\⌋');
        return "{" + ctt + "}";
    });

    // console.log('matrix expr2:', expr);

    // 单层大括号 {1 2 3}  --> {⌈1 2 3⌋}

    expr = expr.replace(matrixRegex, (match, content) => {
        // 如果不存在 ⌈ ⌋ ; , 则添加 {⌈ ... ⌋}
        if(!/[⌈⌋;,]/.test(content)) {
            return '{⌈' + content + '⌋}';
        }
        return match;
    });
    
    // 第二步, 处理分号 

    // 先处理⌈...⌋ 中有分号的情况。 { {1;2;3} } --> { ⌈1;2;3⌋ }
    // 先将 ⌈...⌋ 中的分号转成符号 ¦
    expr = expr.replace(RowVecRegex, (match, content) => {
        return '⌈' + content.replace(/;/g, '¦') + '⌋';
    });
    // console.log('matrix expr3:', expr);

    // 如果存在分号，将内部不正式的元素转成行向量 {...;1 2 3; ...}  --> {...;⌈1 2 3⌋; ...}
    expr = expr.replace(matrixRegex, (match, content) => {
        // 如果存在分号，将内部不正式的元素转成向量
        if(match.includes(';')){
            const ctt = match.slice(1, -1);
            // 将ctt安装分号分割成数组
            const arr0 = ctt.split(';').map(item => {
                const trimmed = item.trim();
                if(trimmed.startsWith('Vector(') || trimmed.startsWith('⌈')) {
                    return trimmed;
                }
                return '⌈' + trimmed + '⌋';
            });

            return '{' + arr0.join(';') + '}';

        }
        // 不包含分号，则直接返回
        return match;
    });

    // console.log('matrix expr4:', expr);

    // 先将 ⌈...⌋ 中的符号 ¦ 转成分号;
    expr = expr.replace(RowVecRegex, (match, content) => {
        return '⌈' + content.replace(/¦/g, ';') + '⌋';
    });
    // console.log('matrix expr5:', expr);
    
    
    // 处理⌈...⌋ 中的空格分隔
    expr = expr.replace(RowVecRegex, (match, content) => {
        if(content.includes(';')){
            return 'RowMatrix(' + processMatrixArgs(content.replace(/\s*;\s*/g, ',')) + ')';
        }else{
            return 'ColMatrix(' + processMatrixArgs(content.replace(/\s*,\s*/g, ',')) + ')';
        }
    });
    // console.log('matrix expr6:', expr);

    // throw new Error('test');


    // 第五步, 处理矩阵
    expr = expr.replace(matrixRegex, (match, content) => {
        //如果存在分号，则转成矩阵
        if(match.includes(';')){
            return 'RowMatrix(' + match.slice(1, -1).replace(/\s*;\s*/g, ',') + ')';
        }else{
            return 'ColMatrix(' + match.slice(1, -1).replace(/\s*,\s*/g, ',') + ')';
        }
    }); 

    // console.log('matrix expr7:', expr);

    // throw new Error('test');

    return expr;
}

function processMatrix(expr) {
    // 先处理中括号
    expr = processBrackets(expr);

    // 再处理大括号
    expr = processBraces(expr);

    return expr;
}

function rewriteLegacyHashTimestamp(expr) {
    const LEGACY_HASH_TIMESTAMP_REGEX = new RegExp(
        `#\\s*(-?\\d+)(?!\\s*(?:${DURATION_UNIT_PATTERN}|:|\\())(?=\\s*(?:$|[+\\-*/%(),<>=&|^!]|>))`,
        'gi'
    );
    return expr.replace(LEGACY_HASH_TIMESTAMP_REGEX, (_, rawMs) => `(#${rawMs}ms >#@)`);
}

export {
    ccVariables,
    DURATION_UNIT_DEFINITIONS,
    normalizeSymbols,
    checkParentheses,
    checkVariableName,
    processMatrix,
    rewriteLegacyHashTimestamp
}
