import { Utils, Datestamp, M_CONST } from './utils.js';
import Decimal from 'decimal.js';

// 常数定义
export const CONSTANTS = {
    'π': M_CONST.pi,
    'PI': M_CONST.pi,
    'pi': M_CONST.pi,
    'e': M_CONST.e,
    'E': M_CONST.e,
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
        func: Utils.add,
        argTypes: 'any', // 支持任何类型输入，不转换类型
        position: 'infix',
        description: '加法'
    },
    '-': {
        precedence: 2,
        args: 2,
        func: Utils.subtract,
        argTypes: 'any',
        position: 'infix',
        description: '减法'
    },
    '*': {
        precedence: 4,
        args: 2,
        func: Utils.multiply,
        position: 'infix',
        description: '乘法'
    },
    '/': {
        precedence: 4,
        args: 2,
        func: Utils.divide,
        position: 'infix',
        description: '除法'
    },

    // 高级算术运算符
    '//': {
        precedence: 4,
        args: 2,
        func: Utils.floorDivide,
        position: 'infix',
        description: '整除'
    },
    '%': {
        precedence: 4,
        args: 2,
        func: Utils.mod,
        position: 'infix',
        description: '取模'
    },
    '**': {
        precedence: 7,
        args: 2,
        func: Utils.pow,
        position: 'infix',
        description: '幂运算'
    },

    // 一元运算符
    '°': {
        alias: '.rad',
        description: '角度转弧度'
    },
    'unary-': {
        precedence: 5,
        args: 1,
        func: x => x.neg(),
        position: 'prefix',
        description: '负号'
    },
    'unary+': {
        precedence: 5,
        args: 1,
        func: x => x,
        position: 'prefix',
        description: '正号'
    },
    'unary%': {
        precedence: 5,
        args: 1,
        func: x => x.times(0.01),
        position: 'postfix',
        preventSelfReference: true,
        description: '百分号'
    },
    '‰': {
        precedence: 5,
        args: 1,
        func: x => x.times(0.001),
        position: 'postfix',
        preventSelfReference: true,
        description: '千分号'
    },
    
    // 位运算符
    '&': {
        precedence: 1,
        args: 2,
        func: (x, y) => {
            //打印x和y的类型
            console.log(typeof x, typeof y);
            return x & y;
        },
        position: 'infix',
        argTypes: 'bigint',
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
        argTypes: 'bigint',
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
        argTypes: 'bigint',
        description: '按位异或'
    },
    '~': {
        precedence: 6,
        args: 1,
        func: x => ~x,
        position: 'prefix',
        argTypes: 'bigint',
        description: '按位取反'
    },
    "not":{
        alias: '~',
        description: '按位取反'
    },
    '<<': {
        precedence: 3,
        args: 2,
        func: (x, y) => x << y,
        position: 'infix',
        argTypes: 'bigint',
        description: '左移'
    },
    '>>': {
        precedence: 3,
        args: 2,
        func: (x, y) => x >> y,
        position: 'infix',
        argTypes: 'bigint',
        description: '右移'
    },
    '>>>': {
        precedence: 3,
        args: 2,
        func: (x, y) => x >>> y,
        position: 'infix',
        argTypes: 'number',
        description: '无符号右移'
    },

    // 赋值运算符组
    '=': {
        precedence: 0,
        args: 2,
        func: (a, b) => b,
        position: 'infix',
        argTypes: 'any',
        isCompoundAssignment: true,
        description: '赋值'
    },
    '+=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue.add(rightValue),
        position: 'infix',
        description: '加法赋值',
        isCompoundAssignment: true
    },
    '-=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue.sub(rightValue),
        position: 'infix',
        description: '减法赋值',
        isCompoundAssignment: true
    },
    '*=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue.mul(rightValue),
        position: 'infix',
        description: '乘法赋值',
        isCompoundAssignment: true
    },
    '/=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue.div(rightValue),
        position: 'infix',
        description: '除法赋值',
        isCompoundAssignment: true
    },
    '&=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue & rightValue,
        position: 'infix',
        argTypes: 'bigint',
        description: '按位与赋值',
        isCompoundAssignment: true
    },
    '|=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => {
            console.log("|=", oldValue, rightValue);
            console.log("oldValue的类型:", typeof oldValue);
            console.log("rightValue的类型:", typeof rightValue);
            return oldValue | rightValue;
        },
        position: 'infix',
        argTypes: 'bigint',
        description: '按位或赋值',
        isCompoundAssignment: true
    },
    '^=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue ^ rightValue,
        position: 'infix',
        argTypes: 'bigint',
        description: '按位异或赋值',
        isCompoundAssignment: true
    },
    '<<=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue << rightValue,
        position: 'infix',
        argTypes: 'bigint',
        description: '左移赋值',
        isCompoundAssignment: true
    },
    '>>=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue >> rightValue,
        position: 'infix',
        argTypes: 'bigint',
        description: '右移赋值',
        isCompoundAssignment: true
    },
    '>>>=': {
        precedence: 0,
        args: 2,
        func: (oldValue, rightValue) => oldValue >>> rightValue,
        position: 'infix',
        argTypes: 'number',
        description: '无符号右移赋值',
        isCompoundAssignment: true
    },

    // 日期操作符, 返回日期对象的时间戳
    '@': {
        precedence: 1,
        args: 1,
        func: Utils.dateToTimestamp,
        position: 'prefix',
        argTypes: 'any',               // 支持任何类型输入，不转换类型
        description: '日期转时间戳'     //输出时间戳
    },
    '>@': {
        precedence: 0,
        args: 1,
        func: Utils.formatDate,
        position: 'postfix',
        argTypes: 'any',
        description: '时间戳可视化成日期'
    },

    // 时间戳可视化操作符
    '>#': {
        precedence: 0,
        args: 1,
        func: Utils.formatDateStamp,
        position: 'postfix',
        argTypes: 'any',
        description: '时间差可视化'
    },
    '>#w': {
        precedence: 0,
        args: 1,
        func: Utils.formatDateStamp2Week,
        position: 'postfix',
        argTypes: 'any',
        description: '时间差转成周数'
    },
    '>#W': {
        alias: '>#w',
        description: '时间差转成周数'
    },
    '>#d': {
        precedence: 0,
        args: 1,
        func: Utils.formatDateStamp2Day,
        position: 'postfix',
        argTypes: 'any',
        description: '时间差转成天数'
    },
    '>#D': {
        alias: '>#d',
        description: '时间差转成天数'
    },
    '>#h': {
        precedence: 0,
        args: 1,
        func: Utils.formatDateStamp2Hour,
        position: 'postfix',
        argTypes: 'any',
        description: '时间差转成小时数'
    },
    '>#H': {
        alias: '>#h',
        description: '时间差转成小时数'
    },
    '>#m': {
        precedence: 0,
        args: 1,
        func: Utils.formatDateStamp2Minute,
        position: 'postfix',
        argTypes: 'any',
        description: '时间差转成分钟数'
    },
    '>#M': {
        alias: '>#m',
        description: '时间差转成分钟数'
    },
    '>#s': {
        precedence: 0,
        args: 1,
        func: Utils.formatDateStamp2Second,
        position: 'postfix',
        argTypes: 'any',
        description: '时间差转成秒数'
    },
    '>#S': {
        alias: '>#s',
        description: '时间差转成秒数'
    }
};

