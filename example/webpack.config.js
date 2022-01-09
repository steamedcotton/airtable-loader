const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// For this example, AIRTABLE_API_KEY will need to be setup in environment variables
const { AIRTABLE_API_KEY } = process.env;

module.exports = {
  entry: './src/index.tsx',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'example.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html')
    })
  ],
  module: {
    rules: [
      {
        test: /\.([jt]sx?)?$/,
        use: 'ts-loader'
      },
      {
        test: /\.airtable/,
        // Replace the following with:
        //   loader: 'airtable-loader',
        // when running in your own project
        loader: path.resolve('../index.js'),
        options: {
          apiKey: AIRTABLE_API_KEY,
          showStats: true
        }
      }
    ]
  }
};
