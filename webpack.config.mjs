import nodeExternals from 'webpack-node-externals';
import Dotenv from 'dotenv-webpack';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    target: 'node',
    externals: [nodeExternals()],
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    plugins: [
      new Dotenv()
    ],
    resolve: {
      extensions: ['.ts', '.js']
    },
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
        ],
      },
      mode: 'production'
};