import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'index.js',
  output: {
    file: '../src/ml-matrix.min.js',
    format: 'esm',
    name: 'MLMatrix'
  },
  plugins: [
    resolve({
      preferBuiltins: false
    }),
    commonjs(),
    terser()
  ]
}; 