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
        func: (x, y) => x + y
    },
    '-': {
        precedence: 1,
        args: 2,
        func: (x, y) => x - y
    },
    '*': {
        precedence: 2,
        args: 2,
        func: (x, y) => x * y
    },
    '/': {
        precedence: 2,
        args: 2,
        func: (x, y) => y !== 0 ? x / y : Infinity
    },
    '#': {
        precedence: 3,
        args: 1,
        func: x => x + 1
    },
    '°': {
        precedence: 3,
        args: 1,
        func: x => x * CONSTANTS.PI / 180
    }
};

// 函数定义
const FUNCTIONS = {
    'max': {
        args: -1,  // -1 表示可变参数
        func: Math.max
    },
    'min': {
        args: -1,  // -1 表示可变参数
        func: Math.min
    },
    'deg': {
        args: 1,
        func: x => x * CONSTANTS.PI / 180
    },
    'rad': {
        args: 1,
        func: x => x * 180 / CONSTANTS.PI
    }
};

export { CONSTANTS, OPERATORS, FUNCTIONS }; 