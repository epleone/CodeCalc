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
        position: 'infix'  // 中缀运算符
    },
    '-': {
        precedence: 1,
        args: 2,
        func: (x, y) => x - y,
        position: 'infix'  // 中缀运算符
    },
    '*': {
        precedence: 2,
        args: 2,
        func: (x, y) => x * y,
        position: 'infix'  // 中缀运算符
    },
    '/': {
        precedence: 2,
        args: 2,
        func: (x, y) => y !== 0 ? x / y : Infinity,
        position: 'infix'  // 中缀运算符
    },
    '#': {
        precedence: 3,
        args: 1,
        func: x => x + 1,
        position: 'prefix'  // 后缀运算符
    },
    '°': {
        precedence: 3,
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        position: 'postfix'  // 后缀运算符
    },
    'unary-': {  // 一元负号
        precedence: 4,
        args: 1,
        func: x => -x,
        position: 'prefix'  // 前缀运算符
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
    'deg': {
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        asProperty: true  // 标记可以作为属性调用
    },
    'rad': {
        args: 1,
        func: x => x * 180 / CONSTANTS.PI,
        asProperty: true
    }
};

export { CONSTANTS, OPERATORS, FUNCTIONS }; 