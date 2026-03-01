// webpack.config.lib.js – builds game-core as a distributable UMD library
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',

  entry: './src/api/index.ts',

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            // emit declaration files alongside JS output
            compilerOptions: {
              declaration: true,
              declarationDir: path.resolve(__dirname, 'dist/types'),
              outDir: path.resolve(__dirname, 'dist'),
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  output: {
    filename:      'game-core.js',
    path:          path.resolve(__dirname, 'dist'),
    library:       'GameCore',
    libraryTarget: 'umd',
    globalObject:  'this',
  },

  // pixi.js and mobx are peer-dependencies – the consumer supplies them
  externals: {
    'pixi.js': {
      commonjs:  'pixi.js',
      commonjs2: 'pixi.js',
      amd:       'pixi.js',
      root:      'PIXI',
    },
    mobx: {
      commonjs:  'mobx',
      commonjs2: 'mobx',
      amd:       'mobx',
      root:      'mobx',
    },
  },

  plugins: [new CleanWebpackPlugin()],
};
