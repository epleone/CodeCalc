// 工具类
import Decimal from 'decimal.js';

// 类 datestamp, 包含三个属性，year, month, timestamp
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

const M_CONST = {
    'pi': Decimal.acos(-1),      // PI
    'e': Decimal.exp(1),         // e
};


function isNumber(value) {
    return typeof value === 'number';
}

function isBigInt(value) {
    return typeof value === 'bigint';
}
    
function isDecimal(value) {
    return value instanceof Decimal;
}


// 判断是否是数字类型，可以相互转换
function isDigital(value) {
    return isNumber(value) || isBigInt(value) || isDecimal(value);
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

    // 字符串转数字，用于输入时处理
    // type: 目标类型 {decimal, number, bigint, string, any}
    convertTypes(value, type='decimal') {
        // console.log("convertTypes: ", value.toString(), type);

        if(type === 'decimal') {
            return new Decimal(value.toString());
        }  
        if(type === 'number') {
            return Number(value.toString());
        }
        if(type === 'bigint') {
            return BigInt(value.toString());
        }
        if(type === 'string') {
            return value.toString();
        }
        if(type === 'any') {
            return value;
        }

        throw new Error(`无法将 ${value} 转换为 ${type} 类型`);
    },

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

        return result.toString();     // 可以定义输出格式
        // return result.toNumber();  // 会损失精度
    },

    add(x, y) {

        if(isDecimal(x) && isDecimal(y)) {
            return x.plus(y);
        }
        
        if (typeof x === 'string' || typeof y === 'string') {
            return x.toString() + y.toString();
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

        throw new Error('不支持的加法');

    },

    subtract(x, y){
        if(isDecimal(x) && isDecimal(y)) {
            return x.minus(y);
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

        throw new Error('不支持的减法');
    },

    multiply(x, y) {
        if(isDecimal(x) && isDecimal(y)) {
            return x.times(y);
        }

        throw new Error('不支持的乘法');
    },

    divide(x, y) {
        if(isDecimal(x) && isDecimal(y)) {
            return x.div(y);
        }

        throw new Error('不支持的除法');
    },

    // 整除
    floorDivide(x, y) {
        if(isDecimal(x) && isDecimal(y)) {
            return x.div(y).floor();
        }

        throw new Error('不支持的整除');
    },

    // 取模
    mod(x, y) {
        if(isDecimal(x) && isDecimal(y)) {
            return x.mod(y);
        }

        throw new Error('不支持的模运算');
    },

    // 幂运算
    pow(x, y) {
        if(isDecimal(x) && isDecimal(y)) {
            return x.pow(y);
        }
        throw new Error('不支持的幂运算');
    },


    toFixed(value, precision) {
        const decimal = isDecimal(value) ? value : new Decimal(value);
        return decimal.toFixed(precision).toString();
    },


    sin(value) {
        // 修复Decimal的bug
        if(value.abs().floor() > 10000000000) {
            return Math.sin(value.toString());
        }
        return Decimal.sin(value);
    },

    cos(value) {
        if(value.abs().floor() > 10000000000) {
            return Math.cos(value.toString());
        }

        return Decimal.cos(value);
    },

    tan(value) {
        if(value.abs().floor() > 10000000000) {
            return Math.tan(value.toString());
        }
        return Decimal.tan(value);
    },

    // 辅助函数：尝试弧度数字转换为 π 的倍数或分数形式
    radianToPi(value) {
        const ratio = isDecimal(value) ? value : new Decimal(value);
        // 转换为 PI 的倍数
        const piRatio = ratio.div(M_CONST.pi);

        // 检查是否为整数倍
        if (piRatio.isInteger()) {
            if (piRatio.equals(1)) return 'π';
            if (piRatio.equals(-1)) return '-π';
            return `${piRatio}*π`;     
        }

        // 检查常见的分数
        const denominators = [2, 3, 4, 6, 8, 12];
        for (const den of denominators) {
            const num = piRatio.toNumber() * den;
            if (Math.abs(Math.round(num) - num) < 1e-8) {
                const roundedNum = Math.round(num);
                if (Math.abs(roundedNum) === 1) {
                    return roundedNum > 0 ? `π/${den}` : `-π/${den}`;
                }
                return `${roundedNum}*π/${den}`;
            }
        }

        // 如果无法简化，返回小数形式
        return `${piRatio.toFixed(6)}*π`;
    },

    // 定义弧度转角度
    radianToDeg(value) {
        const radian = isDecimal(value) ? value : new Decimal(value);

        let degrees = radian.times(180).div(M_CONST.pi);

        // 将角度规范化到0-360度之间
        degrees = degrees.mod(360);

        if (degrees.lt(0)) {  // 使用Decimal的lt方法进行比较
            degrees = degrees.plus(360);
        }

        return degrees;
    },

    // 时间和日期计算依旧使用默认的Math库
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


export { Utils, Datestamp, M_CONST };