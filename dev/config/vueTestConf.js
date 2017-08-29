'use strict';

const axios = require('axios');

/**
 * stateInfo
 * 动态静态路由都需要的渲染资料
 */

axios.defaults.timeout = 5000;

const config = {
    // NODE服务项目别名
    NODE_SITE: 'm',
    // 当前Node服务环境
    ENV_TYPE: 'local',
    // 服务端口
    port: 8080,
    // 是否开启L5 taf平台适用
    l5_on: false,
};
module.exports = {
    config,
    middlewares: [
        // 请求记录中间件
        {
            name: 'logger',
            options: {}
        },
        // 错误处理中间件
        {
            name: 'errorHandler',
            options: {
                // 渲染错误页要用的数据
                errorInfo: {
                    envType: config.ENV_TYPE || '',
                }
            }
        },
    ],
    routers: [
        {
            name: 'vueRouter',
            options: {
                templatePath: '/Users/shilei/test/vue-isomorphic/dist/m/index.html',
                bundlePath: '/Users/shilei/test/vue-isomorphic/dist/m/vue-ssr-bundle.json',
                // manifestPath: '/Users/shilei/test/vue-hackernews-2.0/dist/vue-ssr-client-manifest.json',
                handleRequestIP: function* (ctx) {
                    /**
                     * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                     * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                     */
                    // axios.defaults.headers.host = nodeConf.cgi.domain;
                    // if (global.config.l5_on && nodeConf.cgi.L5.enable) {
                    //     const L5 = require('../lib/co-l5.js');
                    //     let reqHost = yield L5.getAddr(ctx, serverConf.cgi.L5);
                    //     axios.defaults.baseURL = reqHost ? reqHost : serverConf.cgi.ip;
                    // } else {
                    //     axios.defaults.baseURL = nodeConf.cgi.ip;
                    // }
                }
            }
        },
    ]
};