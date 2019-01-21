import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';

import pkg from './package.json';

export default [{
    input: 'device-manager/index.js',
    output: {
      file: './dist/device-manager.js',
      format: 'cjs'
    },
    external : Object.keys(pkg.dependencies),
    plugins: [
      resolve({
        preferBuiltins: false
      }),
      commonjs(),
      json()
    ]

  },

  {
    input: 'ws-ble/index.js',
    output: {
      file: './dist/ws-ble.js',
      format: 'cjs'
    },
    external : Object.keys(pkg.dependencies),
    plugins: [
      resolve({
        preferBuiltins: false
      }),
      commonjs(),
      json()
    ]

  }
]
