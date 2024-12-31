// 类型支持
// 表达式所有的默认任意类型，或者只支持数字类型（由这个文件提供数字类型转换）
// 对于任意类型，在表达式预处理的时候，生成默认变量，然后进行计算（字符串，日期，向量矩阵）
// 对任意类型的支持，在函数内部自己完成


// 类型转换工具
const Types = {
    // 类型检查
    isNumber(value) {
        return (typeof value === 'number' && !isNaN(value)) || typeof value === 'bigint';
    },

    isString(value) {
        return typeof value === 'string';
    },

    // 字符串转数字，用于输入时处理
    toNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'bigint') {

            // 检查是否超出安全整数范围
            if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
                // throw new Error(`BigInt 值 ${value} 超出安全整数范围`);
                // 对于 BigInt，直接返回原值
                return value;
            }
            return Number(value);
        }
        if (typeof value === 'string') {
            // 处理空字符串
            if (!value.trim()) {
                throw new Error('空字符串无法转换为数字');
            }
            
            // 处理进制转换
            if (value.startsWith('0x') || value.startsWith('0b') || value.startsWith('0o')) {
                return BigInt(value);
            }

            // 处理大数，不包括小数点
            if (value.length > 10 && !value.includes('.')) {
                return BigInt(value);
            }

            // 处理科学计数法
            if (value.includes('e') || value.includes('E')) {
                // 检查科学计数法格式
                const scientificRegex = /^-?\d+\.?\d*[eE]-?\d+$/;
                if (!scientificRegex.test(value)) {
                    throw new Error(`无效的科学计数法格式: ${value}`);
                }
                const num = parseFloat(value);
                if (!isNaN(num)) return num;
            }
            
             // 处理普通数字
             if (!/^-?\d+(\.\d+)?$/.test(value)) {
                throw new Error(`无效的数字格式: ${value}`);
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

    // 数字转字符串，用于输出时显示
    toString(value, precision = 6) {
        // 处理 BigInt 类型
        if (typeof value === 'bigint') {
            // 如果是安全整数范围内，转换为 number
            if (value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER) {
                return Number(value).toString();
            }
            return value.toString();
        }

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

window.Types = Types; 