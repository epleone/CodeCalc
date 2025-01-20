// 类型支持
// 表达式所有的默认任意类型，或者只支持数字类型（由这个文件提供数字类型转换）
// 对于任意类型，在表达式预处理的时候，生成默认变量，然后进行计算（字符串，日期，向量矩阵）
// 对任意类型的支持，在函数内部自己完成

//写一个类 datestamp, 包含三个属性，year, month, timestamp
class Datestamp {
    constructor(year, month, timestamp) {
        this.year = year;
        this.month = month;
        this.timestamp = timestamp;
    }

    // 将Datestamp转换为字符串
    getYMString() {
        let ym = "";
        if(this.year !== 0) {
            ym += this.year + '年';
        }
        if(this.month !== 0) {
            ym += this.month + '月';
        }

        if(ym != "") {
            ym += "+";
        }

        return ym;
    }

    toString() {
        let ts = this.getYMString() + this.timestamp + 'ms';
        return ts;
    }

}


// 类型检查
function isNumber(value) {
    return (typeof value === 'number' && !isNaN(value)) || typeof value === 'bigint';
}

function isString(value) {
    return typeof value === 'string';
}

function isDate(value) {
    return value instanceof Date && !isNaN(value);
}

// 判断是否是Datestamp
function isDatestamp(value) {
    return value instanceof Datestamp;
}


