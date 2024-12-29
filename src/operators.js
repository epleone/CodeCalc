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
            if (typeof x === 'string' || typeof y === 'string') {
                return x.toString() + y.toString();
            }
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) + BigInt(y);
            }
            if (typeof x !== typeof y) {
                throw new Error(`参数类型不一致: ${typeof x} 和 ${typeof y}`);
            }
            return x + y;
        },
        acceptAny: true, // 支持任何类型输入，不转换类型
        position: 'infix',
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
        description: '乘法'
    },
    '/': {
        precedence: 2,
        args: 2,
        func: (x, y) => y !== 0 ? x / y : (() => { throw new Error('除数不能为零'); })(),
        position: 'infix',
        description: '除法'
    },

    // 高级算术运算符
    '//': {
        precedence: 2,
        args: 2,
        func: (x, y) => Math.floor(x / y),
        position: 'infix',
        description: '整除'
    },
    '%': {
        precedence: 2,
        args: 2,
        func: (x, y) => x % y,
        position: 'infix',
        description: '取模'
    },
    '**': {
        precedence: 3,
        args: 2,
        func: (x, y) => Math.pow(x, y),
        position: 'infix',
        description: '幂运算'
    },

    // 一元运算符
    '#': {
        precedence: 3,
        args: 1,
        func: x => x + 1,
        position: 'prefix',
        description: '前缀自增'
    },
    '°': {
        precedence: 3,
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        position: 'postfix',
        description: '角度转弧度'
    },
    'unary-': {
        precedence: 4,
        args: 1,
        func: x => -x,
        position: 'prefix',
        description: '一元负号'
    },
    // 位运算符
    '&': {
        precedence: 1,
        args: 2,
        func: (x, y) => x & y,
        position: 'infix',
        description: '按位与'
    },
    '|': {
        precedence: 1,
        args: 2,
        func: (x, y) => x | y,
        position: 'infix',
        description: '按位或'
    },
    '^': {
        precedence: 1,
        args: 2,
        func: (x, y) => x ^ y,
        position: 'infix',
        description: '按位异或'
    },
    '~': {
        precedence: 4,
        args: 1,
        func: x => ~x,
        position: 'prefix',
        description: '按位取反'
    },
    '<<': {
        precedence: 2,
        args: 2,
        func: (x, y) => x << y,
        position: 'infix',
        description: '左移'
    },
    '>>': {
        precedence: 2,
        args: 2,
        func: (x, y) => x >> y,
        position: 'infix',
        description: '右移'
    },
    '>>>': {
        precedence: 2,
        args: 2,
        func: (x, y) => x >>> y,
        position: 'infix',
        description: '无符号右移'
    },

    // 赋值运算符组
    '=': {
        precedence: 0,
        args: 2,
        func: (a, b) => b,
        position: 'infix',
        acceptAny: true,
        description: '赋值'
    },
    '+=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Types.toNumber(oldValue) + Types.toNumber(rightValue),
        position: 'infix',
        description: '加法赋值',
        isCompoundAssignment: true
    },
    '-=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Types.toNumber(oldValue) - Types.toNumber(rightValue),
        position: 'infix',
        description: '减法赋值',
        isCompoundAssignment: true
    },
    '*=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Types.toNumber(oldValue) * Types.toNumber(rightValue),
        position: 'infix',
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
        acceptAny: true,
        description: '转换为字符串'
    },
    'num': {
        func: x => x,
        args: 1,
        description: '转换为数字'
    },

    // 数学函数
    'max': {
        func: Math.max,
        args: -1,
        description: '求最大值'
    },
    'min': {
        func: Math.min,
        args: -1,
        description: '求最小值'
    },
    'log': {
        func: Math.log10,
        args: 1,
        description: '以10为底的对数'
    },
    'ln': {
        func: Math.log,
        args: 1,
        description: '自然对数'
    },
    'exp': {
        func: Math.exp,
        args: 1,
        description: 'e的指数'
    },

    // 三角函数
    'sin': {
        func: Math.sin,
        args: 1,
        description: '正弦函数'
    },
    'cos': {
        func: Math.cos,
        args: 1,
        description: '余弦函数'
    },
    'tan': {
        func: Math.tan,
        args: 1,
        description: '正切函数'
    },
    'asin': {
        func: Math.asin,
        args: 1,
        description: '反正弦函数'
    },
    'acos': {
        func: Math.acos,
        args: 1,
        description: '反余弦函数'
    },
    'atan': {
        func: Math.atan,
        args: 1,
        description: '反正切函数'
    },

    // 双曲函数
    'sinh': {
        func: Math.sinh,
        args: 1,
        description: '双曲正弦'
    },
    'cosh': {
        func: Math.cosh,
        args: 1,
        description: '双曲余弦'
    },
    'tanh': {
        func: Math.tanh,
        args: 1,
        description: '双曲正切'
    },
    'sqrt': {
        func: x => Math.sqrt(x),
        args: 1,
        description: '平方根'
    },
    'pow': {
        func: (x, y) => Math.pow(x, y),
        args: 2,
        description: '幂函数'
    },
    'abs': {
        args: 1,
        func: x => Math.abs(x),
        asProperty: true,
        description: '绝对值'
    },
    'deg': {
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        asProperty: true,
        description: '度数转换为弧度'
    },
    'rad': {
        args: 1,
        func: x => x * 180 / CONSTANTS.PI,
        asProperty: true,
        description: '弧度转换为度数'
    },

    // 字符串函数
    'upper': {
        args: 1,
        func: x => x.toUpperCase(),
        acceptAny: true,
        asProperty: true,
        description: '转换为大写'
    },
    'lower': {
        args: 1,
        func: x => x.toLowerCase(),
        acceptAny: true,
        asProperty: true,
        description: '转换为小写'
    },
    'length': {
        args: 1,
        func: x => x.length,
        acceptAny: true,
        asProperty: true,
        description: '字符串长度'
    },
    // 进制转换函数
    'bin': {
        args: 1,
        func: x => "0b" + BigInt(x).toString(2),
        asProperty: true,
        description: '十进制转二进制'
    },
    'oct': {
        args: 1,
        func: x => "0o" + BigInt(x).toString(8),
        asProperty: true,
        description: '十进制转八进制'
    },
    'hex': {
        args: 1,
        func: x => "0x" + BigInt(x).toString(16),
        asProperty: true,
        description: '十进制转十六进制'
    }
};

// 暴露到全局作用域
window.OPERATORS = OPERATORS;
window.FUNCTIONS = FUNCTIONS;
window.CONSTANTS = CONSTANTS;
window.DELIMITERS = DELIMITERS;
window.SEPARATORS = SEPARATORS; 