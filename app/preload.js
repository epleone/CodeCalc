const CalcCode = require("./src/calculator.min.js");

// 将 自定义函数保存到 functions 中
CalcCode.addCustomFunctionFromStorage(CalcCode.Calculator, CalcCode.FUNCTIONS);

window.CodeCalcCore = {
  Calculator: CalcCode.Calculator,
  OPERATORS: CalcCode.OPERATORS,
  FUNCTIONS: CalcCode.FUNCTIONS,
  CONSTANTS: CalcCode.CONSTANTS,
  addCustomFunctionFromStorage: CalcCode.addCustomFunctionFromStorage,
  isFunctionDefinition: CalcCode.isFunctionDefinition,
};