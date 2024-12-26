// 常数定义
const CONSTANTS = {
    'PI': 3.14159265359,
    'e': 2.71828182846
};

// 操作符定义
const OPERATORS = {
    '+': {
        precedence: 1,
        args: 2,
        func: (x, y) => x + y,
        description: '加法'
    },
    '-': {
        precedence: 1,
        args: 2,
        func: (x, y) => x - y,
        description: '减法'
    },
    '*': {
        precedence: 2,
        args: 2,
        func: (x, y) => x * y,
        description: '乘法'
    },
    '/': {
        precedence: 2,
        args: 2,
        func: (x, y) => y !== 0 ? x / y : Infinity,
        description: '除法'
    },
    '#': {
        precedence: 3,
        args: 1,
        func: x => x + 1,
        description: '后缀自增'
    },
    '°': {
        precedence: 3,
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        description: '角度转弧度'
    }
};

// 函数定义
const FUNCTIONS = {
    'max': {
        func: Math.max,
        description: '求最大值'
    },
    'min': {
        func: Math.min,
        description: '求最小值'
    },
    'deg': {
        func: x => x * CONSTANTS.PI / 180,
        description: '角度转弧度'
    },
    'rad': {
        func: x => x * 180 / CONSTANTS.PI,
        description: '弧度转角度'
    }
};

export { CONSTANTS, OPERATORS, FUNCTIONS }; 