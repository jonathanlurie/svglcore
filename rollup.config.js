import { terser } from 'rollup-plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import commonjs from '@rollup/plugin-commonjs'
import webworkify from 'rollup-plugin-webworkify'
import pkg from './package.json'

// deals with package names like '@user/package'
// so that the package name is 'package' and not '@user/package'
let packageName = pkg.name
if(~packageName.indexOf('/')){
  packageName = packageName.split('/')[1]
}

const configurations = [
  // UMD
  {
    input: pkg.entry,
    output: {
      file: pkg.browser,
      name: packageName,
      sourcemap: true,
      format: 'umd',
    },
    plugins: [
      resolve(),
      commonjs({ include: 'node_modules/**' }),
      globals(),
      builtins(),
      webworkify({ pattern: '**/*.worker.js' }),
    ],
  },

  // ESMODULE
  {
    input: pkg.entry,
    output: {
      file: pkg.module,
      name: packageName,
      sourcemap: true,
      format: 'es',
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
    ],
    plugins: [
      resolve(),
      commonjs({ include: 'node_modules/**' }),
      globals(),
      builtins(),
      webworkify({ pattern: '**/*.worker.js' }),
    ],
  },


  // CJS
  {
    input: pkg.entry,
    output: {
      file: pkg.main,
      name: packageName,
      sourcemap: true,
      format: 'cjs',
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
    ],

    plugins: [
      resolve(),
      commonjs({ include: 'node_modules/**' }),
      globals(),
      builtins(),
      // webworkify({ pattern: '**/*.worker.js' }),
    ],
  },

]


// Adding the minified umd bundle
if (process.env.NODE_ENV === 'production') {
  configurations.push(
    {
      input: pkg.entry,
      output: {
        file: pkg.browser.replace('.js', '.min.js'),
        name: packageName,
        sourcemap: false,
        format: 'umd',
      },
      plugins: [
        resolve(),
        commonjs({ include: 'node_modules/**' }),
        globals(),
        builtins(),
        webworkify({ pattern: '**/*.worker.js' }),
        terser()],
    })
}

export default configurations
