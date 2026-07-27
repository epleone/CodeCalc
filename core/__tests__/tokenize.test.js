import { Calculator } from '../calculator.js';

/**
 * Lexer token 类型清单与消歧对照。
 * 覆盖：number / string / date / duration / operator / pipe /
 * function / constant / identifier / delimiter / separator
 */
describe('tokenize token 类型', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
  });

  function tokenizeExpr(expr) {
    const { operators, functions, constants } = Calculator.getCfg();
    const { expr: processed, operators: sortedOperators } =
      Calculator.preprocess(expr, operators, functions, constants);
    return Calculator.tokenize(processed, sortedOperators, functions, constants);
  }

  describe('基础字面量', () => {
    test('number', () => {
      expect(tokenizeExpr('1.5')).toEqual([['number', '1.5']]);
      expect(tokenizeExpr('1e2')).toEqual([['number', '1e2']]);
      expect(tokenizeExpr('1e-2')).toEqual([['number', '1e-2']]);
      expect(tokenizeExpr('1.2e+3')).toEqual([['number', '1.2e+3']]);
      expect(tokenizeExpr('0xff')).toEqual([['number', '0xff']]);
      expect(tokenizeExpr('0b101')).toEqual([['number', '0b101']]);
      expect(tokenizeExpr('0o12')).toEqual([['number', '0o12']]);
    });

    test('千分位：表达式内合并，函数实参内不合并', () => {
      expect(tokenizeExpr('1,000')).toEqual([['number', '1000']]);
      expect(tokenizeExpr('1,000.5')).toEqual([['number', '1000.5']]);
      // 函数参数里逗号是 separator，不会吃成千分位
      expect(tokenizeExpr('max(1,000)')).toEqual([
        ['function', 'max'],
        ['delimiter', '('],
        ['number', '1'],
        ['separator', ','],
        ['number', '000'],
        ['delimiter', ')'],
      ]);
    });

    test('string_literal', () => {
      expect(tokenizeExpr('"ab"')).toEqual([['string_literal', 'ab']]);
      expect(tokenizeExpr("'cd'")).toEqual([['string_literal', 'cd']]);
      expect(tokenizeExpr('`x`')).toEqual([['string_literal', 'x']]);
    });

    test('字符串转义与未闭合', () => {
      expect(tokenizeExpr('"a\\"b"')).toEqual([['string_literal', 'a"b']]);
      expect(tokenizeExpr("'a\\'b'")).toEqual([['string_literal', "a'b"]]);
      expect(tokenizeExpr('`a\\`b`')).toEqual([['string_literal', 'a`b']]);
      expect(tokenizeExpr('"a\\\\b"')).toEqual([['string_literal', 'a\\b']]);
      // 非引号转义保留字面反斜杠
      expect(tokenizeExpr('"a\\nb"')).toEqual([['string_literal', 'a\\nb']]);
      expect(() => tokenizeExpr('"ab')).toThrow('未闭合的字符串字面量');
      expect(() => tokenizeExpr("'cd")).toThrow('未闭合的字符串字面量');
      expect(() => tokenizeExpr('`ef')).toThrow('未闭合的字符串字面量');
    });

    test('constant / identifier / function', () => {
      expect(tokenizeExpr('pi')).toEqual([['constant', 'pi']]);
      expect(tokenizeExpr('e')).toEqual([['constant', 'e']]);
      Calculator.calculate('a = 1');
      expect(tokenizeExpr('a')).toEqual([['identifier', 'a']]);
      expect(tokenizeExpr('$1')).toEqual([['identifier', '$1']]);
      expect(tokenizeExpr('cos(0)')).toEqual([
        ['function', 'cos'],
        ['delimiter', '('],
        ['number', '0'],
        ['delimiter', ')'],
      ]);
    });

    test('delimiter / separator', () => {
      expect(tokenizeExpr('(1+2)')).toEqual([
        ['delimiter', '('],
        ['number', '1'],
        ['operator', '+'],
        ['number', '2'],
        ['delimiter', ')'],
      ]);
      expect(tokenizeExpr('max(1,2)')).toEqual([
        ['function', 'max'],
        ['delimiter', '('],
        ['number', '1'],
        ['separator', ','],
        ['number', '2'],
        ['delimiter', ')'],
      ]);
    });
  });

  describe('@ 消歧：date_literal / 前缀 @ / matmul@ / >@', () => {
    test('日期字面量 → date_literal', () => {
      const dateTok = tokenizeExpr('@2020-03-15');
      expect(dateTok).toHaveLength(1);
      expect(dateTok[0][0]).toBe('date_literal');
      expect(dateTok[0][1]).toBeInstanceOf(Date);

      const nowTok = tokenizeExpr('@now');
      expect(nowTok[0][0]).toBe('date_literal');
      expect(nowTok[0][1]).toBeInstanceOf(Date);

      const todayTok = tokenizeExpr('@today');
      expect(todayTok[0][0]).toBe('date_literal');
      expect(todayTok[0][1]).toBeInstanceOf(Date);

      const mixed = tokenizeExpr('@2020-03-15 + @today');
      expect(mixed[0][0]).toBe('date_literal');
      expect(mixed[1]).toEqual(['operator', '+']);
      expect(mixed[2][0]).toBe('date_literal');
    });

    test('非日期 → 前缀 operator @', () => {
      expect(tokenizeExpr('@foo')).toEqual([
        ['operator', '@'],
        ['identifier', 'foo'],
      ]);
    });

    test('操作数之后的 @ → matmul@', () => {
      expect(tokenizeExpr('A@B')).toEqual([
        ['identifier', 'A'],
        ['operator', 'matmul@'],
        ['identifier', 'B'],
      ]);
    });

    test('后缀 >@ → operator >@，不是 pipe', () => {
      expect(tokenizeExpr('1>@')).toEqual([
        ['number', '1'],
        ['operator', '>@'],
      ]);
      expect(tokenizeExpr('1 > @')).toEqual([
        ['number', '1'],
        ['operator', '>@'],
      ]);
    });
  });

  describe('# 消歧：duration_literal / ># 系 postfix', () => {
    test('时长字面量 → duration_literal', () => {
      const d = tokenizeExpr('#1d');
      expect(d).toHaveLength(1);
      expect(d[0][0]).toBe('duration_literal');
      expect(d[0][1].parts).toEqual([
        { unit: 'days', valueType: 'number', value: '1' },
      ]);

      const exprUnit = tokenizeExpr('#(1+2)h');
      expect(exprUnit[0][0]).toBe('duration_literal');
      expect(exprUnit[0][1].parts).toEqual([
        { unit: 'hours', valueType: 'expression', value: '1+2' },
      ]);

      const clock = tokenizeExpr('#17:30:45');
      expect(clock[0][0]).toBe('duration_literal');

      const mixed = tokenizeExpr('#1d + #(2+1)h');
      expect(mixed[0][0]).toBe('duration_literal');
      expect(mixed[1]).toEqual(['operator', '+']);
      expect(mixed[2][0]).toBe('duration_literal');
    });

    test('后缀 ># / >#w → operator，不是 pipe / duration', () => {
      expect(tokenizeExpr('1>#')).toEqual([
        ['number', '1'],
        ['operator', '>#'],
      ]);
      expect(tokenizeExpr('1>#w')).toEqual([
        ['number', '1'],
        ['operator', '>#w'],
      ]);
      expect(tokenizeExpr('1 > #')).toEqual([
        ['number', '1'],
        ['operator', '>#'],
      ]);
    });

    test('># 族全表（含空格写法）', () => {
      const variants = ['>#', '>#w', '>#d', '>#h', '>#m', '>#s', '>#@'];
      for (const op of variants) {
        const bare = op; // e.g. >#d
        const spaced = op.replace('>#', '> #'); // e.g. > #d
        expect(tokenizeExpr(`1${bare}`)).toEqual([
          ['number', '1'],
          ['operator', bare],
        ]);
        expect(tokenizeExpr(`1 ${spaced}`)).toEqual([
          ['number', '1'],
          ['operator', bare],
        ]);
      }
    });
  });

  describe('小数点 vs .f 后缀', () => {
    test('纯小数仍是 number', () => {
      expect(tokenizeExpr('1.5')).toEqual([['number', '1.5']]);
      expect(tokenizeExpr('0.25')).toEqual([['number', '0.25']]);
    });

    test('整数.f / 小数.f → number + .f 算子', () => {
      expect(tokenizeExpr('1.max')).toEqual([
        ['number', '1'],
        ['operator', '.max'],
      ]);
      expect(tokenizeExpr('1.2.max')).toEqual([
        ['number', '1.2'],
        ['operator', '.max'],
      ]);
      expect(tokenizeExpr('(1.2).max')).toEqual([
        ['delimiter', '('],
        ['number', '1.2'],
        ['delimiter', ')'],
        ['operator', '.max'],
      ]);
      expect(tokenizeExpr('4.sqrt')).toEqual([
        ['number', '4'],
        ['operator', '.sqrt'],
      ]);
    });
  });

  describe('矩阵/向量字面量 preprocess 后 token', () => {
    test('[…] → Vector(...)', () => {
      const { operators, functions, constants } = Calculator.getCfg();
      const { expr: processed } = Calculator.preprocess(
        '[1 2 3]', operators, functions, constants
      );
      expect(processed).toBe('Vector(1,2,3)');
      expect(tokenizeExpr('[1 2 3]')).toEqual([
        ['function', 'Vector'],
        ['delimiter', '('],
        ['number', '1'],
        ['separator', ','],
        ['number', '2'],
        ['separator', ','],
        ['number', '3'],
        ['delimiter', ')'],
      ]);
    });

    test('{…;…} → RowMatrix(ColMatrix(...),...)', () => {
      const { operators, functions, constants } = Calculator.getCfg();
      const { expr: processed } = Calculator.preprocess(
        '{1 2;3 4}', operators, functions, constants
      );
      expect(processed).toBe('RowMatrix(ColMatrix(1,2),ColMatrix(3,4))');
      expect(tokenizeExpr('{1 2;3 4}')).toEqual([
        ['function', 'RowMatrix'],
        ['delimiter', '('],
        ['function', 'ColMatrix'],
        ['delimiter', '('],
        ['number', '1'],
        ['separator', ','],
        ['number', '2'],
        ['delimiter', ')'],
        ['separator', ','],
        ['function', 'ColMatrix'],
        ['delimiter', '('],
        ['number', '3'],
        ['separator', ','],
        ['number', '4'],
        ['delimiter', ')'],
        ['delimiter', ')'],
      ]);
    });
  });

  describe('负向与移位边界', () => {
    test('非法 # → 无法识别', () => {
      expect(() => tokenizeExpr('#')).toThrow('无法识别的字符: "#"');
      expect(() => tokenizeExpr('#xyz')).toThrow('无法识别的字符: "#"');
      expect(() => tokenizeExpr('#1x')).toThrow('无法识别的字符: "#"');
      expect(() => tokenizeExpr('#()d')).toThrow('时长字面量括号内不能为空');
    });

    test('非日期 @ → 前缀 @，不是 date_literal', () => {
      expect(tokenizeExpr('@notadate')).toEqual([
        ['operator', '@'],
        ['identifier', 'notadate'],
      ]);
      // 非法月日不会收成 date_literal，而是 @ 前缀 + 算术
      const bad = tokenizeExpr('@2020-99-99');
      expect(bad[0]).toEqual(['operator', '@']);
      expect(bad.some(([t]) => t === 'date_literal')).toBe(false);
      expect(bad.map(([t, v]) => (t === 'operator' || t === 'number' ? v : t))).toEqual([
        '@', '2020', '-', '99', '-', '99',
      ]);
    });

    test('>> / >>> / >>= / >= 最长匹配，不被管道吞', () => {
      expect(tokenizeExpr('8>>1')).toEqual([
        ['number', '8'],
        ['operator', '>>'],
        ['number', '1'],
      ]);
      expect(tokenizeExpr('8>>>1')).toEqual([
        ['number', '8'],
        ['operator', '>>>'],
        ['number', '1'],
      ]);
      expect(tokenizeExpr('8>>=1')).toEqual([
        ['number', '8'],
        ['operator', '>>='],
        ['number', '1'],
      ]);
      expect(tokenizeExpr('5>=3')).toEqual([
        ['number', '5'],
        ['operator', '>='],
        ['number', '3'],
      ]);
      expect(tokenizeExpr('8>>1 > cos')).toEqual([
        ['number', '8'],
        ['operator', '>>'],
        ['number', '1'],
        ['pipe', 'cos'],
      ]);
    });
  });

  describe('一元与百分号消歧', () => {
    test('unary+ / unary-', () => {
      expect(tokenizeExpr('-5')).toEqual([
        ['operator', 'unary-'],
        ['number', '5'],
      ]);
      expect(tokenizeExpr('+5')).toEqual([
        ['operator', 'unary+'],
        ['number', '5'],
      ]);
      expect(tokenizeExpr('1+-2')).toEqual([
        ['number', '1'],
        ['operator', '+'],
        ['operator', 'unary-'],
        ['number', '2'],
      ]);
    });

    test('unary% vs 中缀 %', () => {
      expect(tokenizeExpr('50%')).toEqual([
        ['number', '50'],
        ['operator', 'unary%'],
      ]);
      expect(tokenizeExpr('7%3')).toEqual([
        ['number', '7'],
        ['operator', '%'],
        ['number', '3'],
      ]);
      expect(tokenizeExpr('50% + (7%3)')).toEqual([
        ['number', '50'],
        ['operator', 'unary%'],
        ['operator', '+'],
        ['delimiter', '('],
        ['number', '7'],
        ['operator', '%'],
        ['number', '3'],
        ['delimiter', ')'],
      ]);
    });

    test('千分号 ‰', () => {
      expect(tokenizeExpr('5‰')).toEqual([
        ['number', '5'],
        ['operator', '‰'],
      ]);
    });
  });

  describe('pipe：函数管道 token', () => {
    test('裸函数名 → pipe，不再拆成 operator > + function', () => {
      expect(tokenizeExpr('2>cos')).toEqual([
        ['number', '2'],
        ['pipe', 'cos'],
      ]);
      expect(tokenizeExpr('2 > cos')).toEqual([
        ['number', '2'],
        ['pipe', 'cos'],
      ]);
      expect(tokenizeExpr('2> cos')).toEqual([
        ['number', '2'],
        ['pipe', 'cos'],
      ]);
      expect(tokenizeExpr('2 >cos')).toEqual([
        ['number', '2'],
        ['pipe', 'cos'],
      ]);
    });

    test('算术夹管道 → pipe 与中缀运算符并存', () => {
      expect(tokenizeExpr('1+2>sin')).toEqual([
        ['number', '1'],
        ['operator', '+'],
        ['number', '2'],
        ['pipe', 'sin'],
      ]);
      expect(tokenizeExpr('1>lg+1>lg')).toEqual([
        ['number', '1'],
        ['pipe', 'lg'],
        ['operator', '+'],
        ['number', '1'],
        ['pipe', 'lg'],
      ]);
      expect(tokenizeExpr('1+2>sin+1>cos')).toEqual([
        ['number', '1'],
        ['operator', '+'],
        ['number', '2'],
        ['pipe', 'sin'],
        ['operator', '+'],
        ['number', '1'],
        ['pipe', 'cos'],
      ]);
    });

    test('链式管道 → 连续 pipe token', () => {
      expect(tokenizeExpr('1+1 > cos > sin')).toEqual([
        ['number', '1'],
        ['operator', '+'],
        ['number', '1'],
        ['pipe', 'cos'],
        ['pipe', 'sin'],
      ]);
      expect(tokenizeExpr('1,2 > max > abs')).toEqual([
        ['number', '1'],
        ['separator', ','],
        ['number', '2'],
        ['pipe', 'max'],
        ['pipe', 'abs'],
      ]);
    });

    test('未知名称仍为 pipe（解析阶段再报函数不存在）', () => {
      expect(tokenizeExpr('2>co')).toEqual([
        ['number', '2'],
        ['pipe', 'co'],
      ]);
      expect(tokenizeExpr('1+2>sin+1>co')).toEqual([
        ['number', '1'],
        ['operator', '+'],
        ['number', '2'],
        ['pipe', 'sin'],
        ['operator', '+'],
        ['number', '1'],
        ['pipe', 'co'],
      ]);
    });

    test('比较：右侧为数字 → operator >', () => {
      expect(tokenizeExpr('5>3')).toEqual([
        ['number', '5'],
        ['operator', '>'],
        ['number', '3'],
      ]);
      expect(tokenizeExpr('2+3 > 4')).toEqual([
        ['number', '2'],
        ['operator', '+'],
        ['number', '3'],
        ['operator', '>'],
        ['number', '4'],
      ]);
    });

    test('比较：右侧为函数调用（带括号）→ operator > + function', () => {
      expect(tokenizeExpr('1>max(2,3)')).toEqual([
        ['number', '1'],
        ['operator', '>'],
        ['function', 'max'],
        ['delimiter', '('],
        ['number', '2'],
        ['separator', ','],
        ['number', '3'],
        ['delimiter', ')'],
      ]);
      expect(tokenizeExpr('1 > cos(0)')).toEqual([
        ['number', '1'],
        ['operator', '>'],
        ['function', 'cos'],
        ['delimiter', '('],
        ['number', '0'],
        ['delimiter', ')'],
      ]);
    });

    test('比较：右侧为已定义变量 → operator > + identifier', () => {
      Calculator.calculate('a = 3');
      expect(tokenizeExpr('1>a')).toEqual([
        ['number', '1'],
        ['operator', '>'],
        ['identifier', 'a'],
      ]);
      expect(tokenizeExpr('a > a')).toEqual([
        ['identifier', 'a'],
        ['operator', '>'],
        ['identifier', 'a'],
      ]);
    });

    test('比较：右侧为常量 → operator > + constant', () => {
      expect(tokenizeExpr('4>pi')).toEqual([
        ['number', '4'],
        ['operator', '>'],
        ['constant', 'pi'],
      ]);
    });

    test('>= / >> 不被收成 pipe', () => {
      expect(tokenizeExpr('5>=3')).toEqual([
        ['number', '5'],
        ['operator', '>='],
        ['number', '3'],
      ]);
      expect(tokenizeExpr('8>>1')).toEqual([
        ['number', '8'],
        ['operator', '>>'],
        ['number', '1'],
      ]);
    });

    test('cn 已是函数：>cn / > cn → pipe cn', () => {
      expect(tokenizeExpr('12>cn')).toEqual([
        ['number', '12'],
        ['pipe', 'cn'],
      ]);
      expect(tokenizeExpr('12 > cn')).toEqual([
        ['number', '12'],
        ['pipe', 'cn'],
      ]);
    });

    test('.f 仍为 postfix operator，与 pipe 可区分', () => {
      expect(tokenizeExpr('4.sqrt')).toEqual([
        ['number', '4'],
        ['operator', '.sqrt'],
      ]);
      expect(tokenizeExpr('4.sqrt > cos')).toEqual([
        ['number', '4'],
        ['operator', '.sqrt'],
        ['pipe', 'cos'],
      ]);
    });
  });

  /**
   * 同式内多种易混淆记号并存：验证不会互相吞掉 / 串类。
   */
  describe('易混淆合并（同式多歧义）', () => {
    test('日期 - 时长 - 后缀可视化：@now - #1d > @', () => {
      const tokens = tokenizeExpr('@now - #1d > @');
      expect(tokens.map(([t]) => t)).toEqual([
        'date_literal',
        'operator',
        'duration_literal',
        'operator',
      ]);
      expect(tokens[1][1]).toBe('-');
      expect(tokens[3][1]).toBe('>@');
      expect(tokens.some(([t]) => t === 'pipe')).toBe(false);

      const spaced = tokenizeExpr('@now - #7d >    @');
      expect(spaced[3]).toEqual(['operator', '>@']);
    });

    test('矩阵乘 vs 日期字面量：A@B + @2020-03-15', () => {
      const tokens = tokenizeExpr('A@B + @2020-03-15');
      expect(tokens[0]).toEqual(['identifier', 'A']);
      expect(tokens[1]).toEqual(['operator', 'matmul@']);
      expect(tokens[2]).toEqual(['identifier', 'B']);
      expect(tokens[3]).toEqual(['operator', '+']);
      expect(tokens[4][0]).toBe('date_literal');
      expect(tokens[4][1]).toBeInstanceOf(Date);
    });

    test('前缀 @ vs 矩阵乘：@foo + A@B', () => {
      expect(tokenizeExpr('@foo + A@B')).toEqual([
        ['operator', '@'],
        ['identifier', 'foo'],
        ['operator', '+'],
        ['identifier', 'A'],
        ['operator', 'matmul@'],
        ['identifier', 'B'],
      ]);
    });

    test('管道后再 postfix 可视化：1>cos > @', () => {
      expect(tokenizeExpr('1>cos > @')).toEqual([
        ['number', '1'],
        ['pipe', 'cos'],
        ['operator', '>@'],
      ]);
      expect(tokenizeExpr('12>cn > @')).toEqual([
        ['number', '12'],
        ['pipe', 'cn'],
        ['operator', '>@'],
      ]);
      expect(tokenizeExpr('4.sqrt > cos > @')).toEqual([
        ['number', '4'],
        ['operator', '.sqrt'],
        ['pipe', 'cos'],
        ['operator', '>@'],
      ]);
    });

    test('时长/日期 + 后缀 >@，不是 pipe', () => {
      const d = tokenizeExpr('#1d > @');
      expect(d[0][0]).toBe('duration_literal');
      expect(d[1]).toEqual(['operator', '>@']);

      const datePost = tokenizeExpr('@2020-03-15 > @');
      expect(datePost[0][0]).toBe('date_literal');
      expect(datePost[1]).toEqual(['operator', '>@']);

      const combo = tokenizeExpr('@today+#1d>@');
      expect(combo.map(([t, v]) => (t === 'operator' ? v : t))).toEqual([
        'date_literal',
        '+',
        'duration_literal',
        '>@',
      ]);
    });

    test('># 与时长字面量并存：1># + #1d', () => {
      const tokens = tokenizeExpr('1># + #1d');
      expect(tokens[0]).toEqual(['number', '1']);
      expect(tokens[1]).toEqual(['operator', '>#']);
      expect(tokens[2]).toEqual(['operator', '+']);
      expect(tokens[3][0]).toBe('duration_literal');

      const spaced = tokenizeExpr('1 > # + #1d');
      expect(spaced[1]).toEqual(['operator', '>#']);
      expect(spaced[3][0]).toBe('duration_literal');
    });

    test('比较与管道串联：5>3 > cos、1>max(2,3) > cos', () => {
      expect(tokenizeExpr('5>3 > cos')).toEqual([
        ['number', '5'],
        ['operator', '>'],
        ['number', '3'],
        ['pipe', 'cos'],
      ]);
      expect(tokenizeExpr('1>max(2,3) > cos')).toEqual([
        ['number', '1'],
        ['operator', '>'],
        ['function', 'max'],
        ['delimiter', '('],
        ['number', '2'],
        ['separator', ','],
        ['number', '3'],
        ['delimiter', ')'],
        ['pipe', 'cos'],
      ]);
    });

    test('管道与 ># 夹算术：1>lg+1>#', () => {
      expect(tokenizeExpr('1>lg+1>#')).toEqual([
        ['number', '1'],
        ['pipe', 'lg'],
        ['operator', '+'],
        ['number', '1'],
        ['operator', '>#'],
      ]);
    });

    test('unary% / unary- 后再管道', () => {
      expect(tokenizeExpr('50% > cos')).toEqual([
        ['number', '50'],
        ['operator', 'unary%'],
        ['pipe', 'cos'],
      ]);
      expect(tokenizeExpr('1+-2>abs')).toEqual([
        ['number', '1'],
        ['operator', '+'],
        ['operator', 'unary-'],
        ['number', '2'],
        ['pipe', 'abs'],
      ]);
    });

    test('常量/变量比较不会收成 pipe：pi>e、a>pi', () => {
      Calculator.calculate('a = 1');
      expect(tokenizeExpr('pi>e')).toEqual([
        ['constant', 'pi'],
        ['operator', '>'],
        ['constant', 'e'],
      ]);
      expect(tokenizeExpr('a>pi')).toEqual([
        ['identifier', 'a'],
        ['operator', '>'],
        ['constant', 'pi'],
      ]);
    });
  });
});
