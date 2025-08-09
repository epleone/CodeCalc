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
      
      // 矩阵乘法(点乘)
      expect(Calculator.calculate('[2,3] * [4,5]').value).toBe('[8,15]');
      expect(Calculator.calculate('{2,3} * {4,5}').value).toBe('{8,15}');
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
    });

    test('幂运算符 **', () => {
      expect(Calculator.calculate('2 ** 3').value).toBe('8');
      expect(Calculator.calculate('4 ** 0.5').value).toBe('2');
      expect(Calculator.calculate('2 ** -2').value).toBe('0.25');
      expect(Calculator.calculate('(-2) ** 2').value).toBe('4');
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

    test('按位异或 ^', () => {
      expect(Calculator.calculate('5 ^ 3').value).toBe('6');
      expect(Calculator.calculate('12 ^ 7').value).toBe('11');
      expect(Calculator.calculate('15 ^ 15').value).toBe('0');
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
      
      expect(Calculator.calculate('b = [1,2,3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('b').value).toBe('[1,2,3]');
    });

    test('加法赋值 +=', () => {
      expect(Calculator.calculate('a = 5').value).toBe('5');
      expect(Calculator.calculate('a += 3').value).toBe('8');
      expect(Calculator.calculate('a').value).toBe('8');
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
      // 基本随机数 0~1
      const result1 = Calculator.calculate('random()');
      expect(typeof result1.value).toBe('string');
      const num1 = parseFloat(result1.value);
      expect(num1).toBeGreaterThanOrEqual(0);
      expect(num1).toBeLessThan(1);
      
      // 随机向量
      expect(() => Calculator.calculate('random(3)')).not.toThrow();
      
      // 随机矩阵
      expect(() => Calculator.calculate('random(2, 3)')).not.toThrow();
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
      
      // 矩阵正弦
      expect(() => Calculator.calculate('sin([0, pi/2])')).not.toThrow();
    });

    test('cos - 余弦函数', () => {
      expect(Calculator.calculate('cos(0)').value).toBe('1');
      expect(Calculator.calculate('cos(pi/2)').value).toBe('0');
      expect(Calculator.calculate('cos(pi)').value).toBe('-1');
      
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
      expect(Calculator.calculate('asin(1)').value).toBe(Calculator.calculate('pi/2').value);
      expect(Calculator.calculate('asin(-1)').value).toBe(Calculator.calculate('-pi/2').value);
      
      // 超出定义域错误
      expect(Calculator.calculate('asin(2)').value).toBe('NaN');
    });

    test('acos - 反余弦函数', () => {
      expect(Calculator.calculate('acos(1)').value).toBe('0');
      expect(Calculator.calculate('acos(0)').value).toBe(Calculator.calculate('pi/2').value);
      expect(Calculator.calculate('acos(-1)').value).toBe(Calculator.calculate('pi').value);
      
      // 超出定义域错误
      expect(Calculator.calculate('acos(2)').value).toBe('NaN');
    });

    test('atan - 反正切函数', () => {
      expect(Calculator.calculate('atan(0)').value).toBe('0');
      expect(Calculator.calculate('atan(1)').value).toBe(Calculator.calculate('pi/4').value);
      expect(Calculator.calculate('atan(-1)').value).toBe(Calculator.calculate('-pi/4').value);
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
      expect(Calculator.calculate('180.rad').value).toBe(Calculator.calculate('pi').value);
      expect(Calculator.calculate('0.rad').value).toBe('0');
    });

    test('deg - 弧度转度数', () => {
      // 使用 toFixed 比较浮点数
      const result1 = parseFloat(Calculator.calculate('(pi/2).deg').value.match(/[\d.]+/)[0]);
      expect(result1).toBeCloseTo(90, 3);
      
      const result2 = parseFloat(Calculator.calculate('pi.deg').value.match(/[\d.]+/)[0]);
      expect(result2).toBeCloseTo(180, 3);
      
      expect(Calculator.calculate('(0).deg').value).toContain('0');
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
    });

    test('oct - 十进制转八进制', () => {
      expect(Calculator.calculate('(8).oct').value).toBe('0o10');
      expect(Calculator.calculate('(64).oct').value).toBe('0o100');
      expect(Calculator.calculate('(0).oct').value).toBe('0o0');
    });

    test('hex - 十进制转十六进制', () => {
      expect(Calculator.calculate('(15).hex').value).toBe('0xf');
      expect(Calculator.calculate('(255).hex').value).toBe('0xff');
      expect(Calculator.calculate('(0).hex').value).toBe('0x0');
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
    });

    test('unbase64 - Base64解码', () => {
      expect(Calculator.calculate('"aGVsbG8=".unbase64').value).toBe('hello');
      expect(Calculator.calculate('"d29ybGQ=".unbase64').value).toBe('world');
      expect(Calculator.calculate('"".unbase64').value).toBe('');
      
      // 错误的Base64字符串
      expect(() => Calculator.calculate('"invalid!@#".unbase64')).toThrow();
    });
  });

  describe('中文数字函数', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('基础测试', () => {
      expect(Calculator.calculate('(0.001).toCN').value).toBe('零元壹厘');
      expect(Calculator.calculate('(0.01).toCN').value).toBe('零元壹分');
      expect(Calculator.calculate('(0.1).toCN').value).toBe('零元壹角');
      expect(Calculator.calculate('(0.11).toCN').value).toBe('零元壹角壹分');
      expect(Calculator.calculate('(0.111).toCN').value).toBe('零元壹角壹分壹厘');

      expect(Calculator.calculate('(-0.001).toCN').value).toBe('负零元壹厘');
      expect(Calculator.calculate('(-0.01).toCN').value).toBe('负零元壹分');
      expect(Calculator.calculate('(-0.1).toCN').value).toBe('负零元壹角');
      expect(Calculator.calculate('(-0.11).toCN').value).toBe('负零元壹角壹分');
      expect(Calculator.calculate('(-0.111).toCN').value).toBe('负零元壹角壹分壹厘');


      expect(Calculator.calculate('(1).toCN').value).toBe('壹元整');
      expect(Calculator.calculate('(10).toCN').value).toBe('壹拾元整');
      expect(Calculator.calculate('(100).toCN').value).toBe('壹佰元整');
      expect(Calculator.calculate('(1000).toCN').value).toBe('壹仟元整');
      expect(Calculator.calculate('(10000).toCN').value).toBe('壹万元整');
      expect(Calculator.calculate('(100000000).toCN').value).toBe('壹亿元整');
      expect(Calculator.calculate('(1000000000).toCN').value).toBe('壹拾亿元整');
      expect(Calculator.calculate('(1000000000000).toCN').value).toBe('壹兆元整');

      expect(Calculator.calculate('(-1).toCN').value).toBe('负壹元整');
      expect(Calculator.calculate('(-10).toCN').value).toBe('负壹拾元整');
      expect(Calculator.calculate('(-100).toCN').value).toBe('负壹佰元整');
      expect(Calculator.calculate('(-1000).toCN').value).toBe('负壹仟元整');
      expect(Calculator.calculate('(-10000).toCN').value).toBe('负壹万元整');
      expect(Calculator.calculate('(-100000000).toCN').value).toBe('负壹亿元整');
      expect(Calculator.calculate('(-1000000000).toCN').value).toBe('负壹拾亿元整');
      expect(Calculator.calculate('(-1000000000000).toCN').value).toBe('负壹兆元整');
    });

    test('进阶测试', () => {
      expect(Calculator.calculate('(305.2).toCN').value).toBe('叁佰零伍元贰角');
      expect(Calculator.calculate('(305.25).toCN').value).toBe('叁佰零伍元贰角伍分');
      expect(Calculator.calculate('(305.253).toCN').value).toBe('叁佰零伍元贰角伍分叁厘');
      expect(Calculator.calculate('(1000000).toCN').value).toBe('壹佰万元整');
      expect(Calculator.calculate('(123456789).toCN').value).toBe('壹亿零贰仟叁佰肆拾伍万零陆仟柒佰捌拾玖元整');
      expect(Calculator.calculate('(123.01).toCN').value).toBe('壹佰贰拾叁元壹分');
      expect(Calculator.calculate('(-305.25).toCN').value).toBe('负叁佰零伍元贰角伍分');
      expect(Calculator.calculate('(0).toCN').value).toBe('零元整');
      expect(Calculator.calculate('(00000).toCN').value).toBe('零元整');
      expect(Calculator.calculate('(0.0).toCN').value).toBe('零元整');
      expect(Calculator.calculate('(00.000).toCN').value).toBe('零元整');

      // 测试：负数，带有零的数字（数位之间）
      expect(Calculator.calculate('(-100100100.111).toCN').value).toBe('负壹亿零壹拾万零壹佰元壹角壹分壹厘');
      expect(Calculator.calculate('(100100100.111).toCN').value).toBe('壹亿零壹拾万零壹佰元壹角壹分壹厘');
      expect(Calculator.calculate('(-500500500.0).toCN').value).toBe('负伍亿零伍拾万零伍佰元整');
      expect(Calculator.calculate('(500500500.0).toCN').value).toBe('伍亿零伍拾万零伍佰元整');
      expect(Calculator.calculate('(-1234567890.123).toCN').value).toBe('负壹拾贰亿零叁仟肆佰伍拾陆万零柒仟捌佰玖拾元壹角贰分叁厘');
      expect(Calculator.calculate('(1234567890.123).toCN').value).toBe('壹拾贰亿零叁仟肆佰伍拾陆万零柒仟捌佰玖拾元壹角贰分叁厘');
      expect(Calculator.calculate('(-100000000.0).toCN').value).toBe('负壹亿元整');
      expect(Calculator.calculate('(100000000.0).toCN').value).toBe('壹亿元整');
      expect(Calculator.calculate('(-0.001).toCN').value).toBe('负零元壹厘');
      expect(Calculator.calculate('(0.001).toCN').value).toBe('零元壹厘');
      expect(Calculator.calculate('(-100500000.00).toCN').value).toBe('负壹亿零伍拾万元整');
      expect(Calculator.calculate('(100500000.00).toCN').value).toBe('壹亿零伍拾万元整');

      // 边界与特殊值
      expect(Calculator.calculate('(0.01).toCN').value).toBe('零元壹分');
      expect(Calculator.calculate('(0.10).toCN').value).toBe('零元壹角');
      expect(Calculator.calculate('(0.11).toCN').value).toBe('零元壹角壹分');
      expect(Calculator.calculate('(0.001).toCN').value).toBe('零元壹厘');
      expect(Calculator.calculate('(0.101).toCN').value).toBe('零元壹角壹厘');
      expect(Calculator.calculate('(0.110).toCN').value).toBe('零元壹角壹分');
      expect(Calculator.calculate('(0.111).toCN').value).toBe('零元壹角壹分壹厘');
      expect(Calculator.calculate('(0.0001).toCN').value).toBe('零元整');
      expect(Calculator.calculate('(0.005).toCN').value).toBe('零元伍厘');
      expect(Calculator.calculate('(0.009).toCN').value).toBe('零元玖厘');
      expect(Calculator.calculate('(0.999).toCN').value).toBe('零元玖角玖分玖厘');
      expect(Calculator.calculate('(1).toCN').value).toBe('壹元整');
      expect(Calculator.calculate('(10).toCN').value).toBe('壹拾元整');
      expect(Calculator.calculate('(100).toCN').value).toBe('壹佰元整');
      expect(Calculator.calculate('(1000).toCN').value).toBe('壹仟元整');
      expect(Calculator.calculate('(10000).toCN').value).toBe('壹万元整');
      expect(Calculator.calculate('(100000000).toCN').value).toBe('壹亿元整');
      expect(Calculator.calculate('(1000000000).toCN').value).toBe('壹拾亿元整');
      expect(Calculator.calculate('(1000000000000).toCN').value).toBe('壹兆元整');
      expect(Calculator.calculate('(100100100.01).toCN').value).toBe('壹亿零壹拾万零壹佰元壹分'); // Corrected
      expect(Calculator.calculate('(100100100.10).toCN').value).toBe('壹亿零壹拾万零壹佰元壹角');
      expect(Calculator.calculate('(100100100.11).toCN').value).toBe('壹亿零壹拾万零壹佰元壹角壹分');
      expect(Calculator.calculate('(100100100.111).toCN').value).toBe('壹亿零壹拾万零壹佰元壹角壹分壹厘');
      expect(Calculator.calculate('(-0.01).toCN').value).toBe('负零元壹分');
      expect(Calculator.calculate('(-0.10).toCN').value).toBe('负零元壹角');
      expect(Calculator.calculate('(-0.11).toCN').value).toBe('负零元壹角壹分');
      expect(Calculator.calculate('(-0.001).toCN').value).toBe('负零元壹厘');
      expect(Calculator.calculate('(-0.101).toCN').value).toBe('负零元壹角壹厘');
      expect(Calculator.calculate('(-0.110).toCN').value).toBe('负零元壹角壹分');
      expect(Calculator.calculate('(-0.111).toCN').value).toBe('负零元壹角壹分壹厘');
      expect(Calculator.calculate('(-100100100.111).toCN').value).toBe('负壹亿零壹拾万零壹佰元壹角壹分壹厘');
      expect(Calculator.calculate('(1002003004.56).toCN').value).toBe('壹拾亿零贰佰万零叁仟零肆元伍角陆分');
      expect(Calculator.calculate('(1002003004.567).toCN').value).toBe('壹拾亿零贰佰万零叁仟零肆元伍角陆分柒厘');
      expect(Calculator.calculate('(1002003004.000).toCN').value).toBe('壹拾亿零贰佰万零叁仟零肆元整');
      expect(Calculator.calculate('(1002003004.001).toCN').value).toBe('壹拾亿零贰佰万零叁仟零肆元壹厘');
      expect(Calculator.calculate('(1002003004.010).toCN').value).toBe('壹拾亿零贰佰万零叁仟零肆元壹分');
      expect(Calculator.calculate('(1002003004.100).toCN').value).toBe('壹拾亿零贰佰万零叁仟零肆元壹角');
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
