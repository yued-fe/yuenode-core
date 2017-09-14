'use strict';

const path = require('path');
const L5 = require('../lib/co-l5.js');

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
    nuxtConfigs: ['/Users/shilei/qidian-git/qidian-activity-proj/dist/server/v-tpl-create-booklist/server.js']
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
                    const headers = Object.assign({
                        'x-host': ctx.host,
                        'x-url': ctx.url,
                    }, ctx.header, {
                        host: nodeConf.cgi.domain || ctx.host
                    });

                    /**
                     * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                     * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                     */
                    let baseURL;
                    if (global.config.l5_on && nodeConf.cgi.L5 && nodeConf.cgi.L5.enable) {
                        baseURL = yield L5.getAddr(ctx, nodeConf.cgi.L5);
                        baseURL = baseURL ? baseURL : nodeConf.cgi.ip;
                    } else {
                        baseURL = nodeConf.cgi.ip;
                    }
                    baseURL = baseURL.startsWith('http') ? baseURL : 'http://' + baseURL;

                    ctx.req.getReqDefaults = () => new Promise((resolve, reject) => {
                        resolve({ headers, baseURL });
                    });
                }
            }
        },
    ]
};