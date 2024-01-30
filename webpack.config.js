//const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const fs = require("fs")

const scripts = fs.readdirSync("./scripts/")

let entry = {}
scripts.forEach((elem)=>{
  entry[elem.split(".")[0]] = `./scripts/${elem}`
})
console.log(entry)

module.exports = {
    mode: 'none',
    entry: entry,
    output: {
      path: __dirname + '/public/javascripts',
      filename: '[name].js'
    },
    plugins:[
      //new HardSourceWebpackPlugin()
    ],
    //cache:true,
    module: {
      /*rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]*/
    },
    resolve: {
      fallback: {

      }
    },
    devtool: 'source-map'
  };