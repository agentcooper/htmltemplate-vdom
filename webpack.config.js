var path = require('path');

module.exports = {
  devtool:
    process.env.NODE_ENV === 'production' ? undefined : 'inline-source-map',

  entry: path.resolve(__dirname, './lib/client.js'),

  output: {
    path: path.resolve(__dirname, 'example/build'),
    filename: 'runtime.js',

    library: 'renderTemplate',
    libraryTarget: 'umd'
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};
