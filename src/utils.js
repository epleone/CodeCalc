// 类型支持
// 表达式所有的默认任意类型，或者只支持数字类型（由这个文件提供数字类型转换）
// 对于任意类型，在表达式预处理的时候，生成默认变量，然后进行计算（字符串，日期，向量矩阵）
// 对任意类型的支持，在函数内部自己完成


// 类型转换工具
const Utils = {
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
            
            // 处理高精度小数
            if (value.includes('.')) {
                // 使用 Number 构造函数直接转换，这样会保持原始精度
                return Number(value);
            }

            // 处理普通数字字符串
            const num = Number(value);
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
    },

    // 辅助函数：尝试弧度数字转换为 PI 的倍数或分数形式
    radianToPi(ratio) {
        // 转换为 PI 的倍数
        const piRatio = ratio / Math.PI;

        // 检查是否为整数倍
        if (Number.isInteger(piRatio)) {
            if (piRatio === 1) return 'PI';
            if (piRatio === -1) return '-PI';
            return `${piRatio}*PI`;     
        }

        // 检查常见的分数
        const denominators = [2, 3, 4, 6, 8, 12];
        for (const den of denominators) {
            const num = piRatio * den;
            if (Math.abs(Math.round(num) - num) < 1e-10) {
                const roundedNum = Math.round(num);
                if (Math.abs(roundedNum) === 1) {
                    return roundedNum > 0 ? `PI/${den}` : `-PI/${den}`;
                }
                return `${roundedNum}*PI/${den}`;
            }
        }

        // 如果无法简化，返回小数形式
        return `${piRatio.toFixed(6)}*PI`;
    },

    // 定义弧度转角度
    radianToDeg(radian) {
        let degrees = radian * 180 / Math.PI;
        // 将角度规范化到0-360度之间
        degrees = degrees % 360;
        if (degrees < 0) degrees += 360;
        return degrees;
    },


};

// 删除全局导出
// window.Utils = Utils; 

// 添加ES6模块导出
export default Utils;