import { Calculator, FUNCTIONS, CONSTANTS } from '../calculator.js';
import { addCustomFromDefinitionForTest, clearCustomForTest } from '../customFunctions.js';

/*
* 支持的类型：
* 数字、字符串、日期、时间戳/时长、矩阵、向量
* 测试要求：每个类型都同时覆盖了这两种调用方式：
* f(字面量)
* a = 字面量， f(a)
*/

describe('Custom Functions Direct Injection Tests', () => {
  function expectSameValue(customExpr, baseExpr) {
    expect(Calculator.calculate(customExpr).value).toBe(Calculator.calculate(baseExpr).value);
  }

  beforeEach(() => {
    Calculator.clearAllCache();
    clearCustomForTest(FUNCTIONS, CONSTANTS);
  });

  afterAll(() => {
    clearCustomForTest(FUNCTIONS, CONSTANTS);
  });

  test('数字类型：使用数字特有运算符定义自定义函数', () => {
    addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'fnum(x)=x%10');

    expectSameValue('fnum(12345)', '12345%10');
    Calculator.calculate('a = 12345');
    expectSameValue('fnum(a)', 'a%10');
  });

  test('字符串类型：使用字符串函数定义自定义函数', () => {
    addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'fstr(x)=upper(x)');

    expectSameValue('fstr("AbcD")', 'upper("AbcD")');
    Calculator.calculate('a = "AbcD"');
    expectSameValue('fstr(a)', 'upper(a)');
  });

  test('日期类型：使用日期与时长相加定义自定义函数', () => {
    addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'fdate(x)=x+#1d');

    expectSameValue('fdate(@2020-03-15)', '@2020-03-15 + #1d');
    Calculator.calculate('a = @2020-03-15');
    expectSameValue('fdate(a)', 'a + #1d');
  });

  test('时间戳/时长类型：使用时长缩放定义自定义函数', () => {
    addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'fts(x)=x*2');

    expectSameValue('fts(#1d)', '#1d*2');
    Calculator.calculate('a = #1d');
    expectSameValue('fts(a)', 'a*2');
  });

  test('矩阵类型：使用矩阵与标量相加定义自定义函数', () => {
    addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'fmat(x)=x+1');

    expectSameValue('fmat({1 2;3 4})', '{1 2;3 4}+1');
    Calculator.calculate('a = {1 2;3 4}');
    expectSameValue('fmat(a)', 'a+1');
  });

  test('向量类型：使用向量与标量相加定义自定义函数', () => {
    addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'fvec(x)=x+1');

    expectSameValue('fvec([1 2 3 4 5])', '[1 2 3 4 5] + 1');
    Calculator.calculate('a = [1 2 3 4 5]');
    expectSameValue('fvec(a)', 'a+1');
  });

  test('统一透传：f(x)=x 对齐 todo 场景（字面量与变量调用）', () => {
    addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'f(x)=x');

    const samples = [
      { literal: '12345', assign: 'a = 12345' },
      { literal: '"12345"', assign: 'a = "12345"' },
      { literal: '#1d', assign: 'a = #1d' },
      { literal: '[1 2 3 4 5]', assign: 'a = [1 2 3 4 5]' },
      { literal: '{1 2 3 4 5}', assign: 'a = {1 2 3 4 5}' },
    ];

    samples.forEach(({ literal, assign }) => {
      expectSameValue(`f(${literal})`, literal);
      Calculator.calculate(assign);
      expectSameValue('f(a)', 'a');
    });
  });

  test('支持带注释的自定义函数，并将注释写入 description', () => {
    addCustomFromDefinitionForTest(
      Calculator,
      FUNCTIONS,
      CONSTANTS,
      'fdesc(x) = x + 1 ; // increment by one'
    );

    expectSameValue('fdesc(1)', '1 + 1');
    expect(FUNCTIONS.fdesc.description).toContain('increment by one');
  });

  test('支持空注释的自定义函数（; //）', () => {
    addCustomFromDefinitionForTest(
      Calculator,
      FUNCTIONS,
      CONSTANTS,
      'fempty(x)=x+1 ; //'
    );

    expectSameValue('fempty(1)', '1 + 1');
    expect(FUNCTIONS.fempty.description).toContain('𝒇:');
  });
});
