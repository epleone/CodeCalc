/**
 * 解析时间字符串
 * 格式说明：
 * 1. 字符串以 '#' 开头
 * 2. 每个时间单位的格式为 (value)unit，其中：
 *    - value 可以是任意字符，包括嵌套的括号
 *    - unit 是时间单位的标识符
 * 3. 时间单位都是可选的，但如果出现必须按照以下顺序：
 *    年 -> 月 -> 周 -> 日 -> 时 -> 分 -> 秒 -> 毫秒
 * 4. 每个时间单位有三种可选的标识符：
 *    - 年：y, year, years
 *    - 月：m, month, months
 *    - 周：w, week, weeks
 *    - 日：d, day, days
 *    - 时：h, hour, hours
 *    - 分：mm, minute, minutes
 *    - 秒：s, second, seconds
 *    - 毫秒：ms, millisecond, milliseconds
 * 5. 时间字符串后可以跟随任意其他字符
 * 
 * 可以用状态机实现
 * 
 * @param {string} timeStr - 时间字符串
 * @returns {object} 解析后的时间对象，key为时间单位（复数形式），value为括号内的值
 */
function parseTimeString(timeStr) {
    // 定义时间单位及其标识符
    const timeUnits = {
        years: ['y', 'year', 'years'],
        months: ['m', 'month', 'months'],
        weeks: ['w', 'week', 'weeks'],
        days: ['d', 'day', 'days'],
        hours: ['h', 'hour', 'hours'],
        minutes: ['mm', 'minute', 'minutes'],
        seconds: ['s', 'second', 'seconds'],
        milliseconds: ['ms', 'millisecond', 'milliseconds']
    };

    // 简化状态枚举
    const State = {
        START: 'START',           
        EXPECT_OPEN: 'EXPECT_OPEN',   
        IN_BRACKETS: 'IN_BRACKETS',    // 改名以更好地表达状态含义
        EXPECT_UNIT: 'EXPECT_UNIT',
        END: 'END'
    };

    let state = State.START;
    let pos = 0;
    let currentValue = '';
    let bracketCount = 0;  // 用于追踪括号的配对
    let result = {};
    let unitOrder = Object.keys(timeUnits);
    let currentUnitIndex = 0;

    if (timeStr[0] !== '#') {
        return null;
    }
    pos++;

    while (pos < timeStr.length && state !== State.END) {
        const char = timeStr[pos];

        switch (state) {
            case State.START:
            case State.EXPECT_OPEN:
                if (char === '(') {
                    state = State.IN_BRACKETS;
                    bracketCount = 1;
                    currentValue = '';
                } else if (char === ' ' || char === '\t') {
                    // 忽略空白字符
                } else if (char === '+' || char === '-' || char === '\n') {
                    state = State.END;
                }
                break;

            case State.IN_BRACKETS:
                if (char === '(') {
                    bracketCount++;
                    currentValue += char;
                } else if (char === ')') {
                    bracketCount--;
                    if (bracketCount === 0) {
                        state = State.EXPECT_UNIT;
                    } else {
                        currentValue += char;
                    }
                } else {
                    currentValue += char;
                }
                break;

            case State.EXPECT_UNIT:
                let unitFound = false;
                for (let i = currentUnitIndex; i < unitOrder.length; i++) {
                    const unitKey = unitOrder[i];
                    const unitAliases = timeUnits[unitKey];
                    
                    for (const alias of unitAliases) {
                        if (timeStr.startsWith(alias, pos)) {
                            result[unitKey] = currentValue;
                            pos += alias.length - 1;
                            currentUnitIndex = i + 1;
                            state = State.EXPECT_OPEN;
                            unitFound = true;
                            break;
                        }
                    }
                    if (unitFound) break;
                }
                
                if (!unitFound && char !== ' ' && char !== '\t') {
                    return null;
                }
                break;
        }
        pos++;
    }

    return result;
}

/**
 * 解析可能包含多个时间字符串的文本
 * @param {string} text - 包含一个或多个时间字符串的文本
 * @returns {object} 合并后的时间对象
 */
// 最简单的处理就是使用 `#` split， 
// 然后 1. 处理每一段，给数字(正负数，小数)加括号， 2. 使用parseTimeString处理每一段
function parseTimeText(text) {
    const result = {};
    let startIndex = 0;

    while (true) {
        // 查找下一个 '#' 符号
        const hashIndex = text.indexOf('#', startIndex);
        if (hashIndex === -1) break;

        // 找到下一个 '#' 或文本结束作为当前时间字符串的结束位置
        const nextHash = text.indexOf('#', hashIndex + 1);
        const currentText = nextHash === -1 
            ? text.slice(hashIndex) 
            : text.slice(hashIndex, nextHash);

        // 解析当前时间字符串
        const timeObj = parseTimeString(currentText);
        if (timeObj) {
            // 合并解析结果
            Object.entries(timeObj).forEach(([unit, value]) => {
                if (!result[unit]) {
                    result[unit] = value;
                }
            });
        }

        // 更新开始位置
        startIndex = hashIndex + 1;
    }

    return Object.keys(result).length > 0 ? result : null;
}

// 修改测试用例
const testCases = [
    "#(2023)y(3)m(2)w(5)d(14)h(30)mm(45)s(500)ms",
    "#(2023)years(3)months",
    "#(14)hours(45)seconds + 1000",
    "#(2023)years(3)months(2)weeks",
    "#(14)h(45)s(500)milliseconds",
    "#(2023)y",
    "#(2023(nested))year(3)month",  // 测试嵌套括号
    "#(1+2x3)year(3+min(1,2,3))month",
    "#(1+2x3)year(3+min(1,2,3))month + #(14)h(45)s(500)milliseconds + #(1+2x3)w(3+min(1,2,3))d"  
];

// 更新测试代码
testCases.forEach(testStr => {
    console.log('输入:', testStr);
    console.log('解析结果:', parseTimeText(testStr));
    console.log('-'.repeat(50));
});
