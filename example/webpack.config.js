const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'example.js'
    },
    plugins: [new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html')
    })],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-react', '@babel/preset-env', {
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-syntax-dynamic-import'
                        ]
                    }]
                }
            },
            {
                test: /\.airtable/,
                loader: path.resolve('../index.js'),
                options: {
                    apiKey: process.env.AIRTABLE_API_KEY // This needs to be setup in environment variables
                }
            }
        ]
    }
};
