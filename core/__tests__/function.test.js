import { Calculator, FUNCTIONS } from '../calculator.js';

/*
* 每个函数的基础测试应该包括: func(x), func(expr), a + func(x), func(x) + a, func(x) + func(expr)这五种形式，中间的op未必是加号+
*/

const INITIAL_FUNCTION_NAMES = Object.keys(FUNCTIONS);

function calc(expr) {
  return Calculator.calculate(expr).value;
}

function runSetup(setup) {
  Calculator.clearAllCache();
  setup.forEach(expr => Calculator.calculate(expr));
}

function expectSameValue(actualExpr, expectedExpr) {
  expect(calc(actualExpr)).toBe(calc(expectedExpr));
}

function makeCase(name, options) {
  return {
    name,
    setup: options.setup ?? [],
    args: options.args,
    exprArgs: options.exprArgs,
    expected: options.expected,
    exprExpected: options.exprExpected ?? options.expected,
    composeExpected: options.composeExpected ?? options.expected,
    exprComposeExpected: options.exprComposeExpected ?? options.composeExpected ?? options.exprExpected ?? options.expected,
    aSetup: options.aSetup ?? 'a = 10',
    aExpected: options.aExpected ?? '10',
    op: options.op ?? '+',
    composedThrows: options.composedThrows ?? false,
  };
}

