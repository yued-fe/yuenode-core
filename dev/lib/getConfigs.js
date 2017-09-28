'use strict';

/**
 * 获得各种配置
 */

const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

const ejsConfig = {
    // 使用框架
    type: 'ejs',
    // 当前环境
    env: 'ol',
    // host
    host: [],

    // 是否开启简繁体转换功能
    characterConversion: false,
    // 路由，需要自己require views cgi static
    routermap: {}, 
    // extends，需要自己require
    extends: {},
    // 服务器模板文件根路径
    viewsRootPath: '/data/website/noop',

    // 是否开启静态化服务
    staticServerOn: false,
    // 静态化服务后端接口，后端定时post接口即可，不用带数据
    staticServerCgi: '/api/setStatic',
    // 服务器静态化文件存放根路径
    staticFileRootPath: "/data/website/noop",

    // staticConf 中的内容会原封不动放到模板渲染数据 YUE.staticConf 中
    staticConf: {},
    // 后端请求IP
    cgiIp: '',
    // L5配置 MODID CMDID
    cgiL5: {}
};

const vueConfig = {
    // 使用框架
    type: 'vue',
    // 当前环境
    env: 'ol',
    // host
    host: [],

    // nuxt 配置 nuxtConfig.router.base
    nuxtConfig: {},
    // 静态文件路径 publicPath 线上没有
    // 后端请求IP
    cgiIp: '',
    // L5配置 MODID CMDID
    cgiL5: {}
};

module.exports = function (opt) {
    // 当前环境
    const env = (process.env.ENV_TYPE || process.env.QD_TSF_ENV).toLowerCase() || 'ol';

    // 接受传入参数,读取当前站点配置
    let configPath;
    if (opt && typeof opt === 'object' && opt.yuenodeConf) {
        configPath = opt.yuenodeConf;
    } else if (opt && typeof opt === 'string') {
        configPath = opt;
    } else {
        return false;
    }

    if (!path.isAbsolute(configPath)) {
        configPath = '/' + configPath;
    }

    let allConf;
    try {
        allConf = require(configPath);
    } catch (err) {
        console.log(chalk.red('File %s not found'), configPath);
        return false;
    }

    const currentConf = allConf[env];
    if (!currentConf) {
        console.log(chalk.red("File %s doesn't have '" + env + "' option"), configPath);
        return false;
    }
    currentConf.env = env;

    // 判断框架是否为 vue
    if (currentConf.nuxtConfig) {
        return Object.assign(vueConfig, currentConf);
    }
    // ejs
    return Object.assign(ejsConfig, currentConf);
};

