import { performance } from 'node:perf_hooks';
import { Calculator, FUNCTIONS, CONSTANTS } from '../calculator.js';
import { addCustomFromDefinitionForTest, clearCustomForTest } from '../customFunctions.js';

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

function measure(fn, { warmup = 300, iterations = 1000, rounds = 5 } = {}) {
    for (let i = 0; i < warmup; i++) {
        fn();
    }

    const roundTimes = [];
    for (let r = 0; r < rounds; r++) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            fn();
        }
        roundTimes.push(performance.now() - start);
    }

    const medianMs = median(roundTimes);
    const avgMsPerOp = medianMs / iterations;
    const opsPerSec = 1000 / avgMsPerOp;
    return { medianMs, avgMsPerOp, opsPerSec, roundTimes };
}

function formatPerfSummary(rows) {
    const headers = ['module', 'avg(ms/op)', 'ops/s', 'threshold', 'status'];
    const body = rows.map(row => [
        row.name,
        row.avgMsPerOp.toFixed(4),
        Math.round(row.opsPerSec).toString(),
        `< ${row.thresholdMsPerOp}`,
        row.avgMsPerOp < row.thresholdMsPerOp ? 'PASS' : 'FAIL'
    ]);
    const allRows = [headers, ...body];
    const colWidths = headers.map((_, colIdx) =>
        Math.max(...allRows.map(row => row[colIdx].length))
    );

    const line = (char) => `+${colWidths.map(w => char.repeat(w + 2)).join('+')}+`;
    const renderRow = (row) =>
        `| ${row.map((cell, idx) => cell.padEnd(colWidths[idx], ' ')).join(' | ')} |`;

    const parts = [
        '',
        '[perf] summary',
        line('-'),
        renderRow(headers),
        line('='),
        ...body.map(renderRow),
        line('-'),
        ''
    ];
    return parts.join('\n');
}

function runScenario(name, expr, options, thresholdMsPerOp, results) {
    Calculator.clearAllCache();

    const sample = Calculator.calculate(expr);
    expect(sample).toBeDefined();
    expect(sample.value).not.toBeUndefined();

    const bench = measure(() => Calculator.calculate(expr), options);
    results.push({
        name,
        avgMsPerOp: bench.avgMsPerOp,
        opsPerSec: bench.opsPerSec,
        thresholdMsPerOp
    });

    // 使用宽松阈值，主要用于发现明显回归
    expect(bench.avgMsPerOp).toBeLessThan(thresholdMsPerOp);
}

describe('性能基准（手动执行）', () => {
    const perfResults = [];

    beforeEach(() => {
        Calculator.clearAllCache();
        clearCustomForTest(FUNCTIONS, CONSTANTS);
    });

    afterAll(() => {
        clearCustomForTest(FUNCTIONS, CONSTANTS);
        process.stdout.write(formatPerfSummary(perfResults));
    });

    test('arithmetic 模块性能', () => {
        runScenario(
            'arithmetic',
            '((12345 + 67890) / 3.14 - 42) ** 0.5',
            { warmup: 500, iterations: 3000, rounds: 7 },
            2,
            perfResults
        );
    });

    test('functions 模块性能', () => {
        runScenario(
            'functions',
            'sin(1) + cos(2) + tan(0.5) + sqrt(12345) + abs(-999)',
            { warmup: 500, iterations: 2000, rounds: 7 },
            3,
            perfResults
        );
    });

    test('string 模块性能', () => {
        runScenario(
            'string',
            'length(unbase64(base64("CodeCalcPerf")))',
            { warmup: 400, iterations: 2000, rounds: 7 },
            3,
            perfResults
        );
    });

    test('date 模块性能', () => {
        runScenario(
            'date',
            '@2020-03-15 14:30:00 > @',
            { warmup: 500, iterations: 1200, rounds: 7 },
            5,
            perfResults
        );
    });

    test('matrix 模块性能', () => {
        runScenario(
            'matrix',
            'det({1 2 3;4 5 6;7 8 10})',
            { warmup: 200, iterations: 600, rounds: 7 },
            10,
            perfResults
        );
    });

    test('custom-function 模块性能', () => {
        addCustomFromDefinitionForTest(Calculator, FUNCTIONS, CONSTANTS, 'perf_double(x)=x*2+1');
        runScenario(
            'custom-function',
            'perf_double(12345)',
            { warmup: 400, iterations: 2000, rounds: 7 },
            4,
            perfResults
        );
    });
});
