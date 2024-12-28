import { TYPE } from './types.js';

// 常数定义
export const CONSTANTS = {
    'PI': 3.14159265359,
    'e': 2.71828182846
};

// 定界符定义
export const DELIMITERS = {
    '(': { description: '左括号' },
    ')': { description: '右括号' }
};

// 分隔符定义
export const SEPARATORS = {
    ',': { description: '参数分隔符' }
};

// 操作符定义
export const OPERATORS = {
    // 基本算术运算符
    '+': {
        precedence: 1,
        args: 2,
        func: (x, y) => x + y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '加法'
    },
    '-': {
        precedence: 1,
        args: 2,
        func: (x, y) => x - y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '减法'
    },
    '*': {
        precedence: 2,
        args: 2,
        func: (x, y) => x * y,
        position: 'infix',
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '乘法'
    },
    '/': {
        precedence: 2,
        args: 2,
        func: (x, y) => y !== 0 ? x / y : Infinity,
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

    // 进制转换运算符
    '0b': {
        precedence: 4,
        args: 1,
        func: x => parseInt(x, 2),
        position: 'prefix',
        types: [TYPE.STRING],
        description: '二进制转十进制'
    },
    '0o': {
        precedence: 4,
        args: 1,
        func: x => parseInt(x, 8),
        position: 'prefix',
        types: [TYPE.STRING],
        description: '八进制转十进制'
    },
    '0x': {
        precedence: 4,
        args: 1,
        func: x => parseInt(x, 16),
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
    }
};

// 函数定义
export const FUNCTIONS = {
    // 类型转换函数
    'str': {
        func: x => x,
        args: 1,
        types: [TYPE.STRING],
        description: '转换为字符串'
    },
    'num': {
        func: x => x,
        args: 1,
        types: [TYPE.NUMBER],
        description: '转换为数字'
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
    'sqrt': {
        func: Math.sqrt,
        args: 1,
        types: [TYPE.NUMBER],
        description: '平方根'
    },
    'pow': {
        func: Math.pow,
        args: 2,
        types: [TYPE.NUMBER, TYPE.NUMBER],
        description: '幂函数'
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
}; 