import Utils from './utils.js';

// 常数定义
export const CONSTANTS = {
    'π': Math.PI,
    'PI': Math.PI,
    'pi': Math.PI,
    'e': Math.E,
    'E': Math.E,
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
        precedence: 2,
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
        precedence: 2,
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
        precedence: 4,
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
        precedence: 4,
        args: 2,
        func: (x, y) => {
            if (y === 0 || y === 0n) {
                throw new Error('除数不能为零');
            }
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                let mod = BigInt(x) % BigInt(y);
                if (mod !== 0n) {
                    throw new Error('大数除法暂不支持, 请使用整除(//)运算符');
                }
                return BigInt(x) / BigInt(y);
            }
            return x / y;
        },
        position: 'infix',
        description: '除法'
    },

    // 高级算术运算符
    '//': {
        precedence: 4,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) / BigInt(y);
            }
            return Math.floor(x / y);
        },
        position: 'infix',
        description: '整除'
    },
    '%': {
        precedence: 4,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) % BigInt(y);
            }
            return x % y;
        },
        position: 'infix',
        description: '取模'
    },
    '**': {
        precedence: 7,
        args: 2,
        func: (x, y) => Math.pow(x.toString(), y.toString()),
        position: 'infix',
        description: '幂运算'
    },

    // 一元运算符
    '@': {
        precedence: 0,
        args: 1,
        func: ms =>  {
            const seconds = Math.floor((ms / 1000) % 60);
            const minutes = Math.floor((ms / (1000 * 60)) % 60);
            const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
            const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        
            return `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`;
        },
        position: 'postfix',
        description: '时间差可视化'
    },
    '@#': {
        precedence: 0,
        args: 1,
        func: x => {
            const date = new Date(x);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            
            return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
        },
        position: 'postfix',
        description: '日期可视化'
    },
    '@week': {
        precedence: 0,
        args: 1,
        func: ms => {
            const weeks = ms / (1000 * 60 * 60 * 24 * 7);
            return weeks.toFixed(2) + '周';
        },
        position: 'postfix',
        description: '时间差转成周数'
    },
    '@w': {
        alias: '@week',
        description: '时间差转成周数'
    },
    '@day': {
        precedence: 0,
        args: 1,
        func: ms => {
            const days = ms / (1000 * 60 * 60 * 24);
            return days.toFixed(2) + '天';
        },
        position: 'postfix',
        description: '时间差转成天数'
    },
    '@d': {
        alias: '@day',
        description: '时间差转成天数'
    },
    '@hour': {
        precedence: 0,
        args: 1,
        func: ms => {
            const hours = ms / (1000 * 60 * 60);
            return hours.toFixed(2) + '小时';
        },
        position: 'postfix',
        description: '时间差转成小时数'
    },
    '@h': {
        alias: '@hour',
        description: '时间差转成小时数'
    },
    '@minute': {
        precedence: 0,
        args: 1,
        func: ms => {
            const minutes = ms / (1000 * 60);
            return minutes.toFixed(2) + '分钟';
        },
        position: 'postfix',
        description: '时间差转成分钟数'
    },
    '@m': {
        alias: '@minute',
        description: '时间差转成分钟数'
    },
    '@second': {
        precedence: 0,
        args: 1,
        func: ms => {
            const seconds = ms / 1000;
            return seconds.toFixed(2) + '秒';
        },
        position: 'postfix',
        description: '时间差转成秒数'
    },
    '@s': {
        alias: '@second',
        description: '时间差转成秒数'
    },
    '°': {
        alias: '.deg',
        description: '角度转弧度'
    },
    'unary-': {
        precedence: 5,
        args: 1,
        func: x => -x,
        position: 'prefix',
        description: '负号'
    },
    'unary+': {
        precedence: 5,
        args: 1,
        func: x => +x,
        position: 'prefix',
        description: '正号'
    },
    // 位运算符
    '&': {
        precedence: 1,
        args: 2,
        func: (x, y) => x & y,
        position: 'infix',
        description: '按位与'
    },
    'and': {
        alias: '&',
        description: '按位与'
    },
    '|': {
        precedence: 1,
        args: 2,
        func: (x, y) => x | y,
        position: 'infix',
        description: '按位或'
    },
    'or': {
        alias: '|',
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
        precedence: 6,
        args: 1,
        func: x => ~x,
        position: 'prefix',
        description: '按位取反'
    },
    "not":{
        alias: '~',
        description: '按位取反'
    },
    '<<': {
        precedence: 3,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) << BigInt(y);
            }
            return x << y;
        },
        position: 'infix',
        description: '左移'
    },
    '>>': {
        precedence: 3,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) >> BigInt(y);
            }
            return x >> y;
        },
        position: 'infix',
        description: '右移'
    },
    '>>>': {
        precedence: 3,
        args: 2,
        func: (x, y) => {
            if (typeof x === 'bigint' || typeof y === 'bigint') {
                return BigInt(x) >>> BigInt(y);
            }
            return x >>> y;
        },
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
        isCompoundAssignment: true,
        description: '赋值'
    },
    '+=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Utils.toNumber(oldValue) + Utils.toNumber(rightValue),
        position: 'infix',
        description: '加法赋值',
        isCompoundAssignment: true
    },
    '-=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Utils.toNumber(oldValue) - Utils.toNumber(rightValue),
        position: 'infix',
        description: '减法赋值',
        isCompoundAssignment: true
    },
    '*=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => Utils.toNumber(oldValue) * Utils.toNumber(rightValue),
        position: 'infix',
        description: '乘法赋值',
        isCompoundAssignment: true
    },
    '/=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => {
            const divisor = Utils.toNumber(rightValue);
            if (divisor === 0) {
                throw new Error('除数不能为零');
            }
            return Utils.toNumber(oldValue) / divisor;
        },
        position: 'infix',
        description: '除法赋值',
        isCompoundAssignment: true
    },
    '&=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue & rightValue,
        position: 'infix',
        description: '按位与赋值',
        isCompoundAssignment: true
    },
    '|=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue | rightValue,
        position: 'infix',
        description: '按位或赋值',
        isCompoundAssignment: true
    },
    '^=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue ^ rightValue,
        position: 'infix',
        description: '按位异或赋值',
        isCompoundAssignment: true
    },
    '<<=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue << rightValue,
        position: 'infix',
        description: '左移赋值',
        isCompoundAssignment: true
    },
    '>>=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue >> rightValue,
        position: 'infix',
        description: '右移赋值',
        isCompoundAssignment: true
    },
    '>>>=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue >>> rightValue,
        position: 'infix',
        description: '无符号右移赋值',
        isCompoundAssignment: true
    },
};

