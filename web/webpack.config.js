const path = require('path');

module.exports = {
  entry: {
    designer: './src/designer.js', 
    simulator: './src/simulator.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'wwwroot/js'),
  },
};