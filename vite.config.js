import path from 'path'
import { defineConfig } from 'vite'

export default () => {
    return defineConfig({
      resolve: {
        alias: {
          'three/examples': path.resolve(
            __dirname,
            'node_modules/three/examples/'
          ),
          three: path.resolve(
            __dirname,
            'node_modules/three/build/three.module.js'
          )
        },
      },
    })
  }