// 函数定义
export const FUNCTIONS = {
    // 类型转换函数
    'str': {
        func: x => x.toString(),
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
    'lg': {
        func: x => {
            if (typeof x === 'bigint') {
                // 对于 BigInt,先转换为字符串,再转换为数字计算对数
                return Math.log10(Number(x.toString()));
            }
            return Math.log10(x);
        },
        args: 1,
        description: '以10为底的对数'
    },
    'lb': {
        func: x => {
            if (typeof x === 'bigint') {
                // 对于 BigInt,先转换为字符串,再转换为数字计算对数
                return Math.log2(Number(x.toString()));
            }
            return Math.log2(x);
        },
        args: 1,
        description: '以2为底的对数'
    },
    'log': {
        func: (x, y) => {
            if (x <= 0 || y <= 0) {
                throw new Error('对数底数和真数必须为正数');
            }

            if (typeof x === 'bigint' || typeof y === 'bigint') {
                // 对于 BigInt,先转换为字符串,再转换为数字计算对数
                return Math.log(Number(y.toString())) / Math.log(Number(x.toString()));
            }

            return Math.log(y) / Math.log(x);
        },
        args: 2,
        description: '以x为底的y对数'
    },
    'ln': {
        func: x => {
            if (typeof x === 'bigint') {
                // 对于 BigInt,先转换为字符串,再转换为数字计算对数
                return Math.log(Number(x.toString()));
            }
            return Math.log(x);
        },
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
        func: x => Math.sin(x.toString()),
        args: 1,
        description: '正弦函数'
    },
    'cos': {
        func: x => Math.cos(x.toString()),
        args: 1,
        description: '余弦函数'
    },
    'tan': {
        func: x => Math.tan(x.toString()),
        args: 1,
        description: '正切函数'
    },
    'asin': {
        func: x => Math.asin(x.toString()),
        args: 1,
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.radianToDeg(x).toFixed(3) + '°', // 格式化输出函数
        description: '反正弦函数'
    },
    'acos': {
        func: x => Math.acos(x.toString()),
        args: 1,
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.radianToDeg(x).toFixed(3) + '°', // 格式化输出函数
        description: '反余弦函数'
    },
    'atan': {
        func: x => Math.atan(x.toString()),
        args: 1,
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.radianToDeg(x).toFixed(3) + '°', // 格式化输出函数
        description: '反正切函数'
    },

    // 双曲函数
    'sinh': {
        func: x => Math.sinh(x.toString()),
        args: 1,
        description: '双曲正弦'
    },
    'cosh': {
        func: x => Math.cosh(x.toString()),
        args: 1,
        description: '双曲余弦'
    },
    'tanh': {
        func: x => Math.tanh(x.toString()),
        args: 1,
        description: '双曲正切'
    },
    'sqrt': {
        func: x => Math.sqrt(x.toString()),
        args: 1,
        description: '平方根'
    },
    'pow': {
        func: (x, y) => Math.pow(x.toString(), y.toString()),
        args: 2,
        description: '幂函数'
    },
    'abs': {
        args: 1,
        func: x => Math.abs(x.toString()),
        asProperty: true,
        description: '绝对值'
    },
    'deg': {
        args: 1,
        func: x => x * CONSTANTS.PI / 180,
        asProperty: true,
        preventSelfReference: true,       // 禁止自引用
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.radianToDeg(x).toFixed(3) + '°', // 格式化输出函数
        description: '度数转换为弧度'
    },
    'rad': {
        args: 1,
        func: Utils.radianToDeg,
        asProperty: true,
        preventSelfReference: true,
        repr: x => '角度: ' + x.toFixed(3) + '°',  // 格式化输出函数
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
    },

    // Base64 编码函数
    'base64': {
        args: 1,
        func: x => {
            try {
                // 确保输入是字符串
                if (typeof x !== 'string') {
                    x = String(x);
                }
                return btoa(x);
            } catch (e) {
                throw new Error('Base64编码失败: ' + e.message);
            }
        },
        description: 'Base64编码',
        acceptAny: true,
        asProperty: true
    },

    // Base64 解码函数
    'unbase64': {
        args: 1,
        func: x => {
            try {
                // 确保输入是字符串
                if (typeof x !== 'string') {
                    x = String(x);
                }
                return atob(x);
            } catch (e) {
                throw new Error('Base64解码失败: ' + e.message);
            }
        },
        description: 'Base64解码',
        acceptAny: true,
        asProperty: true
    }
}; 