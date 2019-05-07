import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import dottie from 'dottie';

function defaultFileResolver(filepath) {
  if (fs.existsSync(filepath)) {
    return require(filepath);
  }
  return false;
}

export default function load(configPath, {envVariable = 'NODE_ENV', logger = console.log, envDelimiter = '__', fileResolver = defaultFileResolver} = {}) {
  const config = {};

  const baseCfgPath = path.join(configPath, 'base.json');
  const baseCfg = fileResolver(baseCfgPath);

  if (!baseCfg) {
    throw new Error(`Base config on path ${baseCfgPath} does not exist.`);
  }

  _.merge(config, baseCfg);

  if (process.env[envVariable]) {
    const envCfgPath = path.join(configPath, 'environments', `${process.env[envVariable]}.json`);
    const envCfg = fileResolver(envCfgPath);

    if (envCfg) {
      logger(`Adding env config '${envCfgPath}'`);
      _.merge(config, envCfg);
    } else {
      logger(`Env config '${envCfgPath}' not found.`);
    }
  }

  const customConfigPath = path.join(configPath, 'config.json');
  const customConfig = fileResolver(customConfigPath);

  if (customConfig) {
    logger(`Adding custom config '${customConfigPath}'`);
    _.merge(config, customConfig);
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

  return config;
}
