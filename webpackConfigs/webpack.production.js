const webpack = require('webpack')
const webpackConfigMerger = require('./webpackConfigMerger')
const stagingWebpackConfig = require('./webpack.staging')
const Dotenv = require('dotenv-webpack')
const path = require('path')

module.exports = webpackConfigMerger(stagingWebpackConfig, {
  devtool: 'source-map',
  // In CI, env variables will be available already (so process.env.BACKEND_URL will already exists)
  // and so are not needed to be added
  plugins: process.env.BACKEND_URL ? [
    new webpack.EnvironmentPlugin([
      'BACKEND_URL',
      'GETSTREAM_APP_KEY',
      'GETSTREAM_APP_ID',
      'GETSTREAM_ACHIEVEMENT_COMMON_TOKEN',
      'SUPPORT_CONTACT_EMAIL',
      'NODE_ENV'
    ])
  ] : [
    new Dotenv({ path: path.join(__dirname, '../envs/.production.env') })
  ]
})
