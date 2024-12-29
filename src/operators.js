// 常数定义
const CONSTANTS = {
    'PI': Math.PI,
    'e': Math.E,
};

// 定界符定义
const DELIMITERS = {
    '(': { description: '左括号' },
    ')': { description: '右括号' }
};

// 分隔符定义
const SEPARATORS = {
    ',': { description: '参数分隔符' }
};

// 在 OPERATORS 定义之前添加辅助函数
function createAssignmentOperator(baseOp) {
    return {
        precedence: 1,
        args: 2,
        func: (a, b) => b,  // 赋值运算符的基本行为
        position: 'infix',
        types: [TYPE.ANY, TYPE.NUMBER],
        description: `${baseOp}赋值`,
        isAssignment: true,
        baseOp: baseOp
    };
}

// 操作符定义
const OPERATORS = {
    // 基本算术运算符
    '+': {
        precedence: 1,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) + BigInt(y);
            }
            return x + y;
        },
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '加法'
    },
    '-': {
        precedence: 1,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) - BigInt(y);
            }
            return x - y;
        },
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '减法'
    },
    '*': {
        precedence: 2,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) * BigInt(y);
            }
            return x * y;
        },
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '乘法'
    },
    '/': {
        precedence: 2,
        args: 2,
        func: (x, y) => y !== 0 ? x / y : (() => { throw new Error('除数不能为零'); })(),
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '除法'
    },

    // 高级算术运算符
    '//': {
        precedence: 2,
        args: 2,
        func: (x, y) => Math.floor(x / y),
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '整除'
    },
    '%': {
        precedence: 2,
        args: 2,
        func: (x, y) => x % y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '取模'
    },
    '**': {
        precedence: 3,
        args: 2,
        func: (x, y) => Math.pow(x, y),
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '幂运算'
    },

    // 一元运算符
    '#': {
        precedence: 3,
        args: 1,
        func: x => x + 1,
        position: 'prefix',
        types: [TYPE.NUMBER],
        description: '前缀自增'
    },
    '°': {
        precedence: 3,
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        position: 'postfix',
        types: [TYPE.NUMBER],
        description: '角度转弧度'
    },
    'unary-': {
        precedence: 4,
        args: 1,
        func: x => -x,
        position: 'prefix',
        types: [TYPE.NUMBER],
        description: '一元负号'
    },

    // 进制转换运算符，前缀运算符，不支持变量
    '0b': {
        precedence: 4,
        args: 1,
        func: x => BigInt(`0b${x}`),
        position: 'prefix',
        types: [TYPE.STRING],
        description: '二进制转十进制'
    },
    '0o': {
        precedence: 4,
        args: 1,
        func: x => BigInt(`0o${x}`),
        position: 'prefix',
        types: [TYPE.STRING],
        description: '八进制转十进制'
    },
    '0x': {
        precedence: 4,
        args: 1,
        func: x => BigInt(`0x${x}`), // 使用 BigInt 直接转换 16 进制，可以避免溢出
        position: 'prefix',
        types: [TYPE.STRING],
        description: '十六进制转十进制'
    },

    // 字符串运算符
    '+str': {
        precedence: 1,
        args: 2,
        func: (x, y) => x + y,
        position: 'infix',
        types: [TYPE.STRING, TYPE.STRING],
        description: '字符串连接'
    },

    // 位运算符
    '&': {
        precedence: 1,
        args: 2,
        func: (x, y) => x & y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '按位与'
    },
    '|': {
        precedence: 1,
        args: 2,
        func: (x, y) => x | y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '按位或'
    },
    '^': {
        precedence: 1,
        args: 2,
        func: (x, y) => x ^ y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '按位异或'
    },
    '~': {
        precedence: 4,
        args: 1,
        func: x => ~x,
        position: 'prefix',
        types: [TYPE.NUMBER],
        description: '按位取反'
    },
    '<<': {
        precedence: 2,
        args: 2,
        func: (x, y) => x << y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '左移'
    },
    '>>': {
        precedence: 2,
        args: 2,
        func: (x, y) => x >> y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '右移'
    },
    '>>>': {
        precedence: 2,
        args: 2,
        func: (x, y) => x >>> y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '无符号右移'
    },

    // 赋值运算符组
    '=': {
        precedence: 0,
        args: 2,
        func: (a, b) => b,
        position: 'infix',
        types: [TYPE.ANY, TYPE.ANY],
        description: '赋值'
    },
    '+=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Types.toNumber(oldValue) + Types.toNumber(rightValue),
        position: 'infix',
        types: [TYPE.ANY, TYPE.NUMBER],
        description: '加法赋值',
        isCompoundAssignment: true
    },
    '-=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Types.toNumber(oldValue) - Types.toNumber(rightValue),
        position: 'infix',
        types: [TYPE.ANY, TYPE.NUMBER],
        description: '减法赋值',
        isCompoundAssignment: true
    },
    '*=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Types.toNumber(oldValue) * Types.toNumber(rightValue),
        position: 'infix',
        types: [TYPE.ANY, TYPE.NUMBER],
        description: '乘法赋值',
        isCompoundAssignment: true
    },
    '/=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => {
            const divisor = Types.toNumber(rightValue);
            if (divisor === 0) {
                throw new Error('除数不能为零');
            }
            return Types.toNumber(oldValue) / divisor;
        },
        position: 'infix',
        types: [TYPE.ANY, TYPE.NUMBER],
        description: '除法赋值',
        isCompoundAssignment: true
    }
};

