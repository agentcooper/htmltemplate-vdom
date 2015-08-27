var path = require('path');

module.exports = {
  devtool:
    process.env.NODE_ENV === 'production' ? undefined : 'inline-source-map',

  entry: path.resolve(__dirname, './lib/clientRuntime.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'clientRuntime.js',

    library: 'clientRuntime',
    libraryTarget: 'umd'
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};
