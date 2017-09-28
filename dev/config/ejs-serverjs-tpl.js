/**
 * 此文件为 ejs 项目框架及配置示例
 */

const commonConf = {
    // host
    host: ['www.qidian.com'],

    // 是否开启简繁体转换功能
    characterConversion: false,
    // extends，需要自己require
    extends: require('extends_file'),
    // 路由，需要自己require
    routermap: require('routermap_file'),
    // 服务器模板文件根路径
    viewsRootPath: '/data/website/qidian.com/views',

    // 是否开启静态化服务
    staticServerOn: false,
    // 静态化服务后端接口，后端定时post接口即可，不用带数据
    staticServerCgi: '/api/setStatic',
    // 服务器静态化文件存放根路径
    staticFileRootPath: '/data/website/static',
};

const config = {
    // ol 环境
    ol: {
        // staticConf 中的内容会原封不动放到模板渲染数据 YUE.staticConf 中
        staticConf: {
            domainPrefix : ''
        },
        // cgiIp 为没有 L5 的情况下请求地址
        cgiIp: '0.0.0.0:80',
        // L5 配置，有则使用
        cgiL5: {
            MODID: 64138113,
            CMDID: 524288
        }
    },
    dev: {
        staticConf: {
            domainPrefix : 'dev'
        },
        cgiIp: '0.0.0.1:80'
    },
    oa: {
        staticConf: {
            domainPrefix : 'oa'
        },
        cgiIp: '0.0.0.2:80'
    },
    pre: {
        staticConf: {
            domainPrefix : 'pre'
        },
        cgiIp: '0.0.0.3:80'
    },
};

Object.keys(config).forEach((key) => {
    config[key] = Object.assign(config[key], commonConf);
});

module.exports = config;


