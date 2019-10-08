const path = require('path');

module.exports = {
  entry: './src/designer.js',
  output: {
    filename: 'designer.js',
    path: path.resolve(__dirname, 'wwwroot/js'),
  },
};