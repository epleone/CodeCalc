// 工具类
import Decimal from 'decimal.js';
import { DecMatrix } from './matrix.js';

Decimal.set({
    precision: 21,
    // toExpNeg: -7,        // 小于 1e-7 时使用科学记数法，在函数formatToDisplayString中会被格式化覆盖
    // toExpPos: 20,        // 大于 1e20 时使用科学记数法，默认21
});

// 打印Decimal的配置
// console.log("Decimal toExpPos: ", Decimal.precision);
// console.log("Decimal toExpPos: ", Decimal.toExpNeg);
// console.log("Decimal toExpPos: ", Decimal.toExpPos);

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

// 判断是否是Matrix
function isMatrix(value) {
    return value instanceof DecMatrix;
}


// 检查参数是否满足矩阵运算
function checkMatrixArgs(args0, args1) {
    // 如果是两个矩阵，则返回true
    if (isMatrix(args0) && isMatrix(args1)) {
        return true;
    }

    //  如果一个是矩阵，一个是数字，则返回true
    if (isMatrix(args0) && isDigital(args1)) {
        return true;
    }

    if (isDigital(args0) && isMatrix(args1)) {
        return true;
    }

    return false;
}

// 添加标量和矩阵运算支持，注意是否满足交换律
function addOpSupport(opName, x, y, op_xy, op_yx) {
    // 使用这个函数时，x和y都强制转换为Decimal类型 或者是 DecMatrix类型
    if(isDecimal(x) && isDecimal(y)) {
        return op_xy(x, y);
    }

    if(checkMatrixArgs(x, y)) {
        if(isMatrix(x)) {
            return x.apply(op_xy, y);
        }else{
            // 不满足交换律时，op_yx也需要交换一次顺序
            return y.apply(op_yx, x);
        }
    }

    if (typeof x !== typeof y) {
        throw new Error(`${opName} 参数类型不一致: ${typeof x} 和 ${typeof y}`);
    }

    throw new Error(`不支持的运算: ${opName}`);
}


