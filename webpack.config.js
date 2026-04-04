const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
       // No need to write a index.html
        new HtmlWebpackPlugin(),
        // Do not accumulate files in ./dist
        new CleanWebpackPlugin(),
        // Copy static assets only (clothes/furnitures/textures are served by game-assets)
        new CopyPlugin({
            patterns: [
                { from: 'assets/toon',  to: 'assets/toon' },
                { from: 'assets/house', to: 'assets/house', noErrorOnMissing: true },
                { from: 'assets/fonts', to: 'assets/fonts', noErrorOnMissing: true },
                { from: 'assets/ui',    to: 'assets/ui',    noErrorOnMissing: true },
                { from: 'assets/map_jardin.json', to: 'assets/map_jardin.json', noErrorOnMissing: true },
                { from: 'assets/vide.json',       to: 'assets/vide.json',       noErrorOnMissing: true },
            ]
        }),
    ],
    devServer: {
        port: 3000,
        // Hot-reloading, the sole reason to use webpack here <3
        hot: true,
        liveReload: true,
        // Proxy les assets dynamiques vers le serveur game-assets (port 3001)
        proxy: [
            {
                context: ['/assets/clothes', '/assets/furnitures', '/assets/textures'],
                target: 'http://localhost:3001',
                pathRewrite: { '^/assets': '' },
                changeOrigin: true,
            },
        ],
    },
};
