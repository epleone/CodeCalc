// 常数定义
const CONSTANTS = {
    'PI': 3.14159265359, // Math.PI
    'e': 2.71828182846  // Math.E
};

// 操作符定义
const OPERATORS = {
    '+': {
        precedence: 1,
        args: 2,
        func: (x, y) => x + y,
        position: 'infix',
        type: 'operator'
    },
    '-': {
        precedence: 1,
        args: 2,
        func: (x, y) => x - y,
        position: 'infix',
        type: 'operator'
    },
    '*': {
        precedence: 2,
        args: 2,
        func: (x, y) => x * y,
        position: 'infix',
        type: 'operator'
    },
    '//': {
        precedence: 2,  // 与乘除法同级
        args: 2,
        func: (x, y) => Math.floor(x / y),
        position: 'infix',
        type: 'operator'
    },
    '%': {
        precedence: 2,  // 与乘除法同级
        args: 2,
        func: (x, y) => x % y,
        position: 'infix',
        type: 'operator'
    },
    '**': {
        precedence: 3,  // 比乘除法高一级
        args: 2,
        func: (x, y) => Math.pow(x, y),
        position: 'infix',
        type: 'operator'
    },
    '/': {
        precedence: 2,
        args: 2,
        func: (x, y) => y !== 0 ? x / y : Infinity,
        position: 'infix',
        type: 'operator'
    },
    '#': {
        precedence: 3,
        args: 1,
        func: x => x + 1,
        position: 'prefix',
        type: 'operator'
    },
    '°': {
        precedence: 3,
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        position: 'postfix',
        type: 'operator'
    },
    'unary-': {  // 一元负号
        precedence: 4,
        args: 1,
        func: x => -x,
        position: 'prefix',
        type: 'operator'
    },
    '0b': {
        precedence: 4,
        args: 1,
        func: x => parseInt(x, 2),  // 二进制转十进制
        position: 'prefix',
        description: '二进制转十进制',
        type: 'operator'
    },
    '0o': {
        precedence: 4,
        args: 1,
        func: x => parseInt(x, 8),  // 八进制转十进制
        position: 'prefix',
        description: '八进制转十进制',
        type: 'operator'
    },
    '0x': {
        precedence: 4,
        args: 1,
        func: x => parseInt(x, 16),  // 十六进制转十进制
        position: 'prefix',
        description: '十六进制转十进制',
        type: 'operator'
    },
    '(': {
        precedence: 0,
        type: 'delimiter'
    },
    ')': {
        precedence: 0,
        type: 'delimiter'
    },
    ',': {
        precedence: 0,
        type: 'separator'
    }
};

// 函数定义
const FUNCTIONS = {
    'max': {
        args: -1,
        func: Math.max
    },
    'min': {
        args: -1,
        func: Math.min
    },
    'log': {
        args: 1,
        func: x => Math.log10(x),
        description: '以10为底的对数'
    },
    'ln': {
        args: 1,
        func: x => Math.log(x),
        description: '自然对数(以e为底)'
    },
    'exp': {
        args: 1,
        func: x => Math.exp(x),
        description: 'e的指数'
    },
    'abs': {
        args: 1,
        func: x => Math.abs(x),
        asProperty: true,  // 标记可以作为属性调用
        description: '绝对值'
    },
    'deg': {
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        asProperty: true,  // 标记可以作为属性调用
        description: '度数转换为弧度'
    },
    'rad': {
        args: 1,
        func: x => x * 180 / CONSTANTS.PI,
        asProperty: true,
        description: '弧度转换为度数'
    },
    'sin': {
        args: 1,
        func: x => Math.sin(x),
        description: '正弦函数'
    },
    'cos': {
        args: 1,
        func: x => Math.cos(x),
        description: '余弦函数'
    },
    'tan': {
        args: 1,
        func: x => Math.tan(x),
        description: '正切函数'
    },
    'asin': {
        args: 1,
        func: x => Math.asin(x),
        description: '反正弦函数'
    },
    'acos': {
        args: 1,
        func: x => Math.acos(x),
        description: '反余弦函数'
    },
    'atan': {
        args: 1,
        func: x => Math.atan(x),
        description: '反正切函数'
    },
    'sinh': {
        args: 1,
        func: x => Math.sinh(x),
        description: '双曲正弦'
    },
    'cosh': {
        args: 1,
        func: x => Math.cosh(x),
        description: '双曲余弦'
    },
    'tanh': {
        args: 1,
        func: x => Math.tanh(x),
        description: '双曲正切'
    },
    'sqrt': {
        args: 1,
        func: x => Math.sqrt(x),
        description: '平方根'
    },
    'pow': {
        args: 2,
        func: (x, y) => Math.pow(x, y),
        description: '幂函数'
    }
};

export { CONSTANTS, OPERATORS, FUNCTIONS }; 