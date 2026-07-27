import { Calculator, FUNCTIONS, CONSTANTS } from '../calculator.js';
import { addCustomFromDefinitionForTest, clearCustomForTest } from '../customFunctions.js';

/**
 * 函数流式调用 `xxx > func` ≡ `func(xxx)`
 * 低优先级、左结合；与 `.f`、比较 `>`、postfix op 共存。
 * token 类型断言见 tokenize.test.js
 */
describe('函数流式调用 > func', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
    clearCustomForTest(FUNCTIONS, CONSTANTS);
  });

  afterAll(() => {
    clearCustomForTest(FUNCTIONS, CONSTANTS);
  });

  function expectSame(pipeExpr, normalExpr) {
    expect(Calculator.calculate(pipeExpr).value)
      .toBe(Calculator.calculate(normalExpr).value);
  }

  describe('基本糖：xxx > f ≡ f(xxx)', () => {
    test('单参函数', () => {
      expectSame('2 > cos', 'cos(2)');
      expectSame('0 > sin', 'sin(0)');
      expectSame('4 > sqrt', 'sqrt(4)');
      expectSame('(-5) > abs', 'abs(-5)');
      expectSame('100 > lg', 'lg(100)');
      expectSame('8 > lb', 'lb(8)');
      expectSame('1 > ln', 'ln(1)');
      expectSame('0 > exp', 'exp(0)');
      expectSame('(1.6) > round', 'round(1.6)');
      expectSame('(1.6) > floor', 'floor(1.6)');
      expectSame('(1.2) > ceil', 'ceil(1.2)');
      expectSame('90 > rad', 'rad(90)');
      expectSame('(pi/2) > deg', 'deg(pi/2)');
    });

    test('无空格与有空格等价', () => {
      expectSame('2>cos', 'cos(2)');
      expectSame('2 > cos', 'cos(2)');
      expectSame('2> cos', 'cos(2)');
      expectSame('2 >cos', 'cos(2)');
    });

    test('左侧为表达式', () => {
      expectSame('1+1 > cos', 'cos(1+1)');
      expectSame('2*3 > sqrt', 'sqrt(2*3)');
      expectSame('(1+1) > cos', 'cos(1+1)');
      expectSame('abs(-5) > sqrt', 'sqrt(abs(-5))');
    });

    test('字符串与编码函数', () => {
      expectSame('"hello" > upper', 'upper("hello")');
      expectSame('"HELLO" > lower', 'lower("HELLO")');
      expectSame('"hello" > length', 'length("hello")');
      expectSame('"ab" > base64', 'base64("ab")');
    });

    test('asProperty 函数也可管道（含单参）', () => {
      expectSame('15 > hex', 'hex(15)');
      expectSame('5 > bin', 'bin(5)');
      expectSame('8 > oct', 'oct(8)');
      expectSame('1 > max', 'max(1)');
      expectSame('1 > min', 'min(1)');
    });

    test('不支持 .f 的多参函数仍可通过管道调用', () => {
      expectSame('2,3 > pow', 'pow(2,3)');
      expect(() => Calculator.calculate('2.pow')).toThrow('函数pow不支持作为后缀调用');
    });
  });

  describe('多参：a,b > f ≡ f(a, b)', () => {
    test('两参与变参', () => {
      expectSame('1,2 > max', 'max(1,2)');
      expectSame('1,2 > min', 'min(1,2)');
      expectSame('3.14159, 2 > roundfix', 'roundfix(3.14159, 2)');
      expectSame('2,3 > pow', 'pow(2,3)');
    });

    test('逗号两侧为表达式，且 , 低于 +', () => {
      expectSame('1+2, 3+4 > max', 'max(3,7)');
      expectSame('1+2, 3+4 > max', 'max(1+2, 3+4)');
      expectSame('10-1, 2*3 > min', 'min(10-1, 2*3)');
    });

    test('负数控进制位宽', () => {
      expectSame('-5,16 > bin', 'bin(-5,16)');
      expectSame('-5,16 > bin > hex', 'hex(bin(-5,16))');
    });

    test('三参以上', () => {
      expectSame('1,5,3 > max', 'max(1,5,3)');
      expectSame('1,5,3 > min', 'min(1,5,3)');
    });
  });

  describe('链式与左结合', () => {
    test('a > f > g ≡ g(f(a))', () => {
      expectSame('1+1 > cos > sin', 'sin(cos(1+1))');
      expectSame('2 > cos > sin', 'sin(cos(2))');
      expectSame('100 > lg > lg', 'lg(lg(100))');
      expectSame('16 > sqrt > sqrt', 'sqrt(sqrt(16))');
    });

    test('a,b > f > g ≡ g(f(a,b))', () => {
      expectSame('1,2 > max > abs', 'abs(max(1,2))');
      expectSame('-5,16 > bin > hex', 'hex(bin(-5,16))');
    });

    test('x > f, y > g ≡ g(f(x), y)', () => {
      expectSame('1 > abs, 2 > max', 'max(abs(1), 2)');
      expectSame('(-3) > abs, 2 > max', 'max(abs(-3), 2)');
      expectSame('9 > sqrt, 2 > pow', 'pow(sqrt(9), 2)');
    });

    test('括号与混排用例', () => {
      expectSame('(1+1 > cos), 2 > roundfix', 'roundfix(cos(1+1), 2)');
      expectSame('(4 > sqrt), (9 > sqrt) > max', 'max(sqrt(4), sqrt(9))');
    });
  });

  describe('表达式嵌入（低优先级后缀施加）', () => {
    test('1>lg+1>lg ≡ lg(lg(1)+1)', () => {
      expectSame('1>lg+1>lg', 'lg(lg(1)+1)');
      expectSame('100>lg+1>lg', 'lg(lg(100)+1)');
    });

    test('管道优先级低于加减乘', () => {
      expectSame('1+1 > cos', 'cos(1+1)');
      expectSame('2*3 > sqrt', 'sqrt(2*3)');
      expectSame('8/2 > lg', 'lg(8/2)');
      // 对比：若误绑成 (1)+ (1>cos) 会得到不同结果
      expect(Calculator.calculate('1+1 > cos').value)
        .toBe(Calculator.calculate('cos(2)').value);
    });

    test('管道结果可继续参与运算', () => {
      expectSame('(2 > cos) + 1', 'cos(2) + 1');
      expectSame('1 + (2 > cos)', '1 + cos(2)');
      expectSame('(4 > sqrt) * (9 > sqrt)', 'sqrt(4) * sqrt(9)');
    });
  });

  describe('与 .f 互补', () => {
    test('.f 既有行为不受影响', () => {
      expectSame('1+1.max', '1+max(1)');
      expect(Calculator.calculate('1+1.max').value).toBe('2');
      expectSame('1+4.sqrt', '1+sqrt(4)');
      expect(Calculator.calculate('1+4.sqrt').value).toBe('3');
    });

    test('1+1 > max ≡ max(1+1)，与 .f 优先级不同', () => {
      expectSame('1+1 > max', 'max(1+1)');
      expect(Calculator.calculate('1+1 > max').value).toBe('2');
    });

    test('.f 绑最近操作数；管道绑整段左侧', () => {
      expectSame('1+4 > sqrt', 'sqrt(1+4)');
      expect(Calculator.calculate('1+4 > sqrt').value)
        .toBe(Calculator.calculate('sqrt(5)').value);
      expect(Calculator.calculate('1+4.sqrt').value)
        .not.toBe(Calculator.calculate('1+4 > sqrt').value);
    });

    test('.f 不支持多参列表；管道支持', () => {
      expect(() => Calculator.calculate('1,2.max')).toThrow();
      expectSame('1,2 > max', 'max(1,2)');
    });

    test('同一函数两种写法结果一致（单参）', () => {
      const pairs = [
        ['4 > sqrt', '4.sqrt'],
        ['0 > cos', '(0).cos'],
        ['(-5) > abs', '(-5).abs'],
        ['15 > hex', '(15).hex'],
        ['100 > lg', '100.lg'],
      ];
      for (const [pipe, postfix] of pairs) {
        expect(Calculator.calculate(pipe).value)
          .toBe(Calculator.calculate(postfix).value);
      }
    });
  });

  describe('与 .f 混合', () => {
    test('.f 后再管道：x.f > g ≡ g(f(x))', () => {
      expectSame('4.sqrt > cos', 'cos(sqrt(4))');
      expectSame('100.lg > lg', 'lg(lg(100))');
      expectSame('16.sqrt > sqrt', 'sqrt(sqrt(16))');
      expectSame('(-15).abs > hex', 'hex(abs(-15))');
      expectSame('(-16).abs > sqrt', 'sqrt(abs(-16))');
    });

    test('管道后再 .f：需括号，(x > f).g ≡ g(f(x))', () => {
      expectSame('(2 > cos).abs', 'abs(cos(2))');
      expectSame('(4 > sqrt).cos', 'cos(sqrt(4))');
      expectSame('(100 > lg).lg', 'lg(lg(100))');
      expectSame('((-15) > abs).hex', 'hex(abs(-15))');
    });

    test('管道链式与 .f 链式等价（单参）', () => {
      expect(Calculator.calculate('4 > sqrt > cos').value)
        .toBe(Calculator.calculate('4.sqrt.cos').value);
      expect(Calculator.calculate('100 > lg > lg').value)
        .toBe(Calculator.calculate('100.lg.lg').value);
      expect(Calculator.calculate('16 > sqrt > sqrt').value)
        .toBe(Calculator.calculate('16.sqrt.sqrt').value);
    });

    test('同一表达式内 .f 高优先、管道低优先', () => {
      // .sqrt 先绑 4，再整段管道：cos(1+sqrt(4))
      expectSame('1+4.sqrt > cos', 'cos(1+sqrt(4))');
      expectSame('2*4.sqrt > abs', 'abs(2*sqrt(4))');
      // 对比：管道吃掉加法
      expectSame('1+4 > sqrt > cos', 'cos(sqrt(1+4))');
      expect(Calculator.calculate('1+4.sqrt > cos').value)
        .not.toBe(Calculator.calculate('1+4 > sqrt > cos').value);
    });

    test('多参管道的参数可用 .f', () => {
      expectSame('4.sqrt, 9.sqrt > max', 'max(sqrt(4), sqrt(9))');
      expectSame('(-5).abs, 2 > max', 'max(abs(-5), 2)');
      expectSame('(4.sqrt), (9.sqrt) > min', 'min(sqrt(4), sqrt(9))');
    });

    test('混用后再继续管道或 .f', () => {
      expectSame('4.sqrt > cos > sin', 'sin(cos(sqrt(4)))');
      expectSame('(4.sqrt > cos).abs', 'abs(cos(sqrt(4)))');
      expectSame('16.sqrt.sqrt > cos', 'cos(sqrt(sqrt(16)))');
      expectSame('(16 > sqrt).sqrt > cos', 'cos(sqrt(sqrt(16)))');
    });

    test('表达式嵌入中混用 .f', () => {
      // .lg 高优先绑左侧原子，再 +1，再管道 → lg(lg(x)+1)
      expectSame('1.lg+1 > lg', 'lg(lg(1)+1)');
      expectSame('100.lg+1 > lg', 'lg(lg(100)+1)');
      // 管道低优先：1>lg 先算，再 + 1.lg
      expectSame('1>lg+1.lg', 'lg(1)+lg(1)');
      expectSame('100>lg+1.lg', 'lg(100)+lg(1)');
      expect(Calculator.calculate('100.lg+1 > lg').value)
        .not.toBe(Calculator.calculate('100>lg+1.lg').value);
    });
  });

  /**
   * 优先级约定：.f(5) > * /(4) > + -(2) > 管道/,/比较(1)
   * 同级左结合。
   */
  describe('优先级：.f 与 > func', () => {
    test('.f 高于加减，管道低于加减', () => {
      // .f：绑最近操作数
      expectSame('1+4.sqrt', '1+sqrt(4)');
      expect(Calculator.calculate('1+4.sqrt').value).toBe('3');
      // 管道：吃整段左侧
      expectSame('1+4 > sqrt', 'sqrt(1+4)');
      expect(Calculator.calculate('1+4 > sqrt').value)
        .toBe(Calculator.calculate('sqrt(5)').value);
      expect(Calculator.calculate('1+4.sqrt').value)
        .not.toBe(Calculator.calculate('1+4 > sqrt').value);
    });

    test('.f 高于乘除，管道低于乘除', () => {
      expectSame('2*4.sqrt', '2*sqrt(4)');
      expect(Calculator.calculate('2*4.sqrt').value).toBe('4');
      expectSame('2*4 > sqrt', 'sqrt(2*4)');
      expect(Calculator.calculate('2*4 > sqrt').value)
        .toBe(Calculator.calculate('sqrt(8)').value);
      expect(Calculator.calculate('2*4.sqrt').value)
        .not.toBe(Calculator.calculate('2*4 > sqrt').value);
    });

    test('混合算术：.f 仍只绑原子，管道绑整式', () => {
      // 1+2*4.sqrt ≡ 1+2*sqrt(4) ≡ 1+4 = 5，再管道
      expectSame('1+2*4.sqrt > cos', 'cos(1+2*sqrt(4))');
      expectSame('1+2*4 > sqrt', 'sqrt(1+2*4)');
      expect(Calculator.calculate('1+2*4 > sqrt').value).toBe('3');
      // 乘法与 .f：1+4.sqrt*2 ≡ 1+sqrt(4)*2
      expectSame('1+4.sqrt*2 > cos', 'cos(1+sqrt(4)*2)');
      expect(Calculator.calculate('1+2*4.sqrt > cos').value)
        .toBe(Calculator.calculate('1+4.sqrt*2 > cos').value);
    });

    test('同式对照表：三种写法语义不同', () => {
      // A: .f 高优先
      expectSame('1+4.sqrt > cos', 'cos(1+sqrt(4))');
      // B: 纯管道
      expectSame('1+4 > sqrt > cos', 'cos(sqrt(1+4))');
      // C: 先管道再算术再管道（需理解左结合低优先）
      expectSame('1>lg+4.sqrt > cos', 'cos(lg(1)+sqrt(4))');

      expect(Calculator.calculate('1+4.sqrt > cos').value)
        .not.toBe(Calculator.calculate('1+4 > sqrt > cos').value);
      expect(Calculator.calculate('1+4.sqrt > cos').value)
        .not.toBe(Calculator.calculate('1>lg+4.sqrt > cos').value);
      expect(Calculator.calculate('1+4 > sqrt > cos').value)
        .not.toBe(Calculator.calculate('1>lg+4.sqrt > cos').value);
    });

    test('管道与 .f 夹算术：左结合', () => {
      // (100 > lg) + (4.sqrt) 再可选管道
      expectSame('100>lg+4.sqrt', 'lg(100)+sqrt(4)');
      expect(Calculator.calculate('100>lg+4.sqrt').value).toBe('4');
      // 整段再管道：lg(lg(100)+sqrt(4))
      expectSame('100>lg+4.sqrt > lg', 'lg(lg(100)+sqrt(4))');
      // .f 在左侧、管道吃和：lg(100+sqrt(4))
      expectSame('100+4.sqrt > lg', 'lg(100+sqrt(4))');
      expect(Calculator.calculate('100>lg+4.sqrt > lg').value)
        .not.toBe(Calculator.calculate('100+4.sqrt > lg').value);
    });

    test('逗号低于算术；.f 在逗号两侧仍高优先', () => {
      expectSame('1+4.sqrt, 9.sqrt > max', 'max(1+sqrt(4), sqrt(9))');
      expectSame('2*4.sqrt, 3+9.sqrt > max', 'max(2*sqrt(4), 3+sqrt(9))');
      expect(Calculator.calculate('2*4.sqrt, 3+9.sqrt > max').value).toBe('6');
      // 对比：无 .f 时逗号两侧是算术结果
      expectSame('1+4, 9 > max', 'max(1+4, 9)');
      expect(Calculator.calculate('1+4.sqrt, 9.sqrt > max').value)
        .not.toBe(Calculator.calculate('1+4, 9 > max').value);
    });

    test('管道之后可继续 .f（.f 优先级更高，左结合后缀链）', () => {
      // 2 > cos .abs ≡ abs(cos(2))：管道先降糖，再吃高优先级 .abs
      expectSame('2 > cos.abs', 'abs(cos(2))');
      expectSame('2 > cos.abs', '(2 > cos).abs');
      expectSame('4 > sqrt.cos', 'cos(sqrt(4))');
      expectSame('4 > sqrt.cos.abs', 'abs(cos(sqrt(4)))');
      // 对比：先 .f 再管道
      expectSame('2.abs > cos', 'cos(abs(2))');
      expect(Calculator.calculate('2 > cos.abs').value)
        .not.toBe(Calculator.calculate('2.abs > cos').value);
    });

    test('加减乘与管道/.f 的完整优先级链', () => {
      const cases = [
        // [实际表达式, 等价括号化/普通调用]
        ['1+2*3 > abs', 'abs(1+2*3)'],
        ['1+2*3.sqrt > abs', 'abs(1+2*sqrt(3))'],
        ['(1+2)*3.sqrt > abs', 'abs((1+2)*sqrt(3))'],
        ['1+2 > abs > sqrt', 'sqrt(abs(1+2))'],
        ['1+2.sqrt > abs > sqrt', 'sqrt(abs(1+sqrt(2)))'],
        ['8/4.sqrt > abs', 'abs(8/sqrt(4))'],
        ['8/4 > sqrt', 'sqrt(8/4)'],
      ];
      for (const [mixed, normal] of cases) {
        expectSame(mixed, normal);
      }
      expect(Calculator.calculate('8/4.sqrt > abs').value).toBe('4');
      expect(Calculator.calculate('8/4 > sqrt').value)
        .toBe(Calculator.calculate('sqrt(2)').value);
      expect(Calculator.calculate('8/4.sqrt > abs').value)
        .not.toBe(Calculator.calculate('8/4 > sqrt').value);
    });
  });

  describe('与比较运算符 > 消歧', () => {
    test('右侧非函数名 → 比较', () => {
      expect(Calculator.calculate('5 > 3').value).toBe('true');
      expect(Calculator.calculate('3 > 5').value).toBe('false');
      expect(Calculator.calculate('1 > 1').value).toBe('false');
      expect(Calculator.calculate('2 + 3 > 4').value).toBe('true');
    });

    test('右侧为函数调用（带括号）→ 比较', () => {
      expect(Calculator.calculate('1 > max(2, 3)').value).toBe('false');
      expect(Calculator.calculate('1 > cos(0)').value).toBe('false');
      expect(Calculator.calculate('2 > cos(0)').value).toBe('true');
      expect(Calculator.calculate('0 > sin(0)').value).toBe('false');
      expectSame('sqrt(4) > cos(0)', '2 > 1');
    });

    test('右侧为裸函数名 → 管道（非比较）', () => {
      expect(Calculator.calculate('2 > cos').value)
        .not.toBe('true');
      expect(Calculator.calculate('2 > cos').value)
        .not.toBe('false');
      expectSame('2 > cos', 'cos(2)');
    });

    test('右侧为未知名称 → 提示函数不存在（非变量）', () => {
      expect(() => Calculator.calculate('1+2>sin+1>co'))
        .toThrow('函数 "co" 不存在');
      expect(() => Calculator.calculate('2 > co'))
        .toThrow('函数 "co" 不存在');
    });

    test('右侧为已定义变量 → 仍为比较', () => {
      Calculator.calculate('a = 3');
      Calculator.calculate('b = 5');
      expect(Calculator.calculate('a > b').value).toBe('false');
      expect(Calculator.calculate('b > a').value).toBe('true');
      expect(Calculator.calculate('1 > a').value).toBe('false');
    });

    test('>= 不受管道影响', () => {
      expect(Calculator.calculate('5 >= 3').value).toBe('true');
      expect(Calculator.calculate('5 >= 5').value).toBe('true');
      expect(Calculator.calculate('cos(0) >= 1').value).toBe('true');
    });
  });

  describe('逗号不能独立成值', () => {
    test('仅输入 1,2 报错', () => {
      expect(() => Calculator.calculate('1,2')).toThrow();
      expect(() => Calculator.calculate('1, 2')).toThrow();
      expect(() => Calculator.calculate('1+2, 3+4')).toThrow();
    });

    test('1,2 > 3 报错（逗号列表不能喂给比较）', () => {
      expect(() => Calculator.calculate('1,2 > 3')).toThrow();
      expect(() => Calculator.calculate('1,2 > max(3)')).toThrow();
    });

    test('函数括号内逗号仍为参数分隔，不受影响', () => {
      expect(Calculator.calculate('max(1, 2)').value).toBe('2');
      expect(Calculator.calculate('max(1+2, 3+4)').value).toBe('7');
      expect(Calculator.calculate('pow(2, 3)').value).toBe('8');
      expect(Calculator.calculate('roundfix(3.14159, 2)').value).toBe('3.14');
    });
  });

  describe('参数个数错误与普通调用一致', () => {
    test('管道传错参数量时错误与 f(...) 相同', () => {
      let cosMsg;
      let powMsg;
      try { Calculator.calculate('cos(1,2)'); } catch (e) { cosMsg = e.message; }
      try { Calculator.calculate('pow(2)'); } catch (e) { powMsg = e.message; }
      expect(cosMsg).toBe('函数 "cos" 需要 1 个参数，但得到了 2 个');
      expect(powMsg).toBe('函数 "pow" 需要 2 个参数，但得到了 1 个');
      expect(() => Calculator.calculate('1,2 > cos')).toThrow(cosMsg);
      expect(() => Calculator.calculate('2 > pow')).toThrow(powMsg);
    });
  });

  describe('与 cn 函数 / 管道共存', () => {
    test('>cn / > cn 经管道等价于 cn(...)', () => {
      expect(Calculator.calculate('12 >cn').value).toBe('壹拾贰元整');
      expect(Calculator.calculate('12 > cn').value).toBe('壹拾贰元整');
      expect(Calculator.calculate('(10 + 2) >cn').value).toBe('壹拾贰元整');
      expect(Calculator.calculate('1 + 1 >cn').value).toBe('贰元整');
      expectSame('12 > cn', 'cn(12)');
      expectSame('12.cn', 'cn(12)');
    });

    test('函数管道与其它 > 系列 op 可区分', () => {
      expectSame('2 > cos', 'cos(2)');
      expect(Calculator.calculate('2 > cn').value).toBe('贰元整');
    });

    // 锁定现状：cn 的 CCObj 与字符串相加时按原数值参与拼接（非中文大写）
    test('cn 与字符串拼接按原数值（锁定）', () => {
      expect(Calculator.calculate('"a"+cn(12)').value).toBe('a12');
      expect(Calculator.calculate('cn(12)+"a"').value).toBe('12a');
      Calculator.calculate('s = "x"');
      expect(Calculator.calculate('s+cn(12)').value).toBe('x12');
      expectSame('"a"+cn(12)', '"a"+12');
      expectSame('cn(12)+"a"', '12+"a"');
    });
  });

  describe('自定义函数 / 赋值 / if 混用', () => {
    test('自定义函数可作为管道目标', () => {
      addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'myFunc(x)=x*2');
      expectSame('10 > myFunc', 'myFunc(10)');
      expect(Calculator.calculate('10 > myFunc').value).toBe('20');
      expectSame('3+2 > myFunc', 'myFunc(3+2)');
    });

    test('赋值右侧可用管道', () => {
      expect(Calculator.calculate('a = 1+2 > cos').value)
        .toBe(Calculator.calculate('cos(1+2)').value);
      expect(Calculator.calculate('a').value)
        .toBe(Calculator.calculate('cos(3)').value);
      expectSame('b = 4 > sqrt', 'b = sqrt(4)');
      expect(Calculator.calculate('b').value).toBe('2');
    });

    test('if / 比较与管道混用', () => {
      // 条件里的 > 仍是比较；分支里的裸函数名是管道
      expectSame('if(1>0, 2>cos, 3)', 'if(1>0, cos(2), 3)');
      expectSame('if(1>0, 2>abs, 3)', 'if(1>0, abs(2), 3)');
      expect(Calculator.calculate('if(1>0, 2>abs, 3)').value).toBe('2');
      expect(Calculator.calculate('if(0>1, 2>abs, 9)').value).toBe('9');
      expectSame('if(5>3, 1+1 > sqrt, 0)', 'if(5>3, sqrt(1+1), 0)');
    });
  });

  describe('AST 形状', () => {
    test('1+2>sin 根节点为 function，不是 operator >', () => {
      const ast = Calculator.getASTNode('1+2>sin');
      expect(ast.type).toBe('function');
      expect(ast.value).toBe('sin');
      expect(ast.args).toHaveLength(1);
      expect(ast.args[0].type).toBe('operator');
      expect(ast.args[0].value).toBe('+');
    });

    test('1>max(2,3) 仍是比较 operator >', () => {
      const ast = Calculator.getASTNode('1>max(2,3)');
      expect(ast.type).toBe('operator');
      expect(ast.value).toBe('>');
      expect(ast.args[1].type).toBe('function');
      expect(ast.args[1].value).toBe('max');
    });

    test('多参管道 a,b > max 根为 function', () => {
      const ast = Calculator.getASTNode('1,2 > max');
      expect(ast.type).toBe('function');
      expect(ast.value).toBe('max');
      expect(ast.args).toHaveLength(2);
      expect(ast.args[0].type).toBe('number');
      expect(ast.args[1].type).toBe('number');
    });

    test('链式管道左结合：1 > cos > sin ≡ sin(cos(1))', () => {
      const ast = Calculator.getASTNode('1 > cos > sin');
      expect(ast.type).toBe('function');
      expect(ast.value).toBe('sin');
      expect(ast.args[0].type).toBe('function');
      expect(ast.args[0].value).toBe('cos');
    });
  });

  describe('todo 规范用例汇总', () => {
    test('文档列出的算例', () => {
      expectSame('1+1 > cos > sin', 'sin(cos(1+1))');
      expectSame('1,2 > max', 'max(1,2)');
      expectSame('-5,16 > bin > hex', 'hex(bin(-5,16))');
      expectSame('(1+1 > cos), 2 > roundfix', 'roundfix(cos(1+1), 2)');
      expectSame('1>lg+1>lg', 'lg(lg(1)+1)');
      expectSame('1+2, 3+4 > max', 'max(3,7)');
    });
  });
});
