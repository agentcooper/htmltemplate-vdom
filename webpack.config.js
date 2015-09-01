var path = require('path');

module.exports = {
  devtool:
    process.env.NODE_ENV === 'production' ? undefined : 'inline-source-map',

  entry: {
    'createVdom': path.resolve(__dirname, './lib/create-vdom.js'),
    'clientRuntime': path.resolve(__dirname, './lib/client-runtime.js')
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',

    library: '[name]',
    libraryTarget: 'umd'
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};
