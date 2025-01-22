import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'calculator.js',
  output: {
    file: '../src/calculator.min.js',
    format: 'esm',
    exports: 'named',
    name: 'Calculator'
  },
  plugins: [
    resolve({
      preferBuiltins: false
    }),
    commonjs(),
    terser()
  ]
}; 