// 函数定义
export const FUNCTIONS = {
    // 类型转换函数
    'str': {
        func: x => x.toString(),
        args: 1,
        argTypes: 'any',
        description: '转换为字符串'
    },
    'num': {
        func: x => x,
        args: 1,
        description: '转换为数字'
    },

    // 数学函数
    'max': {
        func: (...args) => Decimal.max(...args),
        args: -1,  // 支持1~N个参数  
        description: '求最大值'
    },
    'min': {
        func: (...args) => Decimal.min(...args),
        args: -1,  // 支持1~N个参数  
        description: '求最小值'
    },
    'lg': {
        func: x => Decimal.log10(x),
        args: 1,
        description: '以10为底的对数'
    },
    'lb': {
        func: x => Decimal.log2(x),
        args: 1,
        description: '以2为底的对数'
    },
    'log': {
        func: (x, y) => Decimal.log(y, x),
        args: 2,
        description: '以x为底的y对数'
    },
    'ln': {
        func: x => Decimal.ln(x),
        args: 1,
        description: '自然对数'
    },
    'exp': {
        func: x => Decimal.exp(x),
        args: 1,
        description: 'e的指数'
    },

    // 取整函数
    'round': {
        func: x => Decimal.round(x),
        args: 1,
        description: '四舍五入取整'
    },
    'roundfix': {
        func: (x, n) => {
            n = n.toNumber();
            // 如果n为负数，-1表示最后一位，-2表示倒数第二位，以此类推
            if(n < 0) {
                n = x.decimalPlaces() + n;
            }
            // 小于0，则为0
            n = Math.max(0, n);
            return x.toDecimalPlaces(n);
        },
        args: 2,
        description: '指定小数位数, 四舍五入取整'
    },
    'floor': {
        func: x => Decimal.floor(x),
        args: 1,
        description: '向下取整'
    },
    'ceil': {
        func: x => Decimal.ceil(x),
        args: 1,
        description: '向上取整'
    },

    // 取值范围函数
    'clamp': {
        func: (x, y, z) => Decimal.clamp(x, y, z),
        args: 3,
        description: '设置数值范围'
    },

    // 随机数函数, 0:数字，1:向量，2:矩阵
    'random': {
        func: (...args) => Utils.random(...args),
        args: -2, // 支持0~N个参数   
        description: '随机数生成0~1'
    },

    // 三角函数
    'sin': {
        func: x => Decimal.sin(x),
        args: 1,
        description: '正弦函数'
    },
    'cos': {
        func: x => Decimal.cos(x),
        args: 1,
        description: '余弦函数'
    },
    'tan': {
        func: x => Decimal.tan(x),
        args: 1,
        description: '正切函数'
    },
    'asin': {
        func: x => Decimal.asin(x),
        args: 1,
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.toFixed(Utils.radianToDeg(x), 3) + '°', // 格式化输出函数
        description: '反正弦函数'
    },
    'acos': {
        func: x => Decimal.acos(x),
        args: 1,
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.toFixed(Utils.radianToDeg(x), 3) + '°', // 格式化输出函数
        description: '反余弦函数'
    },
    'atan': {
        func: x => Decimal.atan(x),
        args: 1,
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.toFixed(Utils.radianToDeg(x), 3) + '°', // 格式化输出函数
        description: '反正切函数'
    },

    // 双曲函数
    'sinh': {
        func: x => Decimal.sinh(x),
        args: 1,
        description: '双曲正弦'
    },
    'cosh': {
        func: x => Decimal.cosh(x),
        args: 1,
        description: '双曲余弦'
    },
    'tanh': {
        func: x => Decimal.tanh(x),
        args: 1,
        description: '双曲正切'
    },
    'sqrt': {
        func: x => x.sqrt(),
        args: 1,
        description: '平方根'
    },
    'pow': {
        func: Utils.pow,
        args: 2,
        description: '幂函数'
    },
    'abs': {
        args: 1,
        func: x => x.abs(),
        asProperty: true,
        description: '绝对值'
    },
    'rad': {
        args: 1,
        func: x => x.times(M_CONST.pi).div(180),
        asProperty: true,
        preventSelfReference: true,       // 禁止自引用
        repr: x => '弧度: ' + Utils.radianToPi(x) + " | 角度: " + Utils.toFixed(Utils.radianToDeg(x), 3) + '°', // 格式化输出函数
        description: '度数转换为弧度'
    },
    'deg': {
        args: 1,
        func: Utils.radianToDeg,
        asProperty: true,
        preventSelfReference: true,
        repr: x => '角度: ' + Utils.toFixed(x, 3) + '°',  // 格式化输出函数
        description: '弧度转换为度数'
    },

    // 字符串函数
    'upper': {
        args: 1,
        func: x => x.toUpperCase(),
        argTypes: 'any',
        asProperty: true,
        description: '转换为大写'
    },
    'lower': {
        args: 1,
        func: x => x.toLowerCase(),
        argTypes: 'any',
        asProperty: true,
        description: '转换为小写'
    },
    'length': {
        args: 1,
        func: x => x.length,
        argTypes: 'any',
        asProperty: true,
        description: '字符串长度'
    },
    // 进制转换函数
    'bin': {
        args: 1,
        func: x => "0b" + x.toString(2),
        asProperty: true,
        argTypes: 'bigint',
        description: '十进制转二进制'
    },
    'oct': {
        args: 1,
        func: x => "0o" + x.toString(8),
        asProperty: true,
        argTypes: 'bigint',
        description: '十进制转八进制'
    },
    'hex': {
        args: 1,
        func: x => "0x" + x.toString(16),
        asProperty: true,
        argTypes: 'bigint',
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
        argTypes: 'any',
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
        argTypes: 'any',
        asProperty: true
    },
    // 日期函数
    'timestamp': {
        args: 8,
        func: (year=0, month=0, week=0, day=0, hour=0, minute=0, second=0, millisecond=0) => {
            // year和month必须是非负整数
            const years = Number(year);
            const months = Number(month);
            if (!Number.isInteger(years) || !Number.isInteger(months)) {
                throw new Error(`年:${years} 月:${months} 必须是整数`);
            }

            // week, day, hour, minute, second, millisecond 求和，单位ms,
            const totalMilliseconds = ((((week * 7 + day)*24 + hour)*60 + minute)*60 + second)*1000 + millisecond;
            
            // 返回Datestamp对象
            return new Datestamp(years, months, totalMilliseconds);
        },
        argTypes: 'number',
        description: '时间间隔转换为时间戳'
    },
}; 