// 函数定义
const FUNCTIONS = {
    // 类型转换函数
    'str': {
        func: x => x,
        args: 1,
        types: [TYPE.STRING],
        description: '计算阶段会转换为字符串'
    },
    'num': {
        func: x => x,
        args: 1,
        types: [TYPE.NUMBER],
        description: '计算阶段会转换为数字'
    },

    // 数学函数
    'max': {
        func: Math.max,
        args: -1,
        types: [TYPE.NUMBER],
        description: '求最大值'
    },
    'min': {
        func: Math.min,
        args: -1,
        types: [TYPE.NUMBER],
        description: '求最小值'
    },
    'log': {
        func: Math.log10,
        args: 1,
        types: [TYPE.NUMBER],
        description: '以10为底的对数'
    },
    'ln': {
        func: Math.log,
        args: 1,
        types: [TYPE.NUMBER],
        description: '自然对数'
    },
    'exp': {
        func: Math.exp,
        args: 1,
        types: [TYPE.NUMBER],
        description: 'e的指数'
    },

    // 三角函数
    'sin': {
        func: Math.sin,
        args: 1,
        types: [TYPE.NUMBER],
        description: '正弦函数'
    },
    'cos': {
        func: Math.cos,
        args: 1,
        types: [TYPE.NUMBER],
        description: '余弦函数'
    },
    'tan': {
        func: Math.tan,
        args: 1,
        types: [TYPE.NUMBER],
        description: '正切函数'
    },
    'asin': {
        func: Math.asin,
        args: 1,
        types: [TYPE.NUMBER],
        description: '反正弦函数'
    },
    'acos': {
        func: Math.acos,
        args: 1,
        types: [TYPE.NUMBER],
        description: '反余弦函数'
    },
    'atan': {
        func: Math.atan,
        args: 1,
        types: [TYPE.NUMBER],
        description: '反正切函数'
    },

    // 双曲函数
    'sinh': {
        func: Math.sinh,
        args: 1,
        types: [TYPE.NUMBER],
        description: '双曲正弦'
    },
    'cosh': {
        func: Math.cosh,
        args: 1,
        types: [TYPE.NUMBER],
        description: '双曲余弦'
    },
    'tanh': {
        func: Math.tanh,
        args: 1,
        types: [TYPE.NUMBER],
        description: '双曲正切'
    },
    'sqrt': {
        func: x => Math.sqrt(x),
        args: 1,
        types: [TYPE.NUMBER],
        description: '平方根'
    },
    'pow': {
        func: (x, y) => Math.pow(x, y),
        args: 2,
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '幂函数'
    },
    'abs': {
        args: 1,
        func: x => Math.abs(x),
        types: [TYPE.NUMBER],
        asProperty: true,  // 标记可以作为属性调用
        description: '绝对值'
    },
    'deg': {
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        types: [TYPE.NUMBER],
        asProperty: true,  // 标记可以作为属性调用
        description: '度数转换为弧度'
    },
    'rad': {
        args: 1,
        func: x => x * 180 / CONSTANTS.PI,
        types: [TYPE.NUMBER],
        asProperty: true,
        description: '弧度转换为度数'
    },

    // 字符串函数
    'upper': {
        args: 1,
        func: x => x.toUpperCase(),
        types: [TYPE.VARIABLE],
        asProperty: true,
        description: '转换为大写'
    },
    'lower': {
        args: 1,
        func: x => x.toLowerCase(),
        types: [TYPE.VARIABLE],
        asProperty: true,
        description: '转换为小写'
    },
    'length': {
        args: 1,
        func: x => x.length,
        types: [TYPE.VARIABLE],
        asProperty: true,
        description: '字符串长度'
    },
    // 进制转换函数
    'bin': {
        args: 1,
        func: x => "0b" + BigInt(x).toString(2),
        types: [TYPE.NUMBER],
        asProperty: true,
        description: '十进制转二进制'
    },
    'oct': {
        args: 1,
        func: x => "0o" + BigInt(x).toString(8),
        types: [TYPE.NUMBER],
        asProperty: true,
        description: '十进制转八进制'
    },
    'hex': {
        args: 1,
        func: x => "0x" + BigInt(x).toString(16),
        types: [TYPE.NUMBER],
        asProperty: true,
        description: '十进制转十六进制'
    },
    // 进制转换函数，可能冲突，支持变量
    '0b': {
        args: 1,
        func: x => BigInt(`0b${x}`),
        types: [TYPE.STRING],
        description: '二进制转十进制'
    },
    '0o': {
        args: 1,
        func: x => BigInt(`0o${x}`),
        types: [TYPE.STRING],
        description: '八进制转十进制'
    },
    '0x': {
        args: 1,
        func: x => BigInt(`0x${x}`), // 避免溢出
        types: [TYPE.STRING],
        description: '十六进制转十进制'
    },
};

// 暴露到全局作用域
window.OPERATORS = OPERATORS;
window.FUNCTIONS = FUNCTIONS;
window.CONSTANTS = CONSTANTS;
window.DELIMITERS = DELIMITERS;
window.SEPARATORS = SEPARATORS; 