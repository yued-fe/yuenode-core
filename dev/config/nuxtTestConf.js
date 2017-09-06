'use strict';

const path = require('path');

const config = {
    // NODE服务项目别名
    NODE_SITE: 'm',
    // 当前Node服务环境
    ENV_TYPE: 'local',
    // 服务端口
    port: 8008,
    // 是否开启L5 taf平台适用
    l5_on: false,
    // server.js
    nuxtConfigs: [path.join(__dirname, '../test/dist/server/booklist-universal/server.js')]
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
                },
                // pro 环境错误显示 query
                errorMsgPassword: '_y_error_show'
            }
        },
        // lb 探测回包, DONT REMOVE
        {
            name: 'monitorBack',
            options: {}
        },
    ],
    routers: [
        {
            name: 'nuxtRouter',
            options: {
                serverConfigs: config.nuxtConfigs.map(function(elem) {
                    return require(elem)[config.ENV_TYPE];
                }),
                handleRequestIP: function* (ctx, nodeConf) {
                    const axios = require('axios');
                    axios.defaults.timeout = 5000;

                    /**
                     * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                     * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                     */
                    axios.defaults.headers.host = nodeConf.cgi.domain;
                    if (global.config.l5_on && nodeConf.cgi.L5 && nodeConf.cgi.L5.enable) {
                        const L5 = require('../lib/co-l5.js');

                        let reqHost = yield L5.getAddr(ctx, nodeConf.cgi.L5);
                        axios.defaults.baseURL = reqHost ? reqHost : nodeConf.cgi.ip;
                        ctx.appendLog('L5 got IP: ' + reqHost + ', use ' + axios.defaults.baseURL);
                    } else {
                        axios.defaults.baseURL = nodeConf.cgi.ip;
                    }
                }
            }
        },
    ]
};