// 类型转换工具
const Utils = {
    // 将不同的输出格式化成字符串
    formatToDisplayString(result) {

        // 如果是Datestamp，则返回字符串
        if(isDatestamp(result)) {
            return {value: result.toString(), info: "时间间隔：" + Utils.formatDateStamp(result)};
        }

        // 如果是Date，则返回日期字符串
        if(isDate(result)) {
            return {value: result.getTime(), info: "时间戳对应日期：" + Utils.formatDate(result)};
        }   

        return result;
    },

    add(x, y) {
        if (typeof x === 'string' || typeof y === 'string') {
            return x.toString() + y.toString();
        }
        if (typeof x === 'bigint' || typeof y === 'bigint') {
            return BigInt(x) + BigInt(y);
        }
        if(isDatestamp(x) && isDatestamp(y)) {
            return new Datestamp(x.year + y.year, x.month + y.month, x.timestamp + y.timestamp);
        }
        if(isDate(x) && isDatestamp(y))
        {
            const newDate = new Date(x);
            newDate.setFullYear(newDate.getFullYear() + y.year);
            newDate.setMonth(newDate.getMonth() + y.month);
            // 加上毫秒
            newDate.setMilliseconds(newDate.getMilliseconds() + y.timestamp);
            return newDate;
        }
        if(isDate(y) && isDatestamp(x))
        {
            const newDate = new Date(y);
            newDate.setFullYear(newDate.getFullYear() + x.year);
            newDate.setMonth(newDate.getMonth() + x.month);
            // 加上毫秒
            newDate.setMilliseconds(newDate.getMilliseconds() + x.timestamp);
            return newDate;
        }
        if(isDate(x) && isDate(y))
        {
            // 返回错误
            throw new Error('两个日期类型不能相加');
        }
        if (typeof x !== typeof y) {
            throw new Error(`参数类型不一致: ${typeof x} 和 ${typeof y}`);
        }
        return x + y;
    },

    subtract(x, y){
        // 打印x,y的类型
        console.log(typeof x, typeof y);

        if (typeof x === 'bigint' || typeof y === 'bigint') {
            return BigInt(x) - BigInt(y);
        }
        if(isDatestamp(x))
        {
            if(isDatestamp(y))
            {
                return new Datestamp(x.year - y.year, x.month - y.month, x.timestamp - y.timestamp);
            }else if(isDate(y))
            {
                throw new Error('时间戳不能减去日期 ')
            }else{
                throw new Error('不支持的时间戳减法');
            }
        }
        if(isDate(x))
        {
            if(isDatestamp(y)){
                const newDate = new Date(x);
                newDate.setFullYear(newDate.getFullYear() - y.year);
                newDate.setMonth(newDate.getMonth() - y.month);
                // 减去毫秒
                newDate.setMilliseconds(newDate.getMilliseconds() - y.timestamp);
                return newDate;
            }else if(isDate(y)){
                const timestamp = x.getTime() - y.getTime();
                return new Datestamp(0, 0, timestamp);
            }else{
                throw new Error('不支持的日期减法');
            }
        }

        if (typeof x !== typeof y) {
            throw new Error(`参数类型不一致: ${typeof x} 和 ${typeof y}`);
        }

        return x - y;
    },

    multiply(x, y) {
        if (typeof x === 'bigint' || typeof y === 'bigint') {
            return BigInt(x) * BigInt(y);
        }
        return x * y;
    },

    divide(x, y) {
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

    // 整除
    floorDivide(x, y) {
        if (typeof x === 'bigint' || typeof y === 'bigint') {
            return BigInt(x) / BigInt(y);
        }
        return Math.floor(x / y);
    },

    // 取模
    mod(x, y) {
        if (typeof x === 'bigint' || typeof y === 'bigint') {
            return BigInt(x) % BigInt(y);
        }
        return x % y;
    },

    // 幂运算
    pow(x, y) {
        return Math.pow(x.toString(), y.toString());
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
                const scientificRegex = /^-?\d*\.?\d*[eE][+-]?\d+$/;
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

    // 日期转时间戳
    dateToTimestamp(x) {
        const date = new Date(x);
        if (isNaN(date.getTime())) {
            throw new Error(`无法将${x}转成日期`);
        }
        return date.getTime();
    },


    // 时间戳格式化成日期字符串
    formatDate(x) {
        if(isDatestamp(x)){
            throw new Error(`无法将时间间隔转成日期, 请使用"> #"`);
        }

        const date = new Date(x);
        //判断是否是日期
        if(isNaN(date.getTime())){
            throw new Error(`无法将${x}转成日期`);
        }
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // 只返回日期
        if(hours === 0 && minutes === 0 && seconds === 0) {
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }

        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    // 时间戳可视化成时间差
    formatDateStamp(x) {
        if(!isDatestamp(x)){
            throw new Error(`"> #"只能可视化时间间隔类型`);
        }

        const ms = x.timestamp;
        const absMs = Math.abs(ms);

        const seconds = Math.floor((absMs / 1000) % 60);
        const minutes = Math.floor((absMs / (1000 * 60)) % 60);
        const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
        
        const ts_str = `${ms < 0 ? '-' : ''}${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`;

        return x.getYMString() + ts_str;
    },

    formatDateStamp2Week(x) {
        if(!isDatestamp(x)){
            throw new Error(`"> #w"只能可视化时间间隔类型`);
        }
        const ms = x.timestamp;
        const weeks = ms / (1000 * 60 * 60 * 24 * 7);
        const ts_str =  weeks.toFixed(2) + '周';

        return x.getYMString() + ts_str;
    },

    formatDateStamp2Day(x) {
        if(!isDatestamp(x)){
            throw new Error(`"> #d"只能可视化时间间隔类型`);
        }
        const ms = x.timestamp;
        const days = ms / (1000 * 60 * 60 * 24);
        const ts_str =  days.toFixed(2) + '天';

        return x.getYMString() + ts_str;
    },

    formatDateStamp2Hour(x) {
        if(!isDatestamp(x)){
            throw new Error(`"> #h"只能可视化时间间隔类型`);
        }
        const ms = x.timestamp;
        const hours = ms / (1000 * 60 * 60);
        const ts_str =  hours.toFixed(2) + '小时';

        return x.getYMString() + ts_str;
    },

    formatDateStamp2Minute(x) {
        if(!isDatestamp(x)){
            throw new Error(`"> #m"只能可视化时间间隔类型`);
        }
        const ms = x.timestamp;
        const minutes = ms / (1000 * 60);
        const ts_str =  minutes.toFixed(2) + '分钟';

        return x.getYMString() + ts_str;
    },

    formatDateStamp2Second(x) {
        if(!isDatestamp(x)){
            throw new Error(`"> #s"只能可视化时间间隔类型`);
        }
        const ms = x.timestamp;
        const seconds = ms / 1000;
        const ts_str =  seconds.toFixed(2) + '秒';

        return x.getYMString() + ts_str;
    },
};


export { Utils, Datestamp };
