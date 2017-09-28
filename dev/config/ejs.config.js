'use strict';

const dateformat = require('dateformat');
const cookies = require('cookie');
const url = require('url');
const L5 = require('../lib/co-l5.js');

module.exports = function ejsConfig(opt) {
    /**
     * stateInfo
     * 动态静态路由都需要的渲染资料
     */
    const stateInfo = {
        // 静态文件配置
        staticConf: opt.staticConf || {},
        envType: opt.env || '',
        extends: opt.extends || {}
    };

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
                        staticConf: opt.staticConf || {},
                        defaultSearch: { 'keywords': '' }
                    },
                    // pro 环境错误显示 query
                    errorMsgPassword: opt.errorShowPwd || '_y_error_show'
                }
            },
            // favicon
            {
                name: 'favicon',
                options: {
                    root: opt.viewsRootPath
                }
            },
            // lb 探测回包, DONT REMOVE
            {
                name: 'monitorBack',
                options: {}
            },
            // 简繁体转换
            {
                name: 'characterConversion',
                options: {
                    conversionOn: opt.characterConversion,
                }
            },
            /**
             * 将模板渲染方法render注入koa，需要渲染时调用 this.render(views, cgiData);
             * 模板文件统一默认配置使用.html结尾
             * 为了提高服务器性能,默认配置开启cache
             * 模板发布后框架机通过后置脚本重启,所以无需考虑内存缓存问题
             */
            {
                name: 'addEjsRender',
                options: {
                    root: opt.viewsRootPath
                }
            },
            // 解析post请求body
            {
                name: 'koa-bodyparser',
                options: {
                    detectJSON: function(ctx) {
                        return /\.json$/i.test(ctx.path);
                    },
                    onerror: function(err, ctx) {
                        if (err) {
                            throw new Error('接口:' + ctx.request.url + '请求的JSON格式有误:\n' + err.message);
                        }
                    }
                }
            }
        ],
        routers: [
            // 启用模版渲染路由
            {
                name: 'dynamicRouter',
                options: {
                    // 动态路由配置
                    routerMap: opt.routermap,
                    // 获取请求ip
                    getRequestIP: function* (ctx) {
                        /**
                         * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                         * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                         */
                        let reqHost = yield L5.getAddr(ctx, opt.cgiL5);
                        return reqHost ? reqHost : opt.cgiIp;
                    },
                    // 注入请求header
                    getHeader: (header, ctx) => {
                        return Object.assign({ 'x-url': ctx.url }, header);
                    },
                    // 注入渲染数据
                    getRenderData: (body, ctx) => {
                        const clientHost = ctx.header['x-host'] ? ctx.header['x-host'] : ctx.host;
                        const userClientUrl = ctx.protocol + '://' + clientHost + ctx.url;
                        const userCookie = ctx.header.cookie || '';

                        // 将业务中较常使用到的信息作为通用信息抛给前端业务方使用
                        body.YUE = Object.assign(body.YUE || {}, stateInfo, {
                            ua: ctx.header['user-agent'] || '',
                            location: url.parse(userClientUrl, true, true),
                            cookie: userCookie,
                            cookieObj: cookies.parse(userCookie),
                        });

                        return body;
                    },
                }
            },
            // 启用静态化路由
            {
                name: 'staticRouter',
                options: {
                    // 静态化服务开关
                    staticServerOn: opt.staticServerOn,
                    // 静态文件存放跟路径
                    staticFileRoot: opt.staticFileRootPath,
                    // 静态化接口路由路径和路由配置
                    staticPath: opt.staticServerCgi,
                    routerMap: opt.routermap,
                    // 获取请求ip
                    getRequestIP: function* (ctx) {
                        /**
                         * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                         * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                         */
                        let reqHost = yield L5.getAddr(ctx, opt.cgiL5);
                        return reqHost ? reqHost : opt.cgiIp;
                    },
                    // 注入请求header
                    getHeader: (header, ctx) => {
                        return { 'x-url': ctx.url };
                    },
                    // 注入渲染数据
                    getRenderData: (body, ctx) => {
                        // 将业务中较常使用到的信息作为通用信息抛给前端业务方使用
                        body.YUE = Object.assign(body.YUE || {}, stateInfo , {
                            pageUpdateTime: dateformat(Date.now(), "yyyy-mm-dd,HH:MM:ss"),
                        });

                        return body;
                    },
                }
            }
        ]
    };
};