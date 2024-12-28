// 类型定义
const TYPE = {
    NUMBER: 'number',
    STRING: 'string',
    ANY: 'any'
};

// 类型转换工具
const Types = {
    // 类型检查
    isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    },

    isString(value) {
        return typeof value === 'string';
    },

    // 类型转换
    toNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            // 处理空字符串
            if (!value.trim()) {
                throw new Error('空字符串无法转换为数字');
            }

            // 处理科学计数法
            if (value.includes('e') || value.includes('E')) {
                const num = parseFloat(value);
                if (!isNaN(num)) return num;
            }

            // 处理普通数字字符串
            const num = parseFloat(value);
            if (!isNaN(num)) {
                // 检查是否为整数
                if (Number.isInteger(num) && Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
                    return parseInt(value, 10);
                }
                return num;
            }
        }
        throw new Error(`无法将 ${value} 转换为数字类型`);
    },

    toString(value, precision = 6) {
        if (typeof value === 'number') {
            // 处理特殊数字
            if (!Number.isFinite(value)) {
                return value.toString();
            }

            // 对于大数使用科学计数法
            if (Math.abs(value) >= 1e21) {
                return value.toExponential(precision);
            }

            // 如果是整数，直接返回
            if (Number.isInteger(value)) {
                return value.toString();
            }

            // 处理小数
            // 先转换为指定精度
            const rounded = Number(value.toFixed(precision));
            // 如果转换后是整数，直接返回
            if (Number.isInteger(rounded)) {
                return rounded.toString();
            }
            // 移除末尾多余的0
            return rounded.toString().replace(/\.?0+$/, '');
        }
        return String(value);
    }
};

// 测试代码
if (typeof window === 'undefined') {
    // 基本数字转换
    console.log(Types.toNumber('123.45'));         // 123.45
    console.log(Types.toNumber('123'));            // 123
    
    // 小数位数测试
    console.log(Types.toString(123.456789));       // "123.456789"
    console.log(Types.toString(123.4567891234));   // "123.456789"
    console.log(Types.toString(123.45));           // "123.45"
    console.log(Types.toString(123.450));          // "123.45"
    console.log(Types.toString(123.0));            // "123"
    console.log(Types.toString(123));              // "123"
    
    // 科学计数法
    console.log(Types.toNumber('1.23e5'));         // 123000
    console.log(Types.toNumber('1.23E-5'));        // 0.0000123
    console.log(Types.toString(1.23456e-5));       // "0.0000123456"
    
    // 大数处理
    console.log(Types.toString(1.23456e21));       // "1.234560e+21"
    console.log(Types.toNumber('9007199254740991')); // 9007199254740991
    
    // 特殊数字
    console.log(Types.toString(Infinity));         // "Infinity"
    console.log(Types.toString(-Infinity));        // "-Infinity"
    console.log(Types.toString(NaN));              // "NaN"
    
    // 错误处理
    try {
        Types.toNumber('abc');
    } catch (e) {
        console.log(e.message);                    // "无法将 abc 转换为数字类型"
    }
    
    try {
        Types.toNumber('');
    } catch (e) {
        console.log(e.message);                    // "空字符串无法转换为数字"
    }
} 

// 暴露到全局作用域
window.TYPE = TYPE;
window.Types = Types; 