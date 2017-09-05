'use strict';

/**
 * stateInfo
 * 动态静态路由都需要的渲染资料
 */
const nodeConf = {
    cgi: { // 后端动态服务相关配置
        ip: '10.247.135.236',
        domain: 'devm.qidian.com',
        L5: {
            enable: true,
            conf: {
                MODID: 64138113,
                CMDID: 851968,
            },
        },
    },
};

const config = {
    // NODE服务项目别名
    NODE_SITE: 'm',
    // 当前Node服务环境
    ENV_TYPE: 'local',
    // 服务端口
    port: 8008,
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
            name: 'nuxtRouter',
            options: {
                configPath: '/Users/shilei/yue/yuenode-core/dist/server/booklist-universal/nuxt.config.js',
                handleRequestIP: function* (ctx) {
                    const axios = require('axios');
                    axios.defaults.timeout = 5000;

                    /**
                     * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                     * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                     */
                    axios.defaults.headers.host = nodeConf.cgi.domain;
                    if (global.config.l5_on && nodeConf.cgi.L5.enable) {
                        const L5 = require('../lib/co-l5.js');

                        L5.getAddr = function () {
                            return new Promise((resolve, reject) => {
                                setTimeout(() => resolve('127.0.0.1:8080'), 2000);
                            });
                        };

                        let reqHost = yield L5.getAddr(ctx, nodeConf.cgi.L5);
                        axios.defaults.baseURL = reqHost ? reqHost : nodeConf.cgi.ip;
                        console.log(axios.defaults.baseURL);
                    } else {
                        axios.defaults.baseURL = nodeConf.cgi.ip;
                    }
                }
            }
        },
    ]
};