// 类型转换工具
const Utils = {

    // 字符串转数字，用于输入时处理
    // type: 目标类型 {decimal, number, bigint, string, any}
    convertTypes(value, type='decimal') {
        // console.log("convertTypes: ", value.toString(), type);

        if(type === 'decimal') {
            // 如果value是矩阵，矩阵内部元素已经是Decimal类型，返回矩阵
            if(isMatrix(value)) {
                return value;
            }
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

        if(isDecimal(result)) {
            // 检查result.toString()中含有e 
            if(result.toString().includes('e+') || result.toString().includes('e-')) {
                // 保留16位小数
                let str = result.toExponential(16);
                let [coefficient, exponent] = str.split('e');
                // 去掉末尾的0
                coefficient = coefficient.replace(/\.?0+$/, '');
                return coefficient + 'e' + exponent;
            }

            // 如果是整数，直接返回
            if(result.isInteger()) {
                return result.toString();
            }

            // 显示16位有效数字，并去掉末尾的0
            return result.toFixed(16).replace(/\.?0+$/, '');
        }

        if(isMatrix(result)) {
            return { value: result.toString(), info: "isMatrix" };
        }

        return result.toString();
    },

    add(x, y) {        
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

        // 由于argTypes: 'any', 需要转成Decimal类型， 走通用逻辑
        let addOP = (x, y) => Decimal(x).plus(Decimal(y));

        return addOpSupport('加法', x, y, addOP, addOP);

    },

    subtract(x, y){
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

        // 由于argTypes: 'any', 需要转成Decimal类型， 走通用逻辑
        let subOP1 = (x, y) => Decimal(x).minus(Decimal(y));
        let subOP2 = (x, y) => Decimal(y).minus(Decimal(x));
        return addOpSupport('减法', x, y, subOP1, subOP2);
    },

    multiply(x, y) {
        // 不可以定义 argTypes: 'any', 需要转换参数类型到Decimal
        let mulOP = (x, y) => x.times(y);
        return addOpSupport('乘法', x, y, mulOP, mulOP);
    },

    divide(x, y) {
        // 不可以定义 argTypes: 'any', 需要转换参数类型

        // 不满足交换律
        let divOP1 = (x, y) => x.div(y);
        let divOP2 = (x, y) => y.div(x);

        return addOpSupport('除法', x, y, divOP1, divOP2);
    },

    // 整除
    floorDivide(x, y) {
        // 不可以定义 argTypes: 'any', 需要转换参数类型

        // 不满足交换律
        let floorDivOP1 = (x, y) => x.div(y).floor();
        let floorDivOP2 = (x, y) => y.div(x).floor();

        return addOpSupport('整除', x, y, floorDivOP1, floorDivOP2);
    },

    // 取模
    mod(x, y) {
        // 不可以定义 argTypes: 'any', 需要转换参数类型

        // 不满足交换律
        let modOP1 = (x, y) => x.mod(y);
        let modOP2 = (x, y) => y.mod(x);

        return addOpSupport('取模', x, y, modOP1, modOP2);
    },

    // 幂运算
    pow(x, y) {
        // 不可以定义 argTypes: 'any', 需要转换参数类型

        // 不满足交换律
        let powOP1 = (x, y) => x.pow(y);
        let powOP2 = (x, y) => y.pow(x);

        return addOpSupport('幂运算', x, y, powOP1, powOP2);
    },


    toFixed(value, precision) {
        const decimal = isDecimal(value) ? value : new Decimal(value);
        // 如果是整数，直接返回
        if(decimal.isInteger()) {
            return decimal.toString();
        }

        // 显示`precision`位有效数字，并去掉末尾的0
        return decimal.toFixed(precision).replace(/\.?0+$/, '');
    },

    // 随机数函数
    random(...args) {
        if(args.length === 0) {
            return Decimal.random().toFixed(8);
        }

        if(args.length === 1) {
            const num = args[0].toNumber();
            // 随机生成num个数字
            const vec = Array.from({length: num}, () => Decimal.random());
            return new DecMatrix(vec, num, 1);
        }

        if(args.length === 2) {
            const rows = args[0].toNumber();
            const cols = args[1].toNumber();
            const vec = Array.from({length: rows * cols}, () => Decimal.random());
            return new DecMatrix(vec, rows, cols);
        }

        throw new Error(`random函数参数数量(${args.length})错误，应为0, 1, 2`);

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


    // 矩阵和向量转换
    str2vec(str) {
        // 传入字符串 `[1 2 3]`, 只处理空格分割
        str = str.trim();
        if (str[0] !== '[' || str[str.length-1] !== ']') {
            throw new Error('vector格式错误，请使用方括号[]');
        }
        
        // 去掉首尾的 [ ]以及周围的空格
        str = str.replace(/\s*\[\s*/g, '');
        str = str.replace(/\s*\]\s*/g, '');

        // 处理空格分隔的情况
        let numbers = str.split(/\s+/).map(s => Decimal(s.trim()));

        if (numbers.length === 0) {
            throw new Error('vector 长度为0');
        }
        
        // 如果有非法数字，则抛出错误
        for (let i = 0; i < numbers.length; i++) {
            if (isNaN(numbers[i])) {
                throw new Error(`vector${i+1}: ${numbers[i]} 不是数字`);
            }
        }  

        // 返回一个列向量
        return new DecMatrix(numbers, numbers.length, 1);
    },


    str2Matrix(str) {
        //  只处理 空格和分号分割的矩阵 `{1 2 3;4 5 6; 7 8 9}`
        str = str.trim();
        if (str[0] !== '{' || str[str.length-1] !== '}') {
            throw new Error('matrix格式错误，请使用大括号{}');
        }

        // 去掉首尾的大括号以及周围的空格
        str = str.replace(/\s*\{\s*/g, '');
        str = str.replace(/\s*\}\s*/g, '');

        // 将分号前后的空格去掉
        str = str.replace(/\s*;\s*/g, ';');
    
        // 按分号分隔成行
        let rows = str.split(';');
        // 每行按空格分隔成数字数组
        let numbers = rows.map(row => {
            // 去掉首尾空格后按空格分隔，并转换为Decimal
            return row.trim().split(/\s+/).map(Decimal);
        });

        // 判断二维数组是否为空
        if (numbers.length === 0) {
            throw new Error('matrix 长度为0');
        }

        // 判断二维数组每行长度是否一致,并检查是否有非法数字
        let rowLength = numbers[0].length;
        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i].length !== rowLength) {
                throw new Error('matrix 每行长度不一致');
            }
        }

        let data = numbers.flat();
        return new DecMatrix(data, numbers.length, rowLength);
    },

    // 矩阵乘法
    matmul(x, y) {
        // 如果x是矩阵，y是矩阵，则返回矩阵
        if(isMatrix(x) && isMatrix(y)) {
            return x.matmul(y);
        }

        throw new Error('矩阵乘法参数错误');
    },



};


export { Utils, Datestamp, M_CONST };