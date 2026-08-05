import { Calculator } from '../calculator.js';

/**
 * 比值运算符 `:`
 * - 约分后以 a:b[:c...] 显示
 * - 支持小数、负数、零（零项保持为 0，非零项继续约分）
 * - 多元链式左结合：2:4:6 ≡ (2:4):6
 * - 优先级与赋值同级（实质低于一切算术）
 * - 二元可参与后续运算（计算值取商 a/b）；多元不可参与运算
 */
function calc(expr) {
  return Calculator.calculate(expr).value;
}

describe('比值运算符 :', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
  });

  describe('二元约分', () => {
    test.each([
      ['3:6', '1:2'],
      ['2:4', '1:2'],
      ['6:3', '2:1'],
      ['7:7', '1:1'],
      ['1:1', '1:1'],
      ['8:12', '2:3'],
      ['12:8', '3:2'],
      ['100:25', '4:1'],
      ['9:27', '1:3'],
    ])('%s → %s', (expr, expected) => {
      expect(calc(expr)).toBe(expected);
    });

    test('基础形状：a:b、(expr):b、a:(expr)、(expr):(expr)', () => {
      expect(calc('3:6')).toBe('1:2');
      expect(calc('(1+2):6')).toBe('1:2');
      expect(calc('3:(3+3)')).toBe('1:2');
      expect(calc('(1+2):(2+4)')).toBe('1:2');
    });

    test('紧凑写法与空格写法一致', () => {
      expect(calc('3:6')).toBe('1:2');
      expect(calc('3 : 6')).toBe('1:2');
      expect(calc('3: 6')).toBe('1:2');
      expect(calc('3 :6')).toBe('1:2');
    });
  });

  describe('小数', () => {
    test.each([
      ['1.5:3', '1:2'],
      ['3:1.5', '2:1'],
      ['0.5:0.25', '2:1'],
      ['1.25:2.5', '1:2'],
      ['0.2:0.4:0.6', '1:2:3'],
      ['1.5:3:4.5', '1:2:3'],
    ])('%s → %s', (expr, expected) => {
      expect(calc(expr)).toBe(expected);
    });
  });

  describe('负数', () => {
    test.each([
      ['-3:6', '-1:2'],
      ['3:-6', '1:-2'],
      ['-3:-6', '-1:-2'],
      ['(-3):6', '-1:2'],
      ['3:(-6)', '1:-2'],
      ['-6:-3:12', '-2:-1:4'],
      ['-2:4:6', '-1:2:3'],
    ])('%s → %s', (expr, expected) => {
      expect(calc(expr)).toBe(expected);
    });
  });

  describe('零', () => {
    test.each([
      // 二元：零项保持 0，另一侧约到最简 → 0:1 / 1:0
      ['0:5', '0:1'],
      ['5:0', '1:0'],
      ['0:0', '0:0'],
      // 多元：零项原样，非零项继续约分
      ['0:4:6', '0:2:3'],
      ['4:0:6', '2:0:3'],
      ['4:6:0', '2:3:0'],
      ['0:0:6', '0:0:1'],
      ['0:0:0', '0:0:0'],
      ['0:2:0:4', '0:1:0:2'],
    ])('%s → %s', (expr, expected) => {
      expect(calc(expr)).toBe(expected);
    });
  });

  describe('多元比值', () => {
    test.each([
      ['2:4:6', '1:2:3'],
      ['3:6:9', '1:2:3'],
      ['2:4:6:8', '1:2:3:4'],
      ['10:20:30:40', '1:2:3:4'],
      ['6:9:12', '2:3:4'],
      ['1:2:3', '1:2:3'],
    ])('%s → %s', (expr, expected) => {
      expect(calc(expr)).toBe(expected);
    });

    test('左结合链式：2:4:6 ≡ (2:4):6', () => {
      expect(calc('2:4:6')).toBe('1:2:3');
      expect(calc('(2:4):6')).toBe('1:2:3');
    });

    test('与表达式组合', () => {
      expect(calc('(1+1):(2+2):(3+3)')).toBe('1:2:3');
      expect(calc('2:(1+3):6')).toBe('1:2:3');
    });
  });

  describe('优先级（最低，与赋值同级）', () => {
    test('低于加减：两侧算术先算', () => {
      expect(calc('1+2:3+3')).toBe('1:2');
      expect(calc('1+5:2*4')).toBe('3:4');
      expect(calc('10-4:2+4')).toBe('1:1');
    });

    test('低于乘除幂', () => {
      expect(calc('2*3:4*3')).toBe('1:2');
      expect(calc('2**3:4**2')).toBe('1:2');
    });

    test('赋值右侧可直接写比值', () => {
      expect(calc('a = 3:6')).toBe('1:2');
      expect(calc('a')).toBe('1:2');

      Calculator.clearAllCache();
      expect(calc('a = 2:4:6')).toBe('1:2:3');
      expect(calc('a')).toBe('1:2:3');
    });
  });

  describe('二元可参与后续运算（计算值取商）', () => {
    test('与加减乘除', () => {
      expect(calc('(3:6) + 1')).toBe('1.5');
      expect(calc('1 + (3:6)')).toBe('1.5');
      expect(calc('(3:6) * 2')).toBe('1');
      expect(calc('2 * (3:6)')).toBe('1');
      expect(calc('(8:2) - 1')).toBe('3');
      expect(calc('(8:2) / 2')).toBe('2');
    });

    test('已约分比值的商', () => {
      expect(calc('(1:2) + (1:2)')).toBe('1');
      expect(calc('(2:1) * 3')).toBe('6');
    });

    test('变量中的二元比值可继续运算', () => {
      Calculator.calculate('r = 3:6');
      expect(calc('r')).toBe('1:2');
      expect(calc('r + 1')).toBe('1.5');
      expect(calc('r * 4')).toBe('2');
    });

    test('不带括号时因优先级最低，加法不会作用在比值整体上', () => {
      // 1+3:6 ≡ (1+3):6 → 2:3，而不是 1+(3:6)
      expect(calc('1+3:6')).toBe('2:3');
    });

    test('与函数交互：f(比值) 按商求值', () => {
      expect(calc('abs(3:6)')).toBe('0.5');
      expect(calc('abs(-3:6)')).toBe('0.5');
      expect(calc('sqrt(4:1)')).toBe('2');
      expect(calc('floor(5:2)')).toBe('2');
      expect(calc('ceil(5:2)')).toBe('3');
      expect(calc('round(5:2)')).toBe('3');
      expect(calc('max(3:6, 1)')).toBe('1');
      expect(calc('min(3:6, 1)')).toBe('0.5');
      expect(calc('pow(4:1, 3:6)')).toBe('2');
    });

    test('与函数交互：管道 / 后缀 .f', () => {
      expect(calc('(3:6) > abs')).toBe('0.5');
      expect(calc('(4:1) > sqrt')).toBe('2');
      expect(calc('(5:2) > floor')).toBe('2');
      expect(calc('(3:6).abs')).toBe('0.5');
      expect(calc('(4:1).sqrt')).toBe('2');
    });

    test('与函数交互：函数结果再运算 / 变量传入函数', () => {
      expect(calc('abs(3:6) + 1')).toBe('1.5');
      expect(calc('sqrt(4:1) * (1:2)')).toBe('1');
      Calculator.calculate('r = 3:6');
      expect(calc('abs(r)')).toBe('0.5');
      expect(calc('r > sqrt')).toBe(calc('sqrt(0.5)'));
      expect(calc('max(r, 0)')).toBe('0.5');
    });
  });

  describe('多元不可参与后续运算', () => {
    // 错误信息需明确指向「多元比值不可运算」，避免仅因未实现 `:` 而误通过
    const multiRatioMathError = /多元|比值/;

    test.each([
      '(2:4:6) + 1',
      '1 + (2:4:6)',
      '(2:4:6) * 2',
      '(2:4:6) - 1',
      '(2:4:6) / 1',
      '(1:2:3:4) + 0',
    ])('%s 报错', (expr) => {
      expect(() => Calculator.calculate(expr)).toThrow(multiRatioMathError);
    });

    test('变量中的多元比值不可继续运算', () => {
      Calculator.calculate('r = 2:4:6');
      expect(calc('r')).toBe('1:2:3');
      expect(() => Calculator.calculate('r + 1')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('r * 2')).toThrow(multiRatioMathError);
    });

    test('与函数交互：f(多元) / 管道 / 后缀均报错', () => {
      expect(() => Calculator.calculate('abs(2:4:6)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('sqrt(2:4:6)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('floor(2:4:6)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('max(2:4:6, 1)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('min(1, 2:4:6)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('pow(2:4:6, 2)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('(2:4:6) > abs')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('(2:4:6) > sqrt')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('(2:4:6).abs')).toThrow(multiRatioMathError);
    });

    test('与函数交互：变量中的多元传入函数报错', () => {
      Calculator.calculate('r = 2:4:6');
      expect(() => Calculator.calculate('abs(r)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('r > abs')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('max(r, 1)')).toThrow(multiRatioMathError);
      expect(() => Calculator.calculate('r.sqrt')).toThrow(multiRatioMathError);
    });
  });

  describe('与时长/日期字面量中的冒号不冲突', () => {
    test('时长 #H:M:S 仍按时长解析', () => {
      expect(Calculator.calculate('#17:30:45').value).toBeDefined();
      expect(() => Calculator.calculate('#17:30:45 >#')).not.toThrow();
    });

    test('日期时间中的冒号不受影响', () => {
      expect(() => Calculator.calculate('@2020-03-15 14:30:00 >@')).not.toThrow();
    });

    test('比值与时长可同时出现在表达式中', () => {
      // 3:6 是比值；#1d 是时长，不应被 : 吞掉
      expect(calc('3:6')).toBe('1:2');
      expect(() => Calculator.calculate('#1d + #2h')).not.toThrow();
    });
  });

  describe('边界与非法输入', () => {
    test('缺少操作数报错', () => {
      expect(() => Calculator.calculate(':6')).toThrow();
      expect(() => Calculator.calculate('3:')).toThrow();
      expect(() => Calculator.calculate(':')).toThrow();
    });

    test('非数字操作数报错', () => {
      expect(() => Calculator.calculate('"a":"b"')).toThrow(/比值|类型|数字|不支持/);
      expect(() => Calculator.calculate('3:"a"')).toThrow(/比值|类型|数字|不支持/);
    });
  });
});
