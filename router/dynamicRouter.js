'use strict';

/**
 * 加载动态路由
 * @module router/dynamicRouter
 * 
 * @param {object}      opt                     启动参数对象
 * @param {object}      opt.routerMap           动态routerMap
 * @param {function}    opt.getRequestIP        获取请求地址方法，返回ip或host用于发送后端请求，参数 ctx，注意为 generator 函数
 * @param {function}    opt.getHeader           处理请求header方法，返回header用于发送后端请求，参数 原header,ctx
 * @param {function}    opt.getRenderData       处理渲染data方法，返回data用于渲染，参数 原data,ctx
 */

const router = require('koa-router')();

const utils = require('../lib/utils.js');

// routerMap 处理，提取 host 兼容多域名
function parseRouterMap(routerMap) {
    let parsedRoutes = {};

    for (let k of Object.keys(routerMap)) {
        const v = routerMap[k];
        let reqPath = '';
        let domain = '_';

        // path 结尾没有 ／ 的补全
        if (!k.endsWith('/')) {
            k = k + '/';
        }
        let pos = k.indexOf('/');
        
        // 如routerMap中path开以 / 开头,则理解成无配置域名,用默认domain '_' 代替域名
        if (pos === 0) {
            reqPath = k;

        // 如果配置域名，则把域名提取出来
        } else {
            domain = k.substr(0, pos);
            reqPath = k.substr(pos);

            // 如果views没有补全域名,则补全域名
            if (v.views && v.views.startsWith('/') && !v.views.startsWith('/' + domain)) {
                v.views = domain + v.views;
            }
        }

        // 输出改为 {path: {domain: {views && cgi }}} 的格式
        if (!parsedRoutes[reqPath]) {
            parsedRoutes[reqPath] = {};
        }
        parsedRoutes[reqPath][domain] = v;
    }

    return parsedRoutes;
}


// 路由处理函数
const configRouter = (routeConf, opt) => function* renderRoutersHandler() {
    // 取得去除前缀和端口号的host
    const host = utils.fixHost(this.host);

    // 取得当前请求的views和cgi配置
    let currentConf;

    // 如果路由映射中有当前域名，按照当前请求域名匹配
    if (!!routeConf[host]) {
        currentConf = routeConf[host];

    // 否则匹配默认配置'_'
    } else {
        currentConf = routeConf._;
    }

    // log
    this.appendLog('routerConf: ' + JSON.stringify(currentConf));

    let body = {};

    // 如果配置中有cgi，则向后端请求数据，没有配置cgi则不向后端发送数据
    if (currentConf.cgi) {

        // 判断第二套 L5 配置，兼容用
        let reqCgi = currentConf.cgi, isL52 = false;
        if (reqCgi.startsWith('{{L52}}')) {
            reqCgi = reqCgi.replace('{{L52}}', '');
            isL52 = true;
        }

        // 取得处理过的cgi请求路径，合并query
        const cgiUrl = utils.fixCgi(opt.getRequestIP ? yield opt.getRequestIP(this, isL52) : this.host, reqCgi, this.query, this.params);

        // 取得header，根据环境指定后端host,后台根据host来区分后端业务server
        const header = opt.getHeader ? opt.getHeader(this.header, this) : this.header;

        // log
        this.appendLog(`sendReq: ${cgiUrl}`);

        // 发送请求
        const {result, spendTime} = yield utils.requestCgi(cgiUrl, {
            headers: header
        });

        // log
        this.appendLog(`gotRes: ${result.statusCode} ${spendTime}s`);

        // 处理结果
        body = utils.handleResponce(result, this);
        if (!body) {return false;}

    // 没有配置cgi则不向后端发送数据
    } else {
        this.appendLog('sendReq: No cgi, do not send request');
    }

    // 渲染页面
    let html = this.render(currentConf.views, opt.getRenderData ? opt.getRenderData(body, this) : body);

    // 输出html
    this.body = html;
};

module.exports = function addDynamicRouter(opt) {

    let parsedRouterMap = parseRouterMap(opt.routerMap);

    for (let route of Object.keys(parsedRouterMap)) {
        router.get(route, configRouter(parsedRouterMap[route], opt));
    }

    return router;
};