const FUNCTION_CASES = [
  makeCase('str', { setup: ['x = 123'], args: 'x', exprArgs: '100 + 23', expected: '"123"', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('num', { setup: ['x = 2'], args: 'x', exprArgs: '1 + 1', expected: '2' }),
  makeCase('max', { setup: ['x = 2'], args: 'x, 1', exprArgs: '1 + 1, 1', expected: '2' }),
  makeCase('min', { setup: ['x = 2'], args: 'x, 3', exprArgs: '1 + 1, 3', expected: '2' }),
  makeCase('sum', { setup: ['x = [1, 2, 3]'], args: 'x', exprArgs: '[1, 1 + 1, 3]', expected: '6' }),
  makeCase('mean', { setup: ['x = [1, 2, 3]'], args: 'x', exprArgs: '[1, 1 + 1, 3]', expected: '2' }),
  makeCase('avg', { setup: ['x = [1, 2, 3]'], args: 'x', exprArgs: '[1, 1 + 1, 3]', expected: '2' }),
  makeCase('median', { setup: ['x = [3, 1, 2]'], args: 'x', exprArgs: '[3, 1, 1 + 1]', expected: '2' }),
  makeCase('var', { setup: ['x = [1, 1, 1]'], args: 'x', exprArgs: '[1, 1, 1 + 0]', expected: '0' }),
  makeCase('std', { setup: ['x = [1, 1, 1]'], args: 'x', exprArgs: '[1, 1, 1 + 0]', expected: '0' }),
  makeCase('sort', { setup: ['x = [3, 1, 2]'], args: 'x', exprArgs: '[3, 1, 1 + 1]', expected: '[1,2,3]', aSetup: 'a = [1, 1, 1]', aExpected: '[1,1,1]' }),
  makeCase('lg', { setup: ['x = 100'], args: 'x', exprArgs: '10 ** 2', expected: '2' }),
  makeCase('lb', { setup: ['x = 8'], args: 'x', exprArgs: '2 ** 3', expected: '3' }),
  makeCase('log', { setup: ['x = 2'], args: 'x, 8', exprArgs: '1 + 1, 8', expected: '3' }),
  makeCase('ln', { setup: ['x = 1'], args: 'x', exprArgs: '2 - 1', expected: '0' }),
  makeCase('exp', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '1' }),
  makeCase('round', { setup: ['x = 1.2'], args: 'x', exprArgs: '1 + 0.2', expected: '1' }),
  makeCase('roundfix', { setup: ['x = 1.234'], args: 'x, 2', exprArgs: '1 + 0.234, 2', expected: '1.23' }),
  makeCase('floor', { setup: ['x = 1.8'], args: 'x', exprArgs: '1 + 0.8', expected: '1' }),
  makeCase('ceil', { setup: ['x = 1.2'], args: 'x', exprArgs: '1 + 0.2', expected: '2' }),
  makeCase('clamp', { setup: ['x = 5'], args: 'x, 1, 3', exprArgs: '2 + 3, 1, 3', expected: '3' }),
  makeCase('sin', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('cos', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '1' }),
  makeCase('tan', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('asin', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('acos', { setup: ['x = 1'], args: 'x', exprArgs: '2 - 1', expected: '0' }),
  makeCase('atan', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('sinh', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('cosh', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '1' }),
  makeCase('tanh', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('sqrt', { setup: ['x = 4'], args: 'x', exprArgs: '2 + 2', expected: '2' }),
  makeCase('pow', { setup: ['x = 2'], args: 'x, 3', exprArgs: '1 + 1, 3', expected: '8' }),
  makeCase('abs', { setup: ['x = -2'], args: 'x', exprArgs: '-(1 + 1)', expected: '2' }),
  makeCase('rad', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('deg', { setup: ['x = 0'], args: 'x', exprArgs: '1 - 1', expected: '0' }),
  makeCase('upper', { setup: ['x = "ab"'], args: 'x', exprArgs: '"a" + "b"', expected: '"AB"', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('lower', { setup: ['x = "AB"'], args: 'x', exprArgs: '"A" + "B"', expected: '"ab"', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('length', { setup: ['x = "ab"'], args: 'x', exprArgs: '"a" + "b"', expected: '2' }),
  makeCase('bin', { setup: ['x = 5'], args: 'x', exprArgs: '2 + 3', expected: '"0b101"', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('oct', { setup: ['x = 8'], args: 'x', exprArgs: '4 + 4', expected: '"0o10"', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('hex', { setup: ['x = 255'], args: 'x', exprArgs: '250 + 5', expected: '"0xff"', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('base64', { setup: ['x = "ab"'], args: 'x', exprArgs: '"a" + "b"', expected: '"YWI="', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('unbase64', { setup: ['x = "YWI="'], args: 'x', exprArgs: '"Y" + "WI="', expected: '"ab"', aSetup: 'a = "v"', aExpected: '"v"' }),
  makeCase('cn', {
    setup: ['x = 12'],
    args: 'x',
    exprArgs: '10 + 2',
    expected: '"壹拾贰元整"',
    // 与字符串相加时，cn 的 CCObj 目前按原数值参与拼接（a + cn(x) ≡ a + x）
    composeExpected: 'x',
    exprComposeExpected: '10 + 2',
    aSetup: 'a = "v"',
    aExpected: '"v"',
  }),
  makeCase('timestamp', { setup: ['x = 1'], args: '0, 0, 0, x, 0, 0, 0, 0', exprArgs: '0, 0, 0, 1 + 0, 0, 0, 0, 0', expected: '#1d', aSetup: 'a = #1d', aExpected: '#1d' }),
  makeCase('eye', { setup: ['x = 2'], args: 'x', exprArgs: '1 + 1', expected: '{1,0;0,1}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('diag', { setup: ['x = [1, 2]'], args: 'x', exprArgs: '[1, 1 + 1]', expected: '{1,0;0,2}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('ones', { setup: ['x = 2'], args: 'x', exprArgs: '1 + 1', expected: '[1,1]', aSetup: 'a = [1, 1]', aExpected: '[1,1]' }),
  makeCase('zeros', { setup: ['x = 2'], args: 'x', exprArgs: '1 + 1', expected: '[0,0]', aSetup: 'a = [1, 1]', aExpected: '[1,1]' }),
  makeCase('range', { setup: ['x = 3'], args: 'x', exprArgs: '1 + 2', expected: '[0,1,2]', aSetup: 'a = [1, 1, 1]', aExpected: '[1,1,1]' }),
  makeCase('reshape', { setup: ['x = [1, 2, 3, 4]'], args: 'x, 2, 2', exprArgs: '[1, 2, 3, 2 + 2], 2, 2', expected: '{1,2;3,4}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('resize', { setup: ['x = [1, 2, 3, 4]'], args: 'x, 2, 2', exprArgs: '[1, 2, 3, 2 + 2], 2, 2', expected: '{1,2;3,4}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('repeat', { setup: ['x = [1, 2]'], args: 'x, 2', exprArgs: '[1, 1 + 1], 2', expected: '{1,1;2,2}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('solve', { setup: ['x = {2,0;0,2}'], args: 'x, {2;4}', exprArgs: '{1 + 1, 0;0, 2}, {2;4}', expected: '[1,2]', aSetup: 'a = [1, 1]', aExpected: '[1,1]' }),
  makeCase('T', { setup: ['x = {1,2;3,4}'], args: 'x', exprArgs: '{1, 2;3, 2 + 2}', expected: '{1,3;2,4}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('transpose', { setup: ['x = {1,2;3,4}'], args: 'x', exprArgs: '{1, 2;3, 2 + 2}', expected: '{1,3;2,4}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('inv', { setup: ['x = {1,0;0,1}'], args: 'x', exprArgs: '{1, 0;0, 1 + 0}', expected: '{1,0;0,1}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('det', { setup: ['x = {1,2;3,4}'], args: 'x', exprArgs: '{1, 2;3, 2 + 2}', expected: '-2' }),
  makeCase('eigenvalues', { setup: ['x = {1,0;0,2}'], args: 'x', exprArgs: '{1, 0;0, 1 + 1}', expected: '[1,2]', aSetup: 'a = [1, 2]', composedThrows: true }),
  makeCase('Vector', { setup: ['x = 1'], args: 'x, 2', exprArgs: '1 + 0, 2', expected: '[1,2]', aSetup: 'a = [1, 1]', aExpected: '[1,1]' }),
  makeCase('RowMatrix', { setup: ['x = 1'], args: '[x, 2], [3, 4]', exprArgs: '[1 + 0, 2], [3, 4]', expected: '[1,2,3,4]', aSetup: 'a = [1, 1, 1, 1]', aExpected: '[1,1,1,1]' }),
  makeCase('ColMatrix', { setup: ['x = 1'], args: '[x, 2], [3, 4]', exprArgs: '[1 + 0, 2], [3, 4]', expected: '{1,3;2,4}', aSetup: 'a = {1,1;1,1}', aExpected: '{1,1;1,1}' }),
  makeCase('if', { setup: ['x = 1'], args: 'x, 2, 3', exprArgs: '1 == 1, 2, 3', expected: '2' }),
  makeCase('version', { args: '', exprArgs: '', expected: '"CodeCalcCore 3.3.0"', aSetup: 'a = "v"', aExpected: '"v"' }),
];

const RANDOM_CASE = {
  name: 'random',
  setup: ['x = 1'],
  args: 'x',
  exprArgs: '1 + 0',
};

describe('FUNCTIONS basic shape coverage', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
  });

  test('function case table covers every configured function key', () => {
    const coveredFunctions = [...FUNCTION_CASES.map(({ name }) => name), RANDOM_CASE.name].sort();
    expect(coveredFunctions).toEqual([...INITIAL_FUNCTION_NAMES].sort());
  });

  test.each(FUNCTION_CASES)('$name supports direct, expression, and composed forms', (testCase) => {
    const callWithX = `${testCase.name}(${testCase.args})`;
    const callWithExpr = `${testCase.name}(${testCase.exprArgs})`;

    runSetup(testCase.setup);
    expectSameValue(callWithX, testCase.expected);

    runSetup(testCase.setup);
    expectSameValue(callWithExpr, testCase.exprExpected);

    if (testCase.composedThrows) {
      runSetup([...testCase.setup, testCase.aSetup]);
      expect(() => calc(`a ${testCase.op} ${callWithX}`)).toThrow();

      runSetup([...testCase.setup, testCase.aSetup]);
      expect(() => calc(`${callWithX} ${testCase.op} a`)).toThrow();

      runSetup(testCase.setup);
      expect(() => calc(`${callWithX} ${testCase.op} ${callWithExpr}`)).toThrow();
      return;
    }

    runSetup([...testCase.setup, testCase.aSetup]);
    expectSameValue(`a ${testCase.op} ${callWithX}`, `${testCase.aExpected} ${testCase.op} (${testCase.composeExpected})`);

    runSetup([...testCase.setup, testCase.aSetup]);
    expectSameValue(`${callWithX} ${testCase.op} a`, `(${testCase.composeExpected}) ${testCase.op} ${testCase.aExpected}`);

    runSetup(testCase.setup);
    expectSameValue(`${callWithX} ${testCase.op} ${callWithExpr}`, `(${testCase.composeExpected}) ${testCase.op} (${testCase.exprComposeExpected})`);
  });

  test('random supports direct, expression, and composed forms', () => {
    const callWithX = `${RANDOM_CASE.name}(${RANDOM_CASE.args})`;
    const callWithExpr = `${RANDOM_CASE.name}(${RANDOM_CASE.exprArgs})`;
    const vectorPattern = /^\[[0-9.]+\]$/;

    runSetup(RANDOM_CASE.setup);
    expect(calc(callWithX)).toMatch(vectorPattern);

    runSetup(RANDOM_CASE.setup);
    expect(calc(callWithExpr)).toMatch(vectorPattern);

    runSetup([...RANDOM_CASE.setup, 'a = [1]']);
    expect(calc(`a + ${callWithX}`)).toMatch(/^\[1\.[0-9]+\]$/);

    runSetup([...RANDOM_CASE.setup, 'a = [1]']);
    expect(calc(`${callWithX} + a`)).toMatch(/^\[1\.[0-9]+\]$/);

    runSetup(RANDOM_CASE.setup);
    expect(calc(`${callWithX} + ${callWithExpr}`)).toMatch(/^\[[0-9.]+\]$/);
  });
});
