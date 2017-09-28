'use strict';

const path = require('path');
const chalk = require('chalk');
const L5 = require('../lib/co-l5.js');

module.exports = function vueConfig(opt) {
    return {
        config: {
            ENV_TYPE: opt.env || 'ol',
            IP: process.env.IP || '127.0.0.1',
            PORT: process.env.YUENODE_PORT || process.env.PORT || 55555
        },
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
                        envType: opt.env || '',
                    },
                    // pro 环境错误显示 query
                    errorMsgPassword: opt.errorShowPwd || '_y_error_show'
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
                    serverConfigs: opt.nuxtConfigs.map(function(conf) {
                        try {
                            return require(conf);
                        } catch (err) {
                            console.log(chalk.red('No config file:', conf));
                        }
                    }).filter((conf) => conf),
                    handleRequestIP: function* (ctx, nodeConf) {
                        const headers = Object.assign({ 'x-url': ctx.url }, ctx.header);

                        /**
                         * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                         * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                         */
                        let baseURL = yield L5.getAddr(ctx, nodeConf.cgiL5);
                            baseURL = baseURL ? baseURL : nodeConf.cgiIp;

                        baseURL = baseURL.startsWith('http') ? baseURL : 'http://' + baseURL;

                        ctx.req.axiosDefaults = { headers, baseURL };
                    }
                }
            },
        ]
    };
};