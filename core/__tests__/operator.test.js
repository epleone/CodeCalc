import { Calculator, OPERATORS } from '../calculator.js';

/*
* 每个op的基础测试应该包括  a op b、(expr) op b、a op (expr)， (expr) op  (expr)
*/
const INITIAL_OPERATOR_NAMES = Object.keys(OPERATORS).filter(name => !name.startsWith('.'));

function calc(expr) {
  return Calculator.calculate(expr).value;
}

function sameValueForms(name, left, leftExpr, right, rightExpr, expected) {
  return {
    name,
    forms: [
      `${left} ${name} ${right}`,
      `(${leftExpr}) ${name} ${right}`,
      `${left} ${name} (${rightExpr})`,
      `(${leftExpr}) ${name} (${rightExpr})`,
    ].map(expr => ({ expr, expected })),
  };
}

function assignmentForms(name, initial, right, rightExpr, expected) {
  return {
    name,
    forms: [
      `a ${name} ${right}`,
      `(a) ${name} ${right}`,
      `a ${name} (${rightExpr})`,
      `(a) ${name} (${rightExpr})`,
    ].map(expr => ({
      expr,
      expected,
      before: initial === null ? [] : [`a = ${initial}`],
    })),
  };
}

const OPERATOR_CASES = [
  sameValueForms('+', '2', '1 + 1', '3', '1 + 2', '5'),
  sameValueForms('-', '5', '2 + 3', '2', '1 + 1', '3'),
  sameValueForms('*', '2', '1 + 1', '3', '1 + 2', '6'),
  sameValueForms('/', '8', '4 + 4', '2', '1 + 1', '4'),
  sameValueForms('//', '8', '4 + 4', '3', '1 + 2', '2'),
  sameValueForms('%', '7', '4 + 3', '3', '1 + 2', '1'),
  sameValueForms('**', '2', '1 + 1', '3', '1 + 2', '8'),
  sameValueForms('^', '2', '1 + 1', '3', '1 + 2', '8'),
  sameValueForms(':', '3', '1 + 2', '6', '2 + 4', '1:2'),
  {
    name: '°',
    forms: [
      { expr: '180°', expected: '3.1415926535897932' },
      { expr: '(90 + 90)°', expected: '3.1415926535897932' },
    ],
  },
  {
    name: 'unary-',
    forms: [
      { expr: '-2', expected: '-2' },
      { expr: '-(1 + 1)', expected: '-2' },
    ],
  },
  {
    name: 'unary+',
    forms: [
      { expr: '+2', expected: '2' },
      { expr: '+(1 + 1)', expected: '2' },
    ],
  },
  {
    name: 'unary%',
    forms: [
      { expr: '50%', expected: '0.5' },
      { expr: '(25 + 25)%', expected: '0.5' },
    ],
  },
  {
    name: '‰',
    forms: [
      { expr: '5‰', expected: '0.005' },
      { expr: '(2 + 3)‰', expected: '0.005' },
    ],
  },
  {
    name: '!',
    forms: [
      { expr: '3!', expected: '6' },
      { expr: '(1 + 2)!', expected: '6' },
    ],
  },
  sameValueForms('&', '2', '1 + 1', '3', '1 + 2', '2'),
  sameValueForms('and', '2', '1 + 1', '3', '1 + 2', '2'),
  sameValueForms('|', '2', '1 + 1', '1', '0 + 1', '3'),
  sameValueForms('or', '2', '1 + 1', '1', '0 + 1', '3'),
  sameValueForms('^^', '2', '1 + 1', '3', '1 + 2', '1'),
  sameValueForms('xor', '2', '1 + 1', '3', '1 + 2', '1'),
  {
    name: '~',
    forms: [
      { expr: '~2', expected: '-3' },
      { expr: '~(1 + 1)', expected: '-3' },
    ],
  },
  {
    name: 'not',
    forms: [
      { expr: 'not 2', expected: '-3' },
      { expr: 'not (1 + 1)', expected: '-3' },
    ],
  },
  sameValueForms('<<', '2', '1 + 1', '3', '1 + 2', '16'),
  sameValueForms('>>', '16', '8 + 8', '2', '1 + 1', '4'),
  sameValueForms('>>>', '16', '8 + 8', '2', '1 + 1', '4'),
  assignmentForms('=', null, '3', '1 + 2', '3'),
  assignmentForms('+=', '2', '3', '1 + 2', '5'),
  assignmentForms('-=', '5', '2', '1 + 1', '3'),
  assignmentForms('*=', '2', '3', '1 + 2', '6'),
  assignmentForms('/=', '8', '2', '1 + 1', '4'),
  assignmentForms('&=', '2', '3', '1 + 2', '2'),
  assignmentForms('|=', '2', '1', '0 + 1', '3'),
  assignmentForms('^=', '2', '3', '1 + 2', '1'),
  assignmentForms('<<=', '2', '3', '1 + 2', '16'),
  assignmentForms('>>=', '16', '2', '1 + 1', '4'),
  assignmentForms('>>>=', '16', '2', '1 + 1', '4'),
  sameValueForms('==', '2', '1 + 1', '2', '1 + 1', 'true'),
  sameValueForms('!=', '2', '1 + 1', '3', '1 + 2', 'true'),
  sameValueForms('>', '3', '1 + 2', '2', '1 + 1', 'true'),
  sameValueForms('<', '2', '1 + 1', '3', '1 + 2', 'true'),
  sameValueForms('>=', '2', '1 + 1', '2', '1 + 1', 'true'),
  sameValueForms('<=', '2', '1 + 1', '2', '1 + 1', 'true'),
  sameValueForms('matmul@', '{1 2;3 4}', '{1 2;3 4}', '{1;1}', '{1;1}', '[3,7]'),
  {
    name: '@',
    forms: [
      { expr: '@2020-01-02', expected: 1577894400000 },
      { expr: '@(2020-01-02)', expected: '1483228800000' },
    ],
  },
  {
    name: '>@',
    forms: [
      { expr: '@2020-01-02 >@', expected: '2020-01-02' },
      { expr: '(@2020-01-02) >@', expected: '2020-01-02' },
    ],
  },
  {
    name: '>#',
    forms: [
      { expr: '#1d >#', expected: '1天 0小时 0分钟 0秒' },
      { expr: '(#1d) >#', expected: '1天 0小时 0分钟 0秒' },
    ],
  },
  {
    name: '>#w',
    forms: [
      { expr: '#1w >#w', expected: '1.00周' },
      { expr: '(#1w) >#w', expected: '1.00周' },
    ],
  },
  {
    name: '>#W',
    forms: [
      { expr: '#1w >#W', expected: '1.00周' },
      { expr: '(#1w) >#W', expected: '1.00周' },
    ],
  },
  {
    name: '>#d',
    forms: [
      { expr: '#1w >#d', expected: '7.00天' },
      { expr: '(#1w) >#d', expected: '7.00天' },
    ],
  },
  {
    name: '>#D',
    forms: [
      { expr: '#1w >#D', expected: '7.00天' },
      { expr: '(#1w) >#D', expected: '7.00天' },
    ],
  },
  {
    name: '>#h',
    forms: [
      { expr: '#1d >#h', expected: '24.00小时' },
      { expr: '(#1d) >#h', expected: '24.00小时' },
    ],
  },
  {
    name: '>#H',
    forms: [
      { expr: '#1d >#H', expected: '24.00小时' },
      { expr: '(#1d) >#H', expected: '24.00小时' },
    ],
  },
  {
    name: '>#m',
    forms: [
      { expr: '#1h >#m', expected: '60.00分钟' },
      { expr: '(#1h) >#m', expected: '60.00分钟' },
    ],
  },
  {
    name: '>#M',
    forms: [
      { expr: '#1h >#M', expected: '60.00分钟' },
      { expr: '(#1h) >#M', expected: '60.00分钟' },
    ],
  },
  {
    name: '>#s',
    forms: [
      { expr: '#60s >#s', expected: '60.00秒' },
      { expr: '(#60s) >#s', expected: '60.00秒' },
    ],
  },
  {
    name: '>#S',
    forms: [
      { expr: '#60s >#S', expected: '60.00秒' },
      { expr: '(#60s) >#S', expected: '60.00秒' },
    ],
  },
  {
    name: '>#@',
    forms: [
      { expr: '#1d >#@', expected: '1970-01-02 08:00:00' },
      { expr: '(#1d) >#@', expected: '1970-01-02 08:00:00' },
    ],
  },
];

describe('OPERATORS basic shape coverage', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
  });

  test('operator case table covers every configured operator key', () => {
    const coveredOperators = OPERATOR_CASES.map(({ name }) => name).sort();
    expect(coveredOperators).toEqual([...INITIAL_OPERATOR_NAMES].sort());
  });

  test.each(OPERATOR_CASES)('$name supports its basic expression shapes', ({ forms }) => {
    for (const { expr, expected, before = [] } of forms) {
      Calculator.clearAllCache();
      before.forEach(setupExpr => Calculator.calculate(setupExpr));
      expect(calc(expr)).toBe(expected);
    }
  });
});
