import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import dottie from 'dottie';

const config = {};

export function load(configPath, {envVariable = 'NODE_ENV', logger = console.log, envDelimiter = '__', fileCheck = fs.existsSync} = {}) {

  const basePath = path.join(configPath, 'base.json');
  if (!fileCheck(basePath)) {
    throw new Error(`Base config on path ${basePath} does not exist.`);
  }

  _.merge(config, require(basePath));

  if (process.env[envVariable]) {
    const envCfgPath = path.join(configPath, 'environments', `${process.env[envVariable]}.json`);
    if (fileCheck(envCfgPath)) {
      logger(`Adding env config '${envCfgPath}'`);
      _.merge(config, require(envCfgPath));
    } else {
      logger(`Env config '${envCfgPath}' not found.`);
    }
  }

  const customConfigPath = path.join(configPath, 'config.json');
  if (fileCheck(customConfigPath)) {
    logger(`Adding custom config '${customConfigPath}'`);
    _.merge(config, require(customConfigPath));
  } else {
    logger(`Custom config '${customConfigPath}' not found.`);
  }

  const paths = dottie.paths(config);
  let key;
  paths.forEach(p => {
    key = p.replace('.', envDelimiter).toUpperCase();
    if ({}.hasOwnProperty.call(process.env, key)) {
      logger(`Overriding settings from env variable ${key}`);
      dottie.set(config, p, (process.env[key] === 'true' || process.env[key] === 'false') ? process.env[key] === 'true' : process.env[key]);
    }
  });

}

export default config;
