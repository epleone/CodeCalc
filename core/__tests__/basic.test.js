import { Calculator } from '../calculator.js';

describe('Basic Functions and Operators Tests', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
  });

  describe('基本算术运算符', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('加法运算符 +', () => {
      expect(Calculator.calculate('1 + 2').value).toBe('3');
      expect(Calculator.calculate('1.5 + 2.5').value).toBe('4');
      expect(Calculator.calculate('-1 + 3').value).toBe('2');
      expect(Calculator.calculate('0 + 0').value).toBe('0');
      
      // 矩阵加法
      expect(Calculator.calculate('[1,2] + [3,4]').value).toBe('[4,6]');
      expect(Calculator.calculate('{1,2} + {3,4}').value).toBe('{4,6}');
    });

    test('减法运算符 -', () => {
      expect(Calculator.calculate('5 - 3').value).toBe('2');
      expect(Calculator.calculate('1.5 - 2.5').value).toBe('-1');
      expect(Calculator.calculate('-1 - 3').value).toBe('-4');
      expect(Calculator.calculate('0 - 5').value).toBe('-5');
      
      // 矩阵减法
      expect(Calculator.calculate('[5,6] - [3,4]').value).toBe('[2,2]');
      expect(Calculator.calculate('{5,6} - {3,4}').value).toBe('{2,2}');
    });

    test('乘法运算符 *', () => {
      expect(Calculator.calculate('3 * 4').value).toBe('12');
      expect(Calculator.calculate('1.5 * 2').value).toBe('3');
      expect(Calculator.calculate('-2 * 3').value).toBe('-6');
      expect(Calculator.calculate('0 * 100').value).toBe('0');

      expect(Calculator.calculate('0 * 100').value).toBe('0');
      expect(Calculator.calculate('3 * (1 + 2)').value).toBe('9');
      expect(Calculator.calculate('(1 + 2) * 3').value).toBe('9');
      expect(Calculator.calculate('(1 + 2) * (3 + 4)').value).toBe('21');

      // 矩阵乘法(点乘)
      expect(Calculator.calculate('[2,3] * [4,5]').value).toBe('[8,15]');
      expect(Calculator.calculate('{2,3} * {4,5}').value).toBe('{8,15}');
    });

    test('乘法运算符 x', () => {
      // 所有用例统一以小写 x 写模板，这里自动生成 x / X 两个变体
      const cases = [
        // 基本数字乘法
        { expr: '3 x 4', expected: '12', warnAsMultiply: true },
        { expr: '1.5 x 2', expected: '3', warnAsMultiply: true },
        { expr: '-2 x 3', expected: '-6', warnAsMultiply: true },

        // 基本数字乘法（紧凑写法，无空格）
        { expr: '3x4', expected: '12', warnAsMultiply: true },
        { expr: '1.5x2', expected: '3', warnAsMultiply: true },
        { expr: '-2x3', expected: '-6', warnAsMultiply: true },

        // 括号与 x 组合（左侧为数字）
        { expr: '3x(1 + 2)', expected: '9', warnAsMultiply: true },
        { expr: '3 x (1 + 2)', expected: '9', warnAsMultiply: true },

        // 括号与 x 组合（左侧为括号）
        { expr: '(1 + 2)x3', expected: '9', warnAsMultiply: true },
        { expr: '(1 + 2) x 3', expected: '9', warnAsMultiply: true },
        { expr: '(1 + 2)x(3 + 4)', expected: '21', warnAsMultiply: true },
        { expr: '(1 + 2) x (3 + 4)', expected: '21', warnAsMultiply: true },

        // 与 0 / 0x 相关的场景
        { expr: '0 x 100', expected: '0', warnAsMultiply: true },
        { expr: '0x 100', expected: '0', warnAsMultiply: true },
        // 16进制数（无空格）
        { expr: '0x100', expected: '256', warnAsMultiply: false },

        // 紧凑与带空格混合场景
        { expr: '100x100', expected: '10000', warnAsMultiply: true },
        { expr: '100 x100', expected: '10000', warnAsMultiply: true },
        { expr: '100x 100', expected: '10000', warnAsMultiply: true },
        { expr: '100 x 100', expected: '10000', warnAsMultiply: true },
      ];

      for (const { expr, expected, warnAsMultiply } of cases) {
        const lowerResult = Calculator.calculate(expr);
        expect(lowerResult.value).toBe(expected);
        if (warnAsMultiply) {
          expect(lowerResult.warning).toContain('使用x作为乘法符号');
        } else {
          expect(lowerResult.warning).toBe(null);
        }

        const upper = expr.replace(/x/g, 'X');
        const upperResult = Calculator.calculate(upper);
        expect(upperResult.value).toBe(expected);
        if (warnAsMultiply) {
          expect(upperResult.warning).toContain('使用X作为乘法符号');
        } else {
          expect(upperResult.warning).toBe(null);
        }
      }
    });

    test('x/X 和变量a=1一起使用', () => {
      Calculator.calculate('a=1');
      expect(Calculator.calculate('a*2').value).toBe('2');
      expect(Calculator.calculate('2*a').value).toBe('2');
      expect(Calculator.calculate('2 x a').value).toBe('2');
      expect(Calculator.calculate('2 X a').value).toBe('2');

      // x 字母粘连不当乘法
      expect(() => Calculator.calculate('ax2')).toThrow();
      expect(() => Calculator.calculate('aX2')).toThrow();
      expect(() => Calculator.calculate('2xa')).toThrow();
      expect(() => Calculator.calculate('2Xa')).toThrow();

      // 括号
      expect(Calculator.calculate('(a + 0)*2').value).toBe('2');
      expect(Calculator.calculate('(a + 0)x2').value).toBe('2');
      expect(Calculator.calculate('(a + 0)X2').value).toBe('2');
      expect(Calculator.calculate('2*(a + 0)').value).toBe('2');
      expect(Calculator.calculate('2x(a + 0)').value).toBe('2');
      expect(Calculator.calculate('2X(a + 0)').value).toBe('2');
    });


    test('x/X 和变量$1=1一起使用', () => {
      Calculator.calculate('$1=1');
      expect(Calculator.calculate('$1*2').value).toBe('2');
      expect(Calculator.calculate('$1x2').value).toBe('2');
      expect(Calculator.calculate('$1X2').value).toBe('2');
      expect(Calculator.calculate('2*$1').value).toBe('2');
      expect(Calculator.calculate('2 x $1').value).toBe('2');
      expect(Calculator.calculate('2 X $1').value).toBe('2');

      expect(Calculator.calculate('2x$1').value).toBe('2');
      expect(Calculator.calculate('2X$1').value).toBe('2');

      // 括号
      expect(Calculator.calculate('($1 + 0)*2').value).toBe('2');
      expect(Calculator.calculate('($1 + 0)x2').value).toBe('2');
      expect(Calculator.calculate('($1 + 0)X2').value).toBe('2');
      expect(Calculator.calculate('2*($1 + 0)').value).toBe('2');
      expect(Calculator.calculate('2x($1 + 0)').value).toBe('2');
      expect(Calculator.calculate('2X($1 + 0)').value).toBe('2');
    });


    test('x/X 和变量xy=1一起使用', () => {
      Calculator.calculate('xy=1');
      expect(Calculator.calculate('xy*2').value).toBe('2');
      expect(Calculator.calculate('xy x 2').value).toBe('2');
      expect(Calculator.calculate('xy X 2').value).toBe('2');
      expect(Calculator.calculate('xy x2').value).toBe('2');
      expect(Calculator.calculate('xy X2').value).toBe('2');

      expect(Calculator.calculate('2x xy').value).toBe('2');
      expect(Calculator.calculate('2X xy').value).toBe('2');
      expect(Calculator.calculate('2 x xy').value).toBe('2');
      expect(Calculator.calculate('2 X xy').value).toBe('2');

      // 字母粘连不当乘法
      expect(() => Calculator.calculate('xyx2')).toThrow();
      expect(() => Calculator.calculate('xyX2')).toThrow();
      expect(() => Calculator.calculate('xyx 2')).toThrow();
      expect(() => Calculator.calculate('xyX 2')).toThrow();

      expect(() => Calculator.calculate('2xxy')).toThrow();
      expect(() => Calculator.calculate('2Xxy')).toThrow();
      expect(() => Calculator.calculate('2 xxy')).toThrow();
      expect(() => Calculator.calculate('2 Xxy')).toThrow();
    });

    test('x/X 和变量ax=1一起使用', () => {
      Calculator.calculate('a=1');
      Calculator.calculate('ax=1');

      expect(Calculator.calculate('ax+1').value).toBe('2');
      expect(Calculator.calculate('ax*2').value).toBe('2');
      expect(Calculator.calculate('ax x 2').value).toBe('2');
      expect(Calculator.calculate('ax X 2').value).toBe('2');
      expect(Calculator.calculate('ax x2').value).toBe('2');
      expect(Calculator.calculate('ax X2').value).toBe('2');
      expect(Calculator.calculate('2x ax').value).toBe('2');
      expect(Calculator.calculate('2X ax').value).toBe('2');
      expect(Calculator.calculate('2 x ax').value).toBe('2');
      expect(Calculator.calculate('2 X ax').value).toBe('2');


      // 字母粘连不当乘法
      expect(() => Calculator.calculate('ax1')).toThrow();
      
      expect(() => Calculator.calculate('axx2')).toThrow();
      expect(() => Calculator.calculate('axX2')).toThrow();
      
      expect(() => Calculator.calculate('axx 2')).toThrow();
      expect(() => Calculator.calculate('axX 2')).toThrow();

      

      expect(() => Calculator.calculate('2xax')).toThrow();
      expect(() => Calculator.calculate('2Xax')).toThrow();
      expect(() => Calculator.calculate('2 xax')).toThrow();
      expect(() => Calculator.calculate('2 Xax')).toThrow();
    });


    test('x/X 和函数一起使用', () => {
      Calculator.calculate('a=1');
      expect(Calculator.calculate('max(a, 0)*2').value).toBe('2');
      expect(Calculator.calculate('max(a, 0)x2').value).toBe('2');
      expect(Calculator.calculate('max(a, 0)X2').value).toBe('2');
      expect(Calculator.calculate('2*max(a, 0)').value).toBe('2');
      expect(Calculator.calculate('2 x max(a, 0)').value).toBe('2');
      expect(Calculator.calculate('2 X max(a, 0)').value).toBe('2');

      // x 字母粘连不当乘法，避免与 xmax 等变量/函数名冲突
      expect(() => Calculator.calculate('2xmax(a, 0)')).toThrow();
      expect(() => Calculator.calculate('2Xmax(a, 0)')).toThrow();
    });


    test('x/X 作为变量名', () => {
      const xAssign = Calculator.calculate('x=1');
      expect(xAssign.value).toBe('1');
      expect(xAssign.warning).toContain('将无法使用x作为乘法符号');
      expect(() => Calculator.calculate('3x4')).toThrow('无法使用x作为乘法符号');
      expect(Calculator.calculate('3*4').value).toBe('12');

      const xUpperAssign = Calculator.calculate('X = 2');
      expect(xUpperAssign.value).toBe('2');
      expect(xUpperAssign.warning).toContain('将无法使用X作为乘法符号');
      expect(() => Calculator.calculate('3X4')).toThrow('无法使用X作为乘法符号');
      expect(Calculator.calculate('3*4').value).toBe('12');

      const xxAssign = Calculator.calculate('xX = x + X');
      expect(xxAssign.value).toBe('3');
      expect(xxAssign.warning).toBe(null);

      const xxRead = Calculator.calculate('xX');
      expect(xxRead.value).toBe('3');
      expect(xxRead.warning).toBe(null);
    });


    test('除法运算符 /', () => {
      expect(Calculator.calculate('8 / 2').value).toBe('4');
      expect(Calculator.calculate('7 / 2').value).toBe('3.5');
      expect(Calculator.calculate('-6 / 3').value).toBe('-2');
      
      // 除零错误
      expect(Calculator.calculate('1 / 0').value).toBe('Infinity');
      
      // 矩阵除法
      expect(Calculator.calculate('[8,6] / [2,3]').value).toBe('[4,2]');
      expect(Calculator.calculate('{8,6} / {2,3}').value).toBe('{4,2}');
    });

    test('整除运算符 //', () => {
      expect(Calculator.calculate('7 // 2').value).toBe('3');
      expect(Calculator.calculate('8 // 3').value).toBe('2');
      expect(Calculator.calculate('-7 // 2').value).toBe('-4');
      expect(Calculator.calculate('7 // -2').value).toBe('-4');
    });

    test('取模运算符 %', () => {
      expect(Calculator.calculate('7 % 3').value).toBe('1');
      expect(Calculator.calculate('8 % 4').value).toBe('0');
      expect(Calculator.calculate('-7 % 3').value).toBe('-1');
      expect(Calculator.calculate('7 % (-3)').value).toBe('1');
      expect(Calculator.calculate('7 % -3').value).toBe('-2.93');
      expect(Calculator.calculate('50% + 1').value).toBe('1.5');
      expect(() => Calculator.calculate('%50')).toThrow('百分号前缺少操作数');
    });

    test('函数参数分隔符回归', () => {
      expect(Calculator.calculate('max(1,2)').value).toBe('2');
      expect(Calculator.calculate('max(1, 2, 3)').value).toBe('3');
      expect(() => Calculator.calculate('max(1 2)')).toThrow();
      expect(() => Calculator.calculate('max(1, 2 3)')).toThrow();
    });

    test('幂运算符 **', () => {
      expect(Calculator.calculate('2 ** 3').value).toBe('8');
      expect(Calculator.calculate('4 ** 0.5').value).toBe('2');
      expect(Calculator.calculate('2 ** -2').value).toBe('0.25');
      expect(Calculator.calculate('(-2) ** 2').value).toBe('4');

      // ^ 作为幂运算别名
      expect(Calculator.calculate('2 ^ 3').value).toBe('8');
      expect(Calculator.calculate('4 ^ 0.5').value).toBe('2');
      expect(Calculator.calculate('2 ^ -2').value).toBe('0.25');
      expect(Calculator.calculate('(-2) ^ 2').value).toBe('4');
    });
  });

  describe('数字分隔符', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('基本运算', () => {
      expect(Calculator.calculate('1,000.00+1,000.00').value).toBe('2000');
      expect(Calculator.calculate('2,000.00-1,000.00').value).toBe('1000');
      expect(Calculator.calculate('1,000.00*1,000.00').value).toBe('1000000');
      expect(Calculator.calculate('1,000.00x1,000.00').value).toBe('1000000');
      expect(Calculator.calculate('1,000.00X1,000.00').value).toBe('1000000');
      expect(Calculator.calculate('1,000.00/1,000.00').value).toBe('1');
      expect(Calculator.calculate('55,451,244.00+43,574,121.00').value).toBe('99025365');
    });

    test('括号运算', () => {
      expect(Calculator.calculate('(1,000.00+1,000.00)').value).toBe('2000');
      expect(Calculator.calculate('(2,000.00-1,000.00)').value).toBe('1000');
      expect(Calculator.calculate('(1,000.00*1,000.00)').value).toBe('1000000');
      expect(Calculator.calculate('(1,000.00x1,000.00)').value).toBe('1000000');
      expect(Calculator.calculate('(1,000.00X1,000.00)').value).toBe('1000000');
      expect(Calculator.calculate('(1,000.00/1,000.00)').value).toBe('1');
      expect(Calculator.calculate('(55,451,244.00+43,574,121.00)').value).toBe('99025365');
    });

    test('括号复合运算', () => {
      expect(Calculator.calculate('(1,000.00+1,000.00)+0').value).toBe('2000');
      expect(Calculator.calculate('(2,000.00-1,000.00)*1').value).toBe('1000');
      expect(Calculator.calculate('(1,000.00*1,000.00)/1').value).toBe('1000000');
      expect(Calculator.calculate('(1,000.00x1,000.00)x1').value).toBe('1000000');
      expect(Calculator.calculate('(1,000.00X1,000.00)X1').value).toBe('1000000');
      expect(Calculator.calculate('(1,000.00/1,000.00)/1').value).toBe('1');
      expect(Calculator.calculate('(55,451,244.00+43,574,121.00)+0').value).toBe('99025365');
    });
 
    test('函数参数与矩阵副作用测试', () => {
      // 函数参数（逗号作为参数分隔符，不会被识别为千分位）
      expect(Calculator.calculate('max(1,000, 2,000)').value).toBe('2');  // 相当于 max(1, 0, 2, 0)
      expect(Calculator.calculate('max(1,234)').value).toBe('234'); 
      expect(Calculator.calculate('max(1,23)').value).toBe('23'); 
      expect(Calculator.calculate('max(1,2345)').value).toBe('2345'); 
      
      // 矩阵/数组（逗号作为元素分隔符，不会被识别为千分位）
      expect(Calculator.calculate('[1,000, 2,000]').value).toBe('[1,0,2,0]');
      expect(Calculator.calculate('{1,000, 2,000; 3,000, 4,000}').value).toBe('{1,0,2,0;3,0,4,0}');
      expect(Calculator.calculate('[1, 234]').value).toBe('[1,234]');
      expect(Calculator.calculate('[1,23]').value).toBe('[1,23]');
      
      // 字符串字面量（保留原样）
      expect(Calculator.calculate('length("1,000")').value).toBe('5');
      expect(Calculator.calculate('"1,000"').value).toBe('1,000');
      expect(Calculator.calculate('max(length(")]}"), 2,000)').value).toBe('3');
      expect(Calculator.calculate('(1,000 + length(")"))').value).toBe('1001');
      
      // 负数和小数（正常识别千分位）
      expect(Calculator.calculate('-1,234.56 * 2').value).toBe('-2469.12');
      
      // 嵌套情况：函数外的千分位正常解析，函数内的逗号作为分隔符
      expect(Calculator.calculate('1,000 + max(1,000)').value).toBe('1001'); // 1000 + max(1, 0)
      expect(Calculator.calculate('[1,000, 2,000] + 1').value).toBe('[2,1,3,1]');
      expect(Calculator.calculate('1 + [1,000, 2,000] + 0').value).toBe('[2,1,3,1]');
      expect(Calculator.calculate('1,000 + [1,000,2,000] + 2,000').value).toBe('[3001,3000,3002,3000]');
      expect(Calculator.calculate('1,000 + {1,000,2,000} + 2,000').value).toBe('{3001,3000,3002,3000}');
      expect(Calculator.calculate('1,000 + {1,000,2,000} + max(1,000)').value).toBe('{1002,1001,1003,1001}');
    });
  });

  describe('比较运算符', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('等于运算符 ==', () => {
      expect(Calculator.calculate('5 == 5').value).toBe('true');
      expect(Calculator.calculate('5 == 6').value).toBe('false');
      expect(Calculator.calculate('0 == 0').value).toBe('true');
      expect(Calculator.calculate('-1 == -1').value).toBe('true');
      expect(Calculator.calculate('3.14 == 3.14').value).toBe('true');
      expect(Calculator.calculate('3.14 == 3.15').value).toBe('false');
      
      // 数学常数比较
      expect(Calculator.calculate('pi == 3.14159').value).toBe('false'); // 精度不同
      expect(Calculator.calculate('e == 2.71828').value).toBe('false'); // 精度不同
    });

    test('不等于运算符 !=', () => {
      expect(Calculator.calculate('5 != 6').value).toBe('true');
      expect(Calculator.calculate('5 != 5').value).toBe('false');
      expect(Calculator.calculate('0 != 1').value).toBe('true');
      expect(Calculator.calculate('-1 != 1').value).toBe('true');
      expect(Calculator.calculate('3.14 != 3.15').value).toBe('true');
      expect(Calculator.calculate('3.14 != 3.14').value).toBe('false');
    });

    test('大于运算符 >', () => {
      expect(Calculator.calculate('5 > 3').value).toBe('true');
      expect(Calculator.calculate('3 > 5').value).toBe('false');
      expect(Calculator.calculate('0 > -1').value).toBe('true');
      expect(Calculator.calculate('-1 > 0').value).toBe('false');
      expect(Calculator.calculate('3.14 > 3.13').value).toBe('true');
      expect(Calculator.calculate('3.13 > 3.14').value).toBe('false');
      
      // 边界值
      expect(Calculator.calculate('1 > 1').value).toBe('false');
      expect(Calculator.calculate('0 > 0').value).toBe('false');
      expect(Calculator.calculate('-1 > -1').value).toBe('false');
    });

    test('小于运算符 <', () => {
      expect(Calculator.calculate('3 < 5').value).toBe('true');
      expect(Calculator.calculate('5 < 3').value).toBe('false');
      expect(Calculator.calculate('-1 < 0').value).toBe('true');
      expect(Calculator.calculate('0 < -1').value).toBe('false');
      expect(Calculator.calculate('3.13 < 3.14').value).toBe('true');
      expect(Calculator.calculate('3.14 < 3.13').value).toBe('false');
      
      // 边界值
      expect(Calculator.calculate('1 < 1').value).toBe('false');
      expect(Calculator.calculate('0 < 0').value).toBe('false');
      expect(Calculator.calculate('-1 < -1').value).toBe('false');
    });

    test('大于等于运算符 >=', () => {
      expect(Calculator.calculate('5 >= 3').value).toBe('true');
      expect(Calculator.calculate('5 >= 5').value).toBe('true');
      expect(Calculator.calculate('3 >= 5').value).toBe('false');
      expect(Calculator.calculate('0 >= -1').value).toBe('true');
      expect(Calculator.calculate('0 >= 0').value).toBe('true');
      expect(Calculator.calculate('-1 >= 0').value).toBe('false');
      expect(Calculator.calculate('3.14 >= 3.14').value).toBe('true');
      expect(Calculator.calculate('3.14 >= 3.13').value).toBe('true');
    });

    test('小于等于运算符 <=', () => {
      expect(Calculator.calculate('3 <= 5').value).toBe('true');
      expect(Calculator.calculate('5 <= 5').value).toBe('true');
      expect(Calculator.calculate('5 <= 3').value).toBe('false');
      expect(Calculator.calculate('-1 <= 0').value).toBe('true');
      expect(Calculator.calculate('0 <= 0').value).toBe('true');
      expect(Calculator.calculate('0 <= -1').value).toBe('false');
      expect(Calculator.calculate('3.14 <= 3.14').value).toBe('true');
      expect(Calculator.calculate('3.13 <= 3.14').value).toBe('true');
    });

    test('比较运算符优先级', () => {
      // 比较运算符优先级低于算术运算符
      expect(Calculator.calculate('2 + 3 > 4').value).toBe('true');  // (2+3) > 4
      expect(Calculator.calculate('2 * 3 < 7').value).toBe('true');  // (2*3) < 7
      expect(Calculator.calculate('10 - 5 >= 3 + 2').value).toBe('true'); // (10-5) >= (3+2)
      expect(Calculator.calculate('8 / 2 <= 3 + 1').value).toBe('true');  // (8/2) <= (3+1)
    });

    test('比较运算符与函数结合', () => {
      expect(Calculator.calculate('sin(0) == 0').value).toBe('true');
      expect(Calculator.calculate('cos(0) == 1').value).toBe('true');
      expect(Calculator.calculate('sqrt(4) > 1').value).toBe('true');
      expect(Calculator.calculate('pow(2,3) >= 8').value).toBe('true');
      expect(Calculator.calculate('abs(-5) == 5').value).toBe('true');
    });

  });

  describe('一元运算符', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('负号 unary-', () => {
      expect(Calculator.calculate('-5').value).toBe('-5');
      expect(Calculator.calculate('--5').value).toBe('5');
      expect(Calculator.calculate('-(-3)').value).toBe('3');
      
      // 矩阵负号
      expect(Calculator.calculate('-[1,2]').value).toBe('[-1,-2]');
      expect(Calculator.calculate('-{1,2}').value).toBe('{-1,-2}');
    });

    test('正号 unary+', () => {
      expect(Calculator.calculate('+5').value).toBe('5');
      expect(Calculator.calculate('+-5').value).toBe('-5');
      expect(Calculator.calculate('+(-3)').value).toBe('-3');
    });

    test('百分号 %', () => {
      expect(Calculator.calculate('50%').value).toBe('0.5');
      expect(Calculator.calculate('100%').value).toBe('1');
      expect(Calculator.calculate('25%').value).toBe('0.25');
      expect(Calculator.calculate('0%').value).toBe('0');
    });

    test('千分号 ‰', () => {
      expect(Calculator.calculate('500‰').value).toBe('0.5');
      expect(Calculator.calculate('1000‰').value).toBe('1');
      expect(Calculator.calculate('250‰').value).toBe('0.25');
      expect(Calculator.calculate('0‰').value).toBe('0');
    });

    test('阶乘 !', () => {
      expect(Calculator.calculate('0!').value).toBe('1');
      expect(Calculator.calculate('1!').value).toBe('1');
      expect(Calculator.calculate('5!').value).toBe('120');
      expect(Calculator.calculate('10!').value).toBe('3628800');
      
      // 错误情况
      expect(() => Calculator.calculate('(-1)!')).toThrow();
      expect(() => Calculator.calculate('1.5!')).toThrow();
      expect(Calculator.calculate('151!').value).toBe('Infinity');
    });
  });

  describe('位运算符', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('按位与 &', () => {
      expect(Calculator.calculate('5 & 3').value).toBe('1');
      expect(Calculator.calculate('12 & 7').value).toBe('4');
      expect(Calculator.calculate('0 & 15').value).toBe('0');
      
      // 别名测试
      expect(Calculator.calculate('5 and 3').value).toBe('1');
    });

    test('按位或 |', () => {
      expect(Calculator.calculate('5 | 3').value).toBe('7');
      expect(Calculator.calculate('12 | 7').value).toBe('15');
      expect(Calculator.calculate('0 | 15').value).toBe('15');
      
      // 别名测试
      expect(Calculator.calculate('5 or 3').value).toBe('7');
    });

    test('按位异或 ^^ / xor', () => {
      expect(Calculator.calculate('5 ^^ 3').value).toBe('6');
      expect(Calculator.calculate('12 ^^ 7').value).toBe('11');
      expect(Calculator.calculate('15 ^^ 15').value).toBe('0');

      expect(Calculator.calculate('5 xor 3').value).toBe('6');
      expect(Calculator.calculate('12 xor 7').value).toBe('11');
      expect(Calculator.calculate('15 xor 15').value).toBe('0');
    });

    test('按位取反 ~', () => {
      expect(Calculator.calculate('~5').value).toBe('-6');
      expect(Calculator.calculate('~(-1)').value).toBe('0');
      expect(Calculator.calculate('~0').value).toBe('-1');
      
      // 别名测试
      expect(Calculator.calculate('not 5').value).toBe('-6');
    });

    test('左移 <<', () => {
      expect(Calculator.calculate('5 << 1').value).toBe('10');
      expect(Calculator.calculate('5 << 2').value).toBe('20');
      expect(Calculator.calculate('1 << 3').value).toBe('8');
    });

    test('右移 >>', () => {
      expect(Calculator.calculate('20 >> 1').value).toBe('10');
      expect(Calculator.calculate('20 >> 2').value).toBe('5');
      expect(Calculator.calculate('8 >> 3').value).toBe('1');
    });

    test('无符号右移 >>>', () => {
      expect(Calculator.calculate('20 >>> 1').value).toBe('10');
      expect(Calculator.calculate('-1 >>> 1').value).toBe('2147483647');
      expect(Calculator.calculate('8 >>> 3').value).toBe('1');
    });
  });

  describe('赋值运算符', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('基本赋值 =', () => {
      expect(Calculator.calculate('a = 5').value).toBe('5');
      expect(Calculator.calculate('a').value).toBe('5');

      // 字母型 op: and, or, not 在变量名中
      expect(Calculator.calculate('short = 1').value).toBe('1');
      expect(Calculator.calculate('sand2 = 1').value).toBe('1');
      expect(Calculator.calculate('snotk = 1').value).toBe('1');

      expect(Calculator.calculate('a = true').value).toBe('true');
      expect(Calculator.calculate('a').value).toBe('true');

      expect(Calculator.calculate('a = false').value).toBe('false');
      expect(Calculator.calculate('a').value).toBe('false');

      expect(Calculator.calculate('b = [1,2,3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('b').value).toBe('[1,2,3]');
      expect(() => Calculator.calculate('1 = 2')).toThrow('赋值运算符左侧必须是变量名');
      expect(() => Calculator.calculate('a + 1 = 2')).toThrow('赋值运算符左侧必须是变量名');
      expect(() => Calculator.calculate('d')).toThrow('变量 "d" 未定义');
    });

    test('加法赋值 +=', () => {
      expect(Calculator.calculate('a = 5').value).toBe('5');
      expect(Calculator.calculate('a += 3').value).toBe('8');
      expect(Calculator.calculate('a').value).toBe('8');
    });

    test('复合赋值作为赋值右侧表达式时不应重复执行', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('$2 = a += 1').value).toBe('2');
      expect(Calculator.calculate('a').value).toBe('2');
      expect(Calculator.calculate('$2').value).toBe('2');
    });

    test('包裹场景下各复合赋值都只执行一次', () => {
      const cases = [
        { op: '+=', init: '1', rhs: '1', expected: '2' },
        { op: '-=', init: '3', rhs: '1', expected: '2' },
        { op: '*=', init: '3', rhs: '2', expected: '6' },
        { op: '/=', init: '8', rhs: '2', expected: '4' },
        { op: '&=', init: '5', rhs: '3', expected: '1' },
        { op: '|=', init: '5', rhs: '3', expected: '7' },
        { op: '^=', init: '5', rhs: '3', expected: '6' },
        { op: '<<=', init: '5', rhs: '2', expected: '20' },
        { op: '>>=', init: '20', rhs: '2', expected: '5' },
        { op: '>>>=', init: '20', rhs: '2', expected: '5' },
      ];

      for (const { op, init, rhs, expected } of cases) {
        Calculator.clearAllCache();
        expect(Calculator.calculate('a = ' + init).value).toBe(init);
        expect(Calculator.calculate('$2 = a ' + op + ' ' + rhs).value).toBe(expected);
        expect(Calculator.calculate('a').value).toBe(expected);
        expect(Calculator.calculate('$2').value).toBe(expected);
      }
    });

    test('链式复合赋值在包裹场景下不重复求值', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = 1').value).toBe('1');
      expect(Calculator.calculate('$3 = a += (b += 2)').value).toBe('4');
      expect(Calculator.calculate('a').value).toBe('4');
      expect(Calculator.calculate('b').value).toBe('3');
      expect(Calculator.calculate('$3').value).toBe('4');
    });

    test('减法赋值 -=', () => {
      expect(Calculator.calculate('a = 10').value).toBe('10');
      expect(Calculator.calculate('a -= 3').value).toBe('7');
      expect(Calculator.calculate('a').value).toBe('7');
    });

    test('乘法赋值 *=', () => {
      expect(Calculator.calculate('a = 4').value).toBe('4');
      expect(Calculator.calculate('a *= 3').value).toBe('12');
      expect(Calculator.calculate('a').value).toBe('12');
    });

    test('除法赋值 /=', () => {
      expect(Calculator.calculate('a = 12').value).toBe('12');
      expect(Calculator.calculate('a /= 3').value).toBe('4');
      expect(Calculator.calculate('a').value).toBe('4');
    });

    test('按位与赋值 &=', () => {
      expect(Calculator.calculate('a = 5').value).toBe('5');
      expect(Calculator.calculate('a &= 3').value).toBe('1');
      expect(Calculator.calculate('a').value).toBe('1');
    });

    test('按位或赋值 |=', () => {
      expect(Calculator.calculate('a = 5').value).toBe('5');
      expect(Calculator.calculate('a |= 3').value).toBe('7');
      expect(Calculator.calculate('a').value).toBe('7');
    });

    test('按位异或赋值 ^=', () => {
      expect(Calculator.calculate('a = 5').value).toBe('5');
      expect(Calculator.calculate('a ^= 3').value).toBe('6');
      expect(Calculator.calculate('a').value).toBe('6');
    });

    test('左移赋值 <<=', () => {
      expect(Calculator.calculate('a = 5').value).toBe('5');
      expect(Calculator.calculate('a <<= 2').value).toBe('20');
      expect(Calculator.calculate('a').value).toBe('20');
    });

    test('右移赋值 >>=', () => {
      expect(Calculator.calculate('a = 20').value).toBe('20');
      expect(Calculator.calculate('a >>= 2').value).toBe('5');
      expect(Calculator.calculate('a').value).toBe('5');
    });

    test('无符号右移赋值 >>>=', () => {
      expect(Calculator.calculate('a = 20').value).toBe('20');
      expect(Calculator.calculate('a >>>= 2').value).toBe('5');
      expect(Calculator.calculate('a').value).toBe('5');
    });
  });

  describe('类型转换函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('str - 转换为字符串', () => {
      expect(Calculator.calculate('str(123)').value).toBe('123');
      expect(Calculator.calculate('str(3.14)').value).toBe('3.14');
      expect(Calculator.calculate('str(true)').value).toBe('true');
    });

    test('num - 转换为数字', () => {
      expect(Calculator.calculate('num(123)').value).toBe('123');
      expect(Calculator.calculate('num(3.14)').value).toBe('3.14');
    });
  });

  describe('数学函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('max - 求最大值', () => {
      expect(Calculator.calculate('max(1, 2, 3)').value).toBe('3');
      expect(Calculator.calculate('max(-1, -2, -3)').value).toBe('-1');
      expect(Calculator.calculate('max(1.5, 2.3, 1.8)').value).toBe('2.3');
      
      // 矩阵最大值
      expect(Calculator.calculate('max([1,2,3])').value).toBe('3');
      expect(Calculator.calculate('max({1,2;3,4})').value).toBe('4');
    });

    test('min - 求最小值', () => {
      expect(Calculator.calculate('min(1, 2, 3)').value).toBe('1');
      expect(Calculator.calculate('min(-1, -2, -3)').value).toBe('-3');
      expect(Calculator.calculate('min(1.5, 2.3, 1.8)').value).toBe('1.5');
      
      // 矩阵最小值
      expect(Calculator.calculate('min([1,2,3])').value).toBe('1');
      expect(Calculator.calculate('min({1,2;3,4})').value).toBe('1');
    });

    test('sum - 求和', () => {
      expect(Calculator.calculate('sum([1,2,3])').value).toBe('6');
      expect(Calculator.calculate('sum({1,2;3,4})').value).toBe('10');
      expect(Calculator.calculate('sum([1.5, 2.5, 3])').value).toBe('7');
    });

    test('mean/avg - 求平均值', () => {
      expect(Calculator.calculate('mean([1,2,3])').value).toBe('2');
      expect(Calculator.calculate('avg([1,2,3])').value).toBe('2');
      expect(Calculator.calculate('mean({1,2;3,4})').value).toBe('2.5');
      expect(Calculator.calculate('mean([2,4,6])').value).toBe('4');
    });

    test('median - 求中位数', () => {
      expect(Calculator.calculate('median([1,2,3])').value).toBe('2');
      expect(Calculator.calculate('median([1,2,3,4])').value).toBe('2.5');
      expect(Calculator.calculate('median([3,1,2])').value).toBe('2');
    });

    test('var - 求方差', () => {
      expect(() => Calculator.calculate('var([1,2,3])')).not.toThrow();
      expect(() => Calculator.calculate('var({1,2;3,4})')).not.toThrow();
    });

    test('std - 求标准差', () => {
      expect(() => Calculator.calculate('std([1,2,3])')).not.toThrow();
      expect(() => Calculator.calculate('std({1,2;3,4})')).not.toThrow();
    });

    test('sort - 排序', () => {
      expect(Calculator.calculate('sort([3,1,2])').value).toBe('[1,2,3]');
      expect(Calculator.calculate('sort([1,-2,3])').value).toBe('[-2,1,3]');
    });
  });

  describe('对数函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('lg - 以10为底的对数', () => {
      expect(Calculator.calculate('lg(10)').value).toBe('1');
      expect(Calculator.calculate('lg(100)').value).toBe('2');
      expect(Calculator.calculate('lg(1)').value).toBe('0');
      
      // 矩阵对数
      expect(Calculator.calculate('lg([1,10,100])').value).toBe('[0,1,2]');
    });

    test('lb - 以2为底的对数', () => {
      expect(Calculator.calculate('lb(2)').value).toBe('1');
      expect(Calculator.calculate('lb(8)').value).toBe('3');
      expect(Calculator.calculate('lb(1)').value).toBe('0');
      
      // 矩阵对数
      expect(Calculator.calculate('lb([1,2,4])').value).toBe('[0,1,2]');
    });

    test('log - 指定底数的对数', () => {
      expect(Calculator.calculate('log(10, 100)').value).toBe('2');
      expect(Calculator.calculate('log(2, 8)').value).toBe('3');
      expect(Calculator.calculate('log(3, 9)').value).toBe('2');
    });

    test('ln - 自然对数', () => {
      expect(Calculator.calculate('ln(e)').value).toBe('1');
      expect(Calculator.calculate('ln(1)').value).toBe('0');
      
      // 矩阵自然对数
      expect(() => Calculator.calculate('ln([1,e])')).not.toThrow();
    });

    test('exp - e的指数', () => {
      expect(Calculator.calculate('exp(0)').value).toBe('1');
      expect(Calculator.calculate('exp(1)').value).toBe(Calculator.calculate('e').value);
      
      // 矩阵指数
      expect(() => Calculator.calculate('exp([0,1])')).not.toThrow();
    });
  });

  describe('取整函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('round - 四舍五入', () => {
      expect(Calculator.calculate('round(3.4)').value).toBe('3');
      expect(Calculator.calculate('round(3.6)').value).toBe('4');
      expect(Calculator.calculate('round(-3.4)').value).toBe('-3');
      expect(Calculator.calculate('round(-3.6)').value).toBe('-4');
      
      // 矩阵四舍五入
      expect(Calculator.calculate('round([3.4, 3.6])').value).toBe('[3,4]');
    });

    test('roundfix - 指定小数位数四舍五入', () => {
      expect(Calculator.calculate('roundfix(3.14159, 2)').value).toBe('3.14');
      expect(Calculator.calculate('roundfix(3.14159, 0)').value).toBe('3');
      expect(Calculator.calculate('roundfix(3.14159, -1)').value).toBe('3.1416');
    });

    test('floor - 向下取整', () => {
      expect(Calculator.calculate('floor(3.9)').value).toBe('3');
      expect(Calculator.calculate('floor(-3.1)').value).toBe('-4');
      expect(Calculator.calculate('floor(5)').value).toBe('5');
      
      // 矩阵向下取整
      expect(Calculator.calculate('floor([3.9, -3.1])').value).toBe('[3,-4]');
    });

    test('ceil - 向上取整', () => {
      expect(Calculator.calculate('ceil(3.1)').value).toBe('4');
      expect(Calculator.calculate('ceil(-3.9)').value).toBe('-3');
      expect(Calculator.calculate('ceil(5)').value).toBe('5');
      
      // 矩阵向上取整
      expect(Calculator.calculate('ceil([3.1, -3.9])').value).toBe('[4,-3]');
    });

    test('clamp - 设置数值范围', () => {
      expect(Calculator.calculate('clamp(5, 1, 10)').value).toBe('5');
      expect(Calculator.calculate('clamp(15, 1, 10)').value).toBe('10');
      expect(Calculator.calculate('clamp(-5, 1, 10)').value).toBe('1');
    });
  });

  describe('随机数函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('random - 随机数生成', () => {
      // 标量：值在 [0, 1)
      const scalar = parseFloat(Calculator.calculate('random()').value);
      expect(scalar).toBeGreaterThanOrEqual(0);
      expect(scalar).toBeLessThan(1);

      // 向量：形状
      expect(Calculator.calculate('random(3)').value).toMatch(/^\[[0-9.]+,[0-9.]+,[0-9.]+\]$/);

      // 矩阵：2×3 形状
      expect(Calculator.calculate('random(2, 3)').value)
        .toMatch(/^\{[0-9.]+,[0-9.]+,[0-9.]+;[0-9.]+,[0-9.]+,[0-9.]+\}$/);

      // 参数错误
      expect(() => Calculator.calculate('random(2, 3, 4)')).toThrow();
    });

    test('random - 后缀调用 .random', () => {
      // n.random ≡ random(n)，生成长度为 n 的向量
      expect(Calculator.calculate('3.random').value).toMatch(/^\[[0-9.]+,[0-9.]+,[0-9.]+\]$/);
      expect(Calculator.calculate('1.random').value).toMatch(/^\[[0-9.]+\]$/);

      const elems = Calculator.calculate('3.random').value.slice(1, -1).split(',');
      expect(elems).toHaveLength(3);
      for (const e of elems) {
        const n = parseFloat(e);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1);
      }
    });
  });

  describe('三角函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('sin - 正弦函数', () => {
      expect(Calculator.calculate('sin(0)').value).toBe('0');
      expect(Calculator.calculate('sin(pi/2)').value).toBe('1');
      expect(Calculator.calculate('sin(pi)').value).toBe('0');
      expect(Calculator.calculate('sin(-pi/2)').value).toBe('-1');
      expect(Calculator.calculate('sin(-pi)').value).toBe('0');
      expect(Calculator.calculate('sin(2*pi)').value).toBe('0');

      // 特殊值
      expect(Calculator.calculate('sin(pi/6)').value).toBe('0.5');
      expect(Calculator.calculate('sin(-pi/6)').value).toBe('-0.5');

      // 矩阵正弦
      expect(() => Calculator.calculate('sin([0, pi/2])')).not.toThrow();
    });

    test('cos - 余弦函数', () => {
      expect(Calculator.calculate('cos(0)').value).toBe('1');
      expect(Calculator.calculate('cos(pi/2)').value).toBe('0');
      expect(Calculator.calculate('cos(pi)').value).toBe('-1');
      expect(Calculator.calculate('cos(-pi/2)').value).toBe('0');
      expect(Calculator.calculate('cos(-pi)').value).toBe('-1');
      expect(Calculator.calculate('cos(2*pi)').value).toBe('1');

      // 特殊值
      expect(Calculator.calculate('cos(pi/3)').value).toBe('0.5');
      expect(Calculator.calculate('cos(-pi/3)').value).toBe('0.5');
      
      // 矩阵余弦
      expect(() => Calculator.calculate('cos([0, pi/2])')).not.toThrow();
    });

    test('tan - 正切函数', () => {
      expect(Calculator.calculate('tan(0)').value).toBe('0');
      expect(Calculator.calculate('tan(pi/4)').value).toBe('1');
      
      // 矩阵正切
      expect(() => Calculator.calculate('tan([0, pi/4])')).not.toThrow();
    });

    test('asin - 反正弦函数', () => {
      expect(Calculator.calculate('asin(0)').value).toBe('0');
      expect(Calculator.calculate('asin(0)').info).toContain('弧度: 0 | 角度: 0°');
      expect(Calculator.calculate('asin(1)').value).toBe(Calculator.calculate('pi/2').value);
      expect(Calculator.calculate('asin(1)').info).toContain('弧度: π/2 | 角度: 90°');
      expect(Calculator.calculate('asin(-1)').value).toBe(Calculator.calculate('-pi/2').value);
      expect(Calculator.calculate('asin(-1)').info).toContain('弧度: -π/2 | 角度: 270°');

      // 超出定义域错误
      expect(Calculator.calculate('asin(2)').value).toBe('NaN');
      expect(Calculator.calculate('asin(2)').info).toBe(null);
    });

    test('acos - 反余弦函数', () => {
      expect(Calculator.calculate('acos(1)').value).toBe('0');
      expect(Calculator.calculate('acos(1)').info).toContain('弧度: 0 | 角度: 0°');
      expect(Calculator.calculate('acos(0)').value).toBe(Calculator.calculate('pi/2').value);
      expect(Calculator.calculate('acos(0)').info).toContain('弧度: π/2 | 角度: 90°');
      expect(Calculator.calculate('acos(-1)').value).toBe(Calculator.calculate('pi').value);
      expect(Calculator.calculate('acos(-1)').info).toContain('弧度: π | 角度: 180°');

      // 超出定义域错误
      expect(Calculator.calculate('acos(2)').value).toBe('NaN');
      expect(Calculator.calculate('acos(2)').info).toBe(null);
    });

    test('atan - 反正切函数', () => {
      expect(Calculator.calculate('atan(0)').value).toBe('0');
      expect(Calculator.calculate('atan(0)').info).toContain('弧度: 0 | 角度: 0°');
      expect(Calculator.calculate('atan(1)').value).toBe(Calculator.calculate('pi/4').value);
      expect(Calculator.calculate('atan(1)').info).toContain('弧度: π/4 | 角度: 45°');
      expect(Calculator.calculate('atan(-1)').value).toBe(Calculator.calculate('-pi/4').value);
      expect(Calculator.calculate('atan(-1)').info).toContain('弧度: -π/4 | 角度: 315°');
    });
  });

  describe('双曲函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('sinh - 双曲正弦', () => {
      expect(Calculator.calculate('sinh(0)').value).toBe('0');
      expect(() => Calculator.calculate('sinh(1)')).not.toThrow();
      expect(() => Calculator.calculate('sinh([0,1])')).not.toThrow();
    });

    test('cosh - 双曲余弦', () => {
      expect(Calculator.calculate('cosh(0)').value).toBe('1');
      expect(() => Calculator.calculate('cosh(1)')).not.toThrow();
      expect(() => Calculator.calculate('cosh([0,1])')).not.toThrow();
    });

    test('tanh - 双曲正切', () => {
      expect(Calculator.calculate('tanh(0)').value).toBe('0');
      expect(() => Calculator.calculate('tanh(1)')).not.toThrow();
      expect(() => Calculator.calculate('tanh([0,1])')).not.toThrow();
    });
  });

  describe('其他数学函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('sqrt - 平方根', () => {
      expect(Calculator.calculate('sqrt(4)').value).toBe('2');
      expect(Calculator.calculate('sqrt(9)').value).toBe('3');
      expect(Calculator.calculate('sqrt(0)').value).toBe('0');
      
      // 矩阵平方根
      expect(Calculator.calculate('sqrt([4,9,16])').value).toBe('[2,3,4]');
    });

    test('pow - 幂函数', () => {
      expect(Calculator.calculate('pow(2, 3)').value).toBe('8');
      expect(Calculator.calculate('pow(4, 0.5)').value).toBe('2');
      expect(Calculator.calculate('pow(2, -1)').value).toBe('0.5');
    });

    test('abs - 绝对值', () => {
      expect(Calculator.calculate('abs(5)').value).toBe('5');
      expect(Calculator.calculate('abs(-5)').value).toBe('5');
      expect(Calculator.calculate('abs(0)').value).toBe('0');
      
      // 作为属性使用
      expect(Calculator.calculate('(-5).abs').value).toBe('5');
      
      // 矩阵绝对值
      expect(Calculator.calculate('abs([-1,2,-3])').value).toBe('[1,2,3]');
    });
  });

  describe('角度转换函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('rad - 度数转弧度', () => {
      expect(Calculator.calculate('90.rad').value).toBe(Calculator.calculate('pi/2').value);
      expect(Calculator.calculate('90.rad').info).toContain('弧度: π/2 | 角度: 90°');
      expect(Calculator.calculate('rad(90)').info).toContain('弧度: π/2 | 角度: 90°');
      expect(Calculator.calculate('180.rad').value).toBe(Calculator.calculate('pi').value);
      expect(Calculator.calculate('180.rad').info).toContain('弧度: π | 角度: 180°');
      expect(Calculator.calculate('0.rad').value).toBe('0');
      expect(Calculator.calculate('0.rad').info).toContain('弧度: 0 | 角度: 0°');
    });

    test('deg - 弧度转度数', () => {
      expect(Calculator.calculate('(pi/2).deg').value).toBe('90');
      expect(Calculator.calculate('(pi/2).deg').info).toContain('角度: 90°');
      expect(Calculator.calculate('deg(pi/2)').info).toContain('角度: 90°');

      expect(Calculator.calculate('pi.deg').value).toBe('180');
      expect(Calculator.calculate('pi.deg').info).toContain('角度: 180°');
      expect(Calculator.calculate('deg(pi)').info).toContain('角度: 180°');

      expect(Calculator.calculate('(0).deg').value).toBe('0');
      expect(Calculator.calculate('(0).deg').info).toContain('角度: 0°');
    });
  });

  describe('字符串函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('upper - 转换为大写', () => {
      expect(Calculator.calculate('"hello".upper').value).toBe('HELLO');
      expect(Calculator.calculate('"World".upper').value).toBe('WORLD');
      expect(Calculator.calculate('"123".upper').value).toBe('123');
    });

    test('lower - 转换为小写', () => {
      expect(Calculator.calculate('"HELLO".lower').value).toBe('hello');
      expect(Calculator.calculate('"World".lower').value).toBe('world');
      expect(Calculator.calculate('"123".lower').value).toBe('123');
    });

    test('length - 字符串长度', () => {
      expect(Calculator.calculate('"hello".length').value).toBe("5");
      expect(Calculator.calculate('"".length').value).toBe("0");
      expect(Calculator.calculate('"中文".length').value).toBe("2");
      expect(Calculator.calculate('"a\\\"b".length').value).toBe("3");
      expect(Calculator.calculate("'a\\'b'.length").value).toBe("3");
      expect(Calculator.calculate('`a\\`b`.length').value).toBe("3");
    });
  });

  describe('进制转换函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('bin - 十进制转二进制', () => {
      expect(Calculator.calculate('(5).bin').value).toBe('0b101');
      expect(Calculator.calculate('(8).bin').value).toBe('0b1000');
      expect(Calculator.calculate('(0).bin').value).toBe('0b0');

      const negativeDefault = Calculator.calculate('(-1).bin');
      expect(negativeDefault.value).toBe('0b1111111111111111');
      expect(negativeDefault.info).toContain('补码位宽: 16');
      expect(Calculator.calculate('(-10).bin').value).toBe('0b1111111111110110');

      expect(Calculator.calculate('bin(-1, 8)').value).toBe('0b11111111');
      expect(Calculator.calculate('bin(-1, 16)').value).toBe('0b1111111111111111');
      expect(Calculator.calculate('bin(-1, 32)').value).toBe('0b11111111111111111111111111111111');
      expect(Calculator.calculate('bin(-1, 64)').value).toBe('0b' + '1'.repeat(64));
      expect(Calculator.calculate('bin(-10, 8)').value).toBe('0b11110110');
      expect(Calculator.calculate('bin(10, 8)').value).toBe('0b1010');
    });

    test('oct - 十进制转八进制', () => {
      expect(Calculator.calculate('(8).oct').value).toBe('0o10');
      expect(Calculator.calculate('(64).oct').value).toBe('0o100');
      expect(Calculator.calculate('(0).oct').value).toBe('0o0');

      const negativeDefault = Calculator.calculate('(-1).oct');
      expect(negativeDefault.value).toBe('0o37777777777');
      expect(negativeDefault.info).toContain('补码位宽: 32');
      expect(Calculator.calculate('(-10).oct').value).toBe('0o37777777766');

      expect(Calculator.calculate('oct(-1, 8)').value).toBe('0o377');
      expect(Calculator.calculate('oct(-1, 16)').value).toBe('0o177777');
      expect(Calculator.calculate('oct(-1, 32)').value).toBe('0o37777777777');
      expect(Calculator.calculate('oct(-1, 64)').value).toBe('0o1777777777777777777777');
      expect(Calculator.calculate('oct(-10, 8)').value).toBe('0o366');
      expect(Calculator.calculate('oct(10, 8)').value).toBe('0o12');
    });

    test('hex - 十进制转十六进制', () => {
      expect(Calculator.calculate('(15).hex').value).toBe('0xf');
      expect(Calculator.calculate('(255).hex').value).toBe('0xff');
      expect(Calculator.calculate('(0).hex').value).toBe('0x0');
      const negativeDefault = Calculator.calculate('(-1).hex');
      expect(negativeDefault.value).toBe('0xffffffff');
      expect(negativeDefault.info).toContain('补码位宽: 32');
      expect(Calculator.calculate('(-10).hex').value).toBe('0xfffffff6');

      const negative4 = Calculator.calculate('hex(-1, 4)');
      expect(negative4.value).toBe('0xf');
      expect(negative4.info).toContain('补码位宽: 4');

      const negative8 = Calculator.calculate('hex(-1, 8)');
      expect(negative8.value).toBe('0xff');
      expect(negative8.info).toContain('补码位宽: 8');

      const negative16 = Calculator.calculate('hex(-1, 16)');
      expect(negative16.value).toBe('0xffff');
      expect(negative16.info).toContain('补码位宽: 16');

      const negative32 = Calculator.calculate('hex(-1, 32)');
      expect(negative32.value).toBe('0xffffffff');
      expect(negative32.info).toContain('补码位宽: 32');

      const negative64 = Calculator.calculate('hex(-1, 64)');
      expect(negative64.value).toBe('0xffffffffffffffff');
      expect(negative64.info).toContain('补码位宽: 64');

      const negative128 = Calculator.calculate('hex(-1, 128)');
      expect(negative128.value).toBe('0xffffffffffffffffffffffffffffffff');
      expect(negative128.info).toContain('补码位宽: 128');

      expect(Calculator.calculate('hex(-10, 16)').value).toBe('0xfff6');
      expect(Calculator.calculate('hex(10, 8)').value).toBe('0xa');
    });

    test('进制转换 - 负数位宽与参数边界', () => {
      // 正数不返回补码位宽 info（即使传了 bits）
      expect(Calculator.calculate('hex(255, 4)').value).toBe('0xff');
      expect(Calculator.calculate('hex(255, 4)').info).toBe(null);
      expect(Calculator.calculate('bin(255, 4)').info).toBe(null);
      expect(Calculator.calculate('oct(255, 4)').info).toBe(null);

      // 参数校验
      expect(() => Calculator.calculate('hex(-1, 0)')).toThrow('hex 的位宽参数必须是正整数');
      expect(() => Calculator.calculate('hex(-1, -8)')).toThrow('hex 的位宽参数必须是正整数');
      expect(() => Calculator.calculate('hex(-1, 3.5)')).toThrow('hex 的位宽参数必须是正整数');
      expect(() => Calculator.calculate('hex()')).toThrow('函数 "hex" 至少需要1个参数');
      expect(() => Calculator.calculate('hex(1, 2, 3)')).toThrow('hex 函数支持 1 或 2 个参数');
      expect(() => Calculator.calculate('bin(-1, 0)')).toThrow('bin 的位宽参数必须是正整数');
      expect(() => Calculator.calculate('bin(1, 2, 3)')).toThrow('bin 函数支持 1 或 2 个参数');
      expect(() => Calculator.calculate('oct(-1, 0)')).toThrow('oct 的位宽参数必须是正整数');
      expect(() => Calculator.calculate('oct(1, 2, 3)')).toThrow('oct 函数支持 1 或 2 个参数');
    });

    test('进制转换 - 负数位宽BYTE', () => {
      expect(Calculator.calculate('bin(-9, 8)').value).toBe('0b11110111');
      expect(Calculator.calculate('oct(-9, 8)').value).toBe('0o367');
      expect(Calculator.calculate('hex(-9, 8)').value).toBe('0xf7');

      expect(Calculator.calculate('bin(-99, 8)').value).toBe('0b10011101');
      expect(Calculator.calculate('oct(-99, 8)').value).toBe('0o235');
      expect(Calculator.calculate('hex(-99, 8)').value).toBe('0x9d');

    });


    test('进制转换 - 负数位宽WORD', () => {
      expect(Calculator.calculate('bin(-9, 16)').value).toBe('0b1111111111110111');
      expect(Calculator.calculate('oct(-9, 16)').value).toBe('0o177767');
      expect(Calculator.calculate('hex(-9, 16)').value).toBe('0xfff7');

      expect(Calculator.calculate('bin(-99, 16)').value).toBe('0b1111111110011101');
      expect(Calculator.calculate('oct(-99, 16)').value).toBe('0o177635');
      expect(Calculator.calculate('hex(-99, 16)').value).toBe('0xff9d');

    });


    test('进制转换 - 负数位宽DWORD', () => {
      expect(Calculator.calculate('bin(-9, 32)').value).toBe('0b11111111111111111111111111110111');
      expect(Calculator.calculate('oct(-9, 32)').value).toBe('0o37777777767');
      expect(Calculator.calculate('hex(-9, 32)').value).toBe('0xfffffff7');

      expect(Calculator.calculate('bin(-99, 32)').value).toBe('0b11111111111111111111111110011101');
      expect(Calculator.calculate('oct(-99, 32)').value).toBe('0o37777777635');
      expect(Calculator.calculate('hex(-99, 32)').value).toBe('0xffffff9d');

    });

    test('进制转换 - 负数位宽QWORD', () => {
      expect(Calculator.calculate('bin(-9, 64)').value).toBe('0b1111111111111111111111111111111111111111111111111111111111110111');
      expect(Calculator.calculate('oct(-9, 64)').value).toBe('0o1777777777777777777767');
      expect(Calculator.calculate('hex(-9, 64)').value).toBe('0xfffffffffffffff7');

      expect(Calculator.calculate('bin(-99, 64)').value).toBe('0b1111111111111111111111111111111111111111111111111111111110011101');
      expect(Calculator.calculate('oct(-99, 64)').value).toBe('0o1777777777777777777635');
      expect(Calculator.calculate('hex(-99, 64)').value).toBe('0xffffffffffffff9d');

    });

    test('二进制转十进制', () => {
      expect(Calculator.calculate('0b101 + 0').value).toBe('5');
      expect(Calculator.calculate('0b1101 * 1').value).toBe('13');
      expect(Calculator.calculate('0b101').value).toBe('5');
    });

    test('八进制转十进制', () => {
      expect(Calculator.calculate('0o12 + 0').value).toBe('10');
      expect(Calculator.calculate('0o377').value).toBe('255');
      expect(Calculator.calculate('0o5').value).toBe('5');
    });

    test('十六进制转十进制', () => {
      expect(Calculator.calculate('0xF').value).toBe('15');
      expect(Calculator.calculate('0xf').value).toBe('15');
      expect(Calculator.calculate('0xff + 1').value).toBe('256');
      expect(Calculator.calculate('0x0 * 1').value).toBe('0');
      expect(Calculator.calculate('0xAA').value).toBe('170');
    });

    //小数应该报错
    test('进制转换 - 小数报错', () => {
      expect(() => Calculator.calculate('bin(0.1)')).toThrow();
      expect(() => Calculator.calculate('oct(0.1)')).toThrow();
      expect(() => Calculator.calculate('hex(0.1)')).toThrow();

      expect(() => Calculator.calculate('bin(-0.1)')).toThrow();
      expect(() => Calculator.calculate('oct(-0.1)')).toThrow();
      expect(() => Calculator.calculate('hex(-0.1)')).toThrow();

      expect(() => Calculator.calculate('bin(-0.1, 8)')).toThrow();
      expect(() => Calculator.calculate('oct(-0.1, 8)')).toThrow();
      expect(() => Calculator.calculate('hex(-0.1, 8)')).toThrow();
    });
  });

  describe('Base64编码函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('base64 - Base64编码', () => {
      expect(Calculator.calculate('"hello".base64').value).toBe('aGVsbG8=');
      expect(Calculator.calculate('"world".base64').value).toBe('d29ybGQ=');
      expect(Calculator.calculate('"".base64').value).toBe('');
      
      // 数字转字符串再编码
      expect(() => Calculator.calculate('(123).base64')).not.toThrow();

      // 错误测试
      expect(() => Calculator.calculate('hello.base64')).toThrow();
    });

    test('unbase64 - Base64解码', () => {
      expect(Calculator.calculate('"aGVsbG8=".unbase64').value).toBe('hello');
      expect(Calculator.calculate('"d29ybGQ=".unbase64').value).toBe('world');
      expect(Calculator.calculate('"".unbase64').value).toBe('');
      
      // 错误的Base64字符串
      expect(() => Calculator.calculate('"invalid!@#".unbase64')).toThrow();

      // 错误测试
      expect(() => Calculator.calculate('hello.unbase64')).toThrow();
    });
  });

  describe('中文数字函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    // 参考财政部《会计基础工作规范》：到元/角写“整”；有分不写“整”；
    // 精确到分；角为 0 且有分时写“零”；用字不含“厘/兆”。
    test('基础测试', () => {
      expect(Calculator.calculate('(1.0) >cn').value).toBe('壹元整');
      expect(Calculator.calculate('(0.01) >cn').value).toBe('零元零壹分');
      expect(Calculator.calculate('(0.1) >cn').value).toBe('零元壹角整');
      expect(Calculator.calculate('(0.11) >cn').value).toBe('零元壹角壹分');
      expect(Calculator.calculate('(0.001) >cn').value).toBe('零元整'); // 不足分四舍五入
      expect(Calculator.calculate('(0.001) >cn').warning).toEqual(expect.arrayContaining([expect.stringContaining('已四舍五入到分')]));

      expect(Calculator.calculate('(-0.01) >cn').value).toBe('负零元零壹分');
      expect(Calculator.calculate('(-0.1) >cn').value).toBe('负零元壹角整');
      expect(Calculator.calculate('(-0.11) >cn').value).toBe('负零元壹角壹分');

      expect(Calculator.calculate('(1) >cn').value).toBe('壹元整');
      expect(Calculator.calculate('(10) >cn').value).toBe('壹拾元整');
      expect(Calculator.calculate('(100) >cn').value).toBe('壹佰元整');
      expect(Calculator.calculate('(1000) >cn').value).toBe('壹仟元整');
      expect(Calculator.calculate('(10000) >cn').value).toBe('壹万元整');
      expect(Calculator.calculate('(100000000) >cn').value).toBe('壹亿元整');
      expect(Calculator.calculate('(1000000000) >cn').value).toBe('壹拾亿元整');
      expect(Calculator.calculate('(1000000000000) >cn').value).toBe('壹万亿元整');

      expect(Calculator.calculate('(-1) >cn').value).toBe('负壹元整');
      expect(Calculator.calculate('(-10) >cn').value).toBe('负壹拾元整');
      expect(Calculator.calculate('(-100) >cn').value).toBe('负壹佰元整');
      expect(Calculator.calculate('(-1000) >cn').value).toBe('负壹仟元整');
      expect(Calculator.calculate('(-10000) >cn').value).toBe('负壹万元整');
      expect(Calculator.calculate('(-100000000) >cn').value).toBe('负壹亿元整');
      expect(Calculator.calculate('(-1000000000) >cn').value).toBe('负壹拾亿元整');
      expect(Calculator.calculate('(-1000000000000) >cn').value).toBe('负壹万亿元整');
    });

    test('基础测试 空格分隔', () => {
      expect(Calculator.calculate('0.01 > cn').value).toBe('零元零壹分');
      expect(Calculator.calculate('0.1 > cn').value).toBe('零元壹角整');
      expect(Calculator.calculate('0.11 > cn').value).toBe('零元壹角壹分');

      expect(Calculator.calculate('1 > cn').value).toBe('壹元整');
      expect(Calculator.calculate('10 >cn').value).toBe('壹拾元整');
      expect(Calculator.calculate('100 > cn').value).toBe('壹佰元整');
      expect(Calculator.calculate('1000 > cn').value).toBe('壹仟元整');
      expect(Calculator.calculate('10000 > cn').value).toBe('壹万元整');
      expect(Calculator.calculate('100000000 > cn').value).toBe('壹亿元整');
      expect(Calculator.calculate('1000000000 > cn').value).toBe('壹拾亿元整');
      expect(Calculator.calculate('1000000000000 > cn').value).toBe('壹万亿元整');
    });

    test('进阶测试', () => {
      // 到角为止加“整”；有分不加“整”；角为 0 有分写“零”
      expect(Calculator.calculate('(305.2) >cn').value).toBe('叁佰零伍元贰角整');
      expect(Calculator.calculate('(305.25) >cn').value).toBe('叁佰零伍元贰角伍分');
      expect(Calculator.calculate('(305.253) >cn').value).toBe('叁佰零伍元贰角伍分'); // 厘四舍五入到分
      expect(Calculator.calculate('(305.253) >cn').warning).toEqual(expect.arrayContaining([expect.stringContaining('已四舍五入到分')]));
      expect(Calculator.calculate('(1000000) >cn').value).toBe('壹佰万元整');
      expect(Calculator.calculate('(123456789) >cn').value).toBe('壹亿零贰仟叁佰肆拾伍万零陆仟柒佰捌拾玖元整');
      expect(Calculator.calculate('(123.01) >cn').value).toBe('壹佰贰拾叁元零壹分');
      expect(Calculator.calculate('(-305.25) >cn').value).toBe('负叁佰零伍元贰角伍分');
      expect(Calculator.calculate('(0) >cn').value).toBe('零元整');
      expect(Calculator.calculate('(00000) >cn').value).toBe('零元整');
      expect(Calculator.calculate('(0.0) >cn').value).toBe('零元整');
      expect(Calculator.calculate('(00.000) >cn').value).toBe('零元整');

      // 中间连续 0 只写一个零
      expect(Calculator.calculate('(100100100.11) >cn').value).toBe('壹亿零壹拾万零壹佰元壹角壹分');
      expect(Calculator.calculate('(500500500.0) >cn').value).toBe('伍亿零伍拾万零伍佰元整');
      expect(Calculator.calculate('(1234567890.12) >cn').value).toBe('壹拾贰亿零叁仟肆佰伍拾陆万零柒仟捌佰玖拾元壹角贰分');
      expect(Calculator.calculate('(100000000.0) >cn').value).toBe('壹亿元整');
      expect(Calculator.calculate('(100500000.00) >cn').value).toBe('壹亿零伍拾万元整');
      expect(Calculator.calculate('(-100100100.11) >cn').value).toBe('负壹亿零壹拾万零壹佰元壹角壹分');

      // 边界与特殊值
      expect(Calculator.calculate('(0.01) >cn').value).toBe('零元零壹分');
      expect(Calculator.calculate('(0.10) >cn').value).toBe('零元壹角整');
      expect(Calculator.calculate('(0.11) >cn').value).toBe('零元壹角壹分');
      expect(Calculator.calculate('(0.101) >cn').value).toBe('零元壹角整'); // 1 厘四舍五入
      expect(Calculator.calculate('(0.101) >cn').warning).toEqual(expect.arrayContaining([expect.stringContaining('已四舍五入到分')]));
      expect(Calculator.calculate('(0.110) >cn').value).toBe('零元壹角壹分');
      expect(Calculator.calculate('(0.110) >cn').warning).toBeNull();
      expect(Calculator.calculate('(0.005) >cn').value).toBe('零元零壹分'); // 5 厘进位
      expect(Calculator.calculate('(0.005) >cn').warning).toEqual(expect.arrayContaining([expect.stringContaining('已四舍五入到分')]));
      expect(Calculator.calculate('(0.004) >cn').value).toBe('零元整');
      expect(Calculator.calculate('(0.004) >cn').warning).toEqual(expect.arrayContaining([expect.stringContaining('已四舍五入到分')]));
      expect(Calculator.calculate('(0.999) >cn').value).toBe('壹元整'); // 999 厘进位到元
      expect(Calculator.calculate('(0.999) >cn').warning).toEqual(expect.arrayContaining([expect.stringContaining('已四舍五入到分')]));
      expect(Calculator.calculate('(1) >cn').warning).toBeNull();
      expect(Calculator.calculate('(100100100.01) >cn').value).toBe('壹亿零壹拾万零壹佰元零壹分');
      expect(Calculator.calculate('(100100100.10) >cn').value).toBe('壹亿零壹拾万零壹佰元壹角整');
      expect(Calculator.calculate('(1002003004.56) >cn').value).toBe('壹拾亿零贰佰万零叁仟零肆元伍角陆分');
      expect(Calculator.calculate('(1002003004.00) >cn').value).toBe('壹拾亿零贰佰万零叁仟零肆元整');
      expect(Calculator.calculate('(1002003004.01) >cn').value).toBe('壹拾亿零贰佰万零叁仟零肆元零壹分');
      expect(Calculator.calculate('(1002003004.10) >cn').value).toBe('壹拾亿零贰佰万零叁仟零肆元壹角整');
    });

    // 添加运算测试
    test('运算测试', () => {
      expect(Calculator.calculate('1 + 1 >cn').value).toBe('贰元整');
      expect(Calculator.calculate('1 - 1 >cn').value).toBe('零元整');
      expect(Calculator.calculate('1 * 1 >cn').value).toBe('壹元整');
      expect(Calculator.calculate('1 / 1 >cn').value).toBe('壹元整');
      expect(Calculator.calculate('1 % 1 >cn').value).toBe('零元整');
      expect(Calculator.calculate('1 x 1 >cn').value).toBe('壹元整');
      expect(Calculator.calculate('1 X 1 >cn').value).toBe('壹元整');
    });

    // 复杂四则运算测试（精确到分）
    test('复杂表达式测试，精确到分', () => {
      expect(Calculator.calculate('1.01 + 1 x 2 >cn').value).toBe('叁元零壹分');
      expect(Calculator.calculate('1.10 + 2 / 1 >cn').value).toBe('叁元壹角整');
      expect(Calculator.calculate('1 * 2 + 1.01 - 0 >cn').value).toBe('叁元零壹分');
      expect(Calculator.calculate('2 / 1 + 1.10 + 0 > cn').value).toBe('叁元壹角整');
      expect(Calculator.calculate('max(1, 2, 3.01) > cn').value).toBe('叁元零壹分');
    });

    test('与日期时间戳运算测试', () => {
      expect(() => Calculator.calculate('#12345678900000 >cn')).not.toThrow();
      const result = Calculator.calculate('#12345678900000 >cn');
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(result.warning).toContain('无法转换为中文数字');
    });

    test('与矩阵运算测试', () => {
      expect(() => Calculator.calculate('[1,2,3] + [4,5,6] >cn')).not.toThrow();
      const result = Calculator.calculate('[1,2,3] + [4,5,6] >cn');
      expect(result.value).toBe('[5,7,9]');
      expect(result.warning).toContain('无法转换为中文数字');
    });

    test('与字符串运算测试', () => {
      expect(() => Calculator.calculate('"hello" + "world" >cn')).not.toThrow();
      const result = Calculator.calculate('"hello" + "world" >cn');
      expect(result.value).toBe('helloworld');
      expect(result.warning).toContain('无法转换为中文数字');
    });
  
  });

  describe('条件函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('if - 条件判断函数', () => {
      // 基本条件判断
      expect(Calculator.calculate('if(1, 10, 20)').value).toBe('10');
      expect(Calculator.calculate('if(0, 10, 20)').value).toBe('20');
      expect(Calculator.calculate('if(true, 10, 20)').value).toBe('10');
      expect(Calculator.calculate('if(false, 10, 20)').value).toBe('20');
      
      // 数值条件判断
      expect(Calculator.calculate('if(5 > 3, 1, 0)').value).toBe('1');
      expect(Calculator.calculate('if(3 > 5, 1, 0)').value).toBe('0');
      expect(Calculator.calculate('if(10 == 10, 123, 456)').value).toBe('123');
      expect(Calculator.calculate('if(10 != 10, 789, 321)').value).toBe('321');
      
      // 复杂条件判断
      expect(Calculator.calculate('if(2 + 3 == 5, 100, 200)').value).toBe('100');
      expect(Calculator.calculate('if(2 * 3 == 7, 100, 200)').value).toBe('200');
      expect(Calculator.calculate('if(sin(0) == 0, 1, 0)').value).toBe('1');
      expect(Calculator.calculate('if(cos(0) == 1, 1, 0)').value).toBe('1');
      
      // 边界条件
      expect(Calculator.calculate('if(-1, -1, 0)').value).toBe('-1');
      expect(Calculator.calculate('if(0.001, 1, 0)').value).toBe('1');
      expect(Calculator.calculate('if(0, 0, 1)').value).toBe('1');
      
      // 字符串条件（改为数字）
      expect(Calculator.calculate('if(1, 11, 22)').value).toBe('11');
      expect(Calculator.calculate('if(0, 11, 22)').value).toBe('22');
      
      // 数学表达式条件
      expect(Calculator.calculate('if(pi > 3, 314, 3)').value).toBe('314');
      expect(Calculator.calculate('if(e > 2, 271, 2)').value).toBe('271');
      expect(Calculator.calculate('if(sqrt(4) == 2, 2, 0)').value).toBe('2');
      
      // 嵌套条件
      expect(Calculator.calculate('if(if(1, 1, 0), 1000, 2000)').value).toBe('1000');
      expect(Calculator.calculate('if(if(0, 1, 0), 1000, 2000)').value).toBe('2000');

    });

    test('if - 函数嵌套', () => {
      // 第二、第三个参数用表达式或函数
      expect(Calculator.calculate('if(true, 1+1, 0+3)').value).toBe('2');
      expect(Calculator.calculate('if(false, 1+1, 0+3)').value).toBe('3');
      expect(Calculator.calculate('if(1, sqrt(9), pow(2,2))').value).toBe('3');
      expect(Calculator.calculate('if(0, sqrt(9), pow(2,2))').value).toBe('4');

      // 使用函数作为参数
      expect(Calculator.calculate('if(true, sin(0), cos(0))').value).toBe('0');
      expect(Calculator.calculate('if(false, sin(0), cos(0))').value).toBe('1');

      // 配合矩阵运算
      expect(Calculator.calculate('if(1, [1,2,3], [4,5,6])').value).toBe('[1,2,3]');
      expect(Calculator.calculate('if(0, [1,2,3], [4,5,6])').value).toBe('[4,5,6]');
      expect(Calculator.calculate('if(1, [1,2,3] + 1, 3 + [4,5,6])').value).toBe('[2,3,4]');
      expect(Calculator.calculate('if(1, [1,2,3] * 2, 3 * [4,5,6])').value).toBe('[2,4,6]');
      expect(Calculator.calculate('if(1, [1,2,3] / 2, 3 / [4,5,6])').value).toBe('[0.5,1,1.5]');

    });
  });

  describe('后缀函数调用 .f', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('类型转换 .f', () => {
      expect(Calculator.calculate('123.str').value).toBe('123');
      expect(Calculator.calculate('3.14.str').value).toBe('3.14');
      expect(Calculator.calculate('(123).str').value).toBe('123');
      expect(Calculator.calculate('(3.14).str').value).toBe('3.14');
      expect(Calculator.calculate('"123".num').value).toBe('123');
      expect(Calculator.calculate('"3.14".num').value).toBe('3.14');
    });

    test('统计函数 向量.f', () => {
      expect(Calculator.calculate('[1,2,3].min').value).toBe('1');
      expect(Calculator.calculate('[1,2,3].max').value).toBe('3');
      expect(Calculator.calculate('[1,2,3].sum').value).toBe('6');
      expect(Calculator.calculate('[1,2,3].mean').value).toBe('2');
      expect(Calculator.calculate('[1,2,3].avg').value).toBe('2');
      expect(Calculator.calculate('[1,2,3,4].median').value).toBe('2.5');
      expect(Calculator.calculate('[1,1,1].var').value).toBe('0');
      expect(Calculator.calculate('[1,1,1].std').value).toBe('0');
      expect(Calculator.calculate('[3,1,2].sort').value).toBe('[1,2,3]');
    });

    test('统计函数 矩阵.f', () => {
      expect(Calculator.calculate('{1,2;3,4}.min').value).toBe('1');
      expect(Calculator.calculate('{1,2;3,4}.max').value).toBe('4');
      expect(Calculator.calculate('{1,2;3,4}.sum').value).toBe('10');
      expect(Calculator.calculate('{1,2;2,3}.mean').value).toBe('2');
      expect(Calculator.calculate('{1,2;2,3}.avg').value).toBe('2');
      expect(Calculator.calculate('{1,2;3,4}.median').value).toBe('2.5');
      expect(Calculator.calculate('{1,1;1,1}.var').value).toBe('0');
      expect(Calculator.calculate('{1,1;1,1}.std').value).toBe('0');
      expect(Calculator.calculate('{3,2;1,4}.sort').value).toBe('{1,2;3,4}');
    });

    test('对数与指数 .f', () => {
      expect(Calculator.calculate('100.lg').value).toBe('2');
      expect(Calculator.calculate('8.lb').value).toBe('3');
      expect(Calculator.calculate('1.ln').value).toBe('0');
      expect(Calculator.calculate('0.exp').value).toBe('1');
      expect(Calculator.calculate('[1,10,100].lg').value).toBe('[0,1,2]');
    });

    test('取整函数 .f', () => {
      expect(Calculator.calculate('(1.2).round').value).toBe('1');
      expect(Calculator.calculate('(1.8).floor').value).toBe('1');
      expect(Calculator.calculate('(1.2).ceil').value).toBe('2');
      expect(Calculator.calculate('(-1.2).floor').value).toBe('-2');
      expect(Calculator.calculate('(-1.2).ceil').value).toBe('-1');
    });

    test('三角函数 .f', () => {
      expect(Calculator.calculate('(0).sin').value).toBe('0');
      expect(Calculator.calculate('(pi/2).sin').value).toBe('1');
      expect(Calculator.calculate('(0).cos').value).toBe('1');
      expect(Calculator.calculate('(0).tan').value).toBe('0');
      expect(Calculator.calculate('(0).asin').value).toBe('0');
      expect(Calculator.calculate('(1).acos').value).toBe('0');
      expect(Calculator.calculate('(0).atan').value).toBe('0');
    });

    test('双曲函数 .f', () => {
      expect(Calculator.calculate('(0).sinh').value).toBe('0');
      expect(Calculator.calculate('(0).cosh').value).toBe('1');
      expect(Calculator.calculate('(0).tanh').value).toBe('0');
    });

    test('其他数学函数 .f', () => {
      expect(Calculator.calculate('4.sqrt').value).toBe('2');
      expect(Calculator.calculate('9.sqrt').value).toBe('3');
      expect(Calculator.calculate('[4,9,16].sqrt').value).toBe('[2,3,4]');
      expect(Calculator.calculate('(-5).abs').value).toBe('5');
      expect(Calculator.calculate('[-1,2,-3].abs').value).toBe('[1,2,3]');
    });

    test('角度转换 .f', () => {
      expect(Calculator.calculate('90.rad').value).toBe(Calculator.calculate('pi/2').value);
      expect(Calculator.calculate('180.rad').value).toBe(Calculator.calculate('pi').value);
      expect(Calculator.calculate('(pi/2).deg').value).toBe('90');
      expect(Calculator.calculate('pi.deg').value).toBe('180');
      expect(Calculator.calculate('(0).deg').value).toBe('0');
    });

    test('字符串与编码 .f', () => {
      expect(Calculator.calculate('"hello".upper').value).toBe('HELLO');
      expect(Calculator.calculate('"HELLO".lower').value).toBe('hello');
      expect(Calculator.calculate('"hello".length').value).toBe('5');
      expect(Calculator.calculate('"中文".length').value).toBe('2');
      expect(Calculator.calculate('"ab".base64').value).toBe('YWI=');
      expect(Calculator.calculate('"YWI=".unbase64').value).toBe('ab');
    });

    test('矩阵函数 .f', () => {
      expect(Calculator.calculate('(2).eye').value).toBe('{1,0;0,1}');
      expect(Calculator.calculate('[1,2].diag').value).toBe('{1,0;0,2}');
      expect(Calculator.calculate('{1,2;3,4}.T').value).toBe('{1,3;2,4}');
      expect(Calculator.calculate('{1,2;3,4}.transpose').value).toBe('{1,3;2,4}');
      expect(Calculator.calculate('{1,0;0,1}.inv').value).toBe('{1,0;0,1}');
      expect(Calculator.calculate('{1,2;3,4}.det').value).toBe('-2');
      expect(Calculator.calculate('{1,0;0,2}.eigenvalues').value).toBe('[1,2]');
    });

    test('asProperty 的多变量函数支持单参 .f', () => {
      expect(Calculator.calculate('(15).hex').value).toBe('0xf');
      expect(Calculator.calculate('(255).hex').value).toBe('0xff');
      expect(Calculator.calculate('(5).bin').value).toBe('0b101');
      expect(Calculator.calculate('(8).bin').value).toBe('0b1000');
      expect(Calculator.calculate('(8).oct').value).toBe('0o10');
      expect(Calculator.calculate('(0).hex').value).toBe('0x0');
    });

    test('不支持后缀调用的函数应报错', () => {
      expect(() => Calculator.calculate('2.pow')).toThrow('函数pow不支持作为后缀调用');
      expect(() => Calculator.calculate('1.log')).toThrow('函数log不支持作为后缀调用');
      expect(() => Calculator.calculate('1.if')).toThrow('函数if不支持作为后缀调用');
      expect(() => Calculator.calculate('1.clamp')).toThrow('函数clamp不支持作为后缀调用');
      expect(() => Calculator.calculate('1.reshape')).toThrow('函数reshape不支持作为后缀调用');
      expect(() => Calculator.calculate('1.resize')).toThrow('函数resize不支持作为后缀调用');
      expect(() => Calculator.calculate('1.repeat')).toThrow('函数repeat不支持作为后缀调用');
      expect(() => Calculator.calculate('1.solve')).toThrow('函数solve不支持作为后缀调用');
      expect(() => Calculator.calculate('1.version')).toThrow('函数version不支持作为后缀调用');
    });

    test('.f 与普通调用结果一致', () => {
      const pairs = [
        ['123.str', 'str(123)'],
        ['"42".num', 'num("42")'],
        ['[1,2,3].min', 'min([1,2,3])'],
        ['[1,2,3].max', 'max([1,2,3])'],
        ['1.max', 'max(1)'],
        ['1.min', 'min(1)'],
        ['[1,2,3].sum', 'sum([1,2,3])'],
        ['[1,2,3].mean', 'mean([1,2,3])'],
        ['[1,2,3].avg', 'avg([1,2,3])'],
        ['[3,1,2].median', 'median([3,1,2])'],
        ['[3,1,2].sort', 'sort([3,1,2])'],
        ['{3,2;1,4}.sort', 'sort({3,2;1,4})'],
        ['3.ones', 'ones(3)'],
        ['3.zeros', 'zeros(3)'],
        ['3.range', 'range(3)'],
        ['100.lg', 'lg(100)'],
        ['8.lb', 'lb(8)'],
        ['1.ln', 'ln(1)'],
        ['0.exp', 'exp(0)'],
        ['(1.6).round', 'round(1.6)'],
        ['(1.6).floor', 'floor(1.6)'],
        ['(1.2).ceil', 'ceil(1.2)'],
        ['(0).sin', 'sin(0)'],
        ['(0).cos', 'cos(0)'],
        ['(0).tan', 'tan(0)'],
        ['(0).asin', 'asin(0)'],
        ['(1).acos', 'acos(1)'],
        ['(0).atan', 'atan(0)'],
        ['(0).sinh', 'sinh(0)'],
        ['(0).cosh', 'cosh(0)'],
        ['(0).tanh', 'tanh(0)'],
        ['9.sqrt', 'sqrt(9)'],
        ['(-5).abs', 'abs(-5)'],
        ['90.rad', 'rad(90)'],
        ['(pi/2).deg', 'deg(pi/2)'],
        ['"Hi".upper', 'upper("Hi")'],
        ['"Hi".lower', 'lower("Hi")'],
        ['"Hi".length', 'length("Hi")'],
        ['"ab".base64', 'base64("ab")'],
        ['"YWI=".unbase64', 'unbase64("YWI=")'],
        ['(2).eye', 'eye(2)'],
        ['[1,2].diag', 'diag([1,2])'],
        ['{1,2;3,4}.T', 'T({1,2;3,4})'],
        ['{1,2;3,4}.transpose', 'transpose({1,2;3,4})'],
        ['{1,0;0,1}.inv', 'inv({1,0;0,1})'],
        ['{1,2;3,4}.det', 'det({1,2;3,4})'],
        ['{1,0;0,2}.eigenvalues', 'eigenvalues({1,0;0,2})'],
        ['(15).hex', 'hex(15)'],
        ['(5).bin', 'bin(5)'],
        ['(8).oct', 'oct(8)'],
      ];
      for (const [postfix, normal] of pairs) {
        expect(Calculator.calculate(postfix).value).toBe(Calculator.calculate(normal).value);
      }
    });

    test('.f 优先级高于加减乘', () => {
      // 1+8.sqrt ≡ 1+sqrt(8)? No - .sqrt binds to 8, so 1+sqrt(8)
      // Actually: 1+4.sqrt = 1 + sqrt(4) = 3
      expect(Calculator.calculate('1+4.sqrt').value).toBe('3');
      expect(Calculator.calculate('2*4.sqrt').value).toBe('4');
      expect(Calculator.calculate('(-5).abs+1').value).toBe('6');
      expect(Calculator.calculate('90.rad.deg').value).toBe('90');
    });
  });

  describe('版本函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('version - 版本号', () => {
      expect(() => Calculator.calculate('version()')).not.toThrow();
      const result = Calculator.calculate('version()');
      expect(result.value).toContain('CodeCalcCore');
    });
  });

  describe('常数测试', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('数学常数', () => {
      // π 常数
      expect(() => Calculator.calculate('π')).not.toThrow();
      expect(() => Calculator.calculate('PI')).not.toThrow();
      expect(() => Calculator.calculate('pi')).not.toThrow();
      
      // e 常数
      expect(() => Calculator.calculate('e')).not.toThrow();
      expect(() => Calculator.calculate('E')).not.toThrow();
      
      // 验证常数值的正确性
      const piValue = parseFloat(Calculator.calculate('π').value);
      expect(piValue).toBeCloseTo(3.14159, 4);
      
      const eValue = parseFloat(Calculator.calculate('e').value);
      expect(eValue).toBeCloseTo(2.71828, 4);
    });
  });
});
