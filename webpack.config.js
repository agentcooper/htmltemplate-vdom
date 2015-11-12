var path = require('path');

module.exports = {
  devtool:
    process.env.NODE_ENV === 'production' ? undefined : 'inline-source-map',

  entry: {
    'clientRender': path.resolve(__dirname, './lib/render.js'),
    'clientRuntime': path.resolve(__dirname, './lib/client/runtime.js')
  },

  node: {
    fs: 'empty'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',

    library: '[name]',
    libraryTarget: 'umd'
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'transform?brfs!babel-loader'},
      { test: /\.json$/, loader: 'json-loader'}
    ]
  }
};
