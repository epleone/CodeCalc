const CalcCode = require("./src/calculator.min.js");

// 从存储更新自定义函数与常数到 FUNCTIONS / CONSTANTS
CalcCode.updateCustomFromStorage(CalcCode.Calculator, CalcCode.FUNCTIONS, CalcCode.CONSTANTS);

const SETTINGS_KEY = 'calculatorSettings';
const DEFAULT_SETTINGS = {
  quickCalcPasteToggle: true,
};

/** 从 dbStorage 读取设置；每次调用现读，保证设置页改动能立刻生效 */
function getCalculatorSettings() {
  try {
    const saved = utools.dbStorage.getItem(SETTINGS_KEY);
    if (!saved) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('读取设置失败:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

window.CodeCalcCore = {
  Calculator: CalcCode.Calculator,
  OPERATORS: CalcCode.OPERATORS,
  FUNCTIONS: CalcCode.FUNCTIONS,
  CONSTANTS: CalcCode.CONSTANTS,
  updateCustomFromStorage: CalcCode.updateCustomFromStorage,
  isFunctionDefinition: CalcCode.isFunctionDefinition,
  isConstantDefinition: CalcCode.isConstantDefinition,
  getCalculatorSettings,
};
