import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'calculator.js',
  output: {
    file: '../app/src/calculator.min.js',
    format: 'esm',
    exports: 'named',
    name: 'Calculator',
    sourcemap: false
  },
  plugins: [
    resolve({
      preferBuiltins: false
    }),
    commonjs(),
    terser() // 压缩代码，生产环境使用
  ]
}; 