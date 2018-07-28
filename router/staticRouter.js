'use strict';

/**
 * 加载静态路由
 * @module router/staticRouter
 * 
 * @param {object}      opt                      启动参数对象
 * @param {boolean}     opt.staticServerOn       是否开启静态化
 * @param {string}      opt.staticFileRoot       静态化文件存放根目录
 * @param {string}      opt.staticPath           静态化接口路径
 * @param {object}      opt.staticRouterMap      静态化routerMap
 * @param {string}      opt.dynamicStaticPath    新静态化接口路径
 * @param {object}      opt.dynamicRouterMap     动态routerMap
 * @param {function}    opt.getRequestIP         获取请求地址方法，返回ip或host用于发送后端请求，参数 ctx，注意为 generator 函数
 * @param {function}    opt.getHeader            处理请求header方法，返回header用于发送后端请求，参数 原header,ctx
 * @param {function}    opt.getRenderData        处理渲染data方法，返回data用于渲染，参数 原data,ctx
 */

const router = require('koa-router')();

const utils = require('../lib/utils.js');

module.exports = function addStaticRouter(opt) {
    // 没开启静态化则直接返回空路由
    if (!opt.staticServerOn) {
        return router;
    }

    // 静态文件根目录
    let staticRoot =  typeof opt.staticFileRoot === 'string' ? opt.staticFileRoot : opt.staticFileRoot.path;
    staticRoot = staticRoot.startsWith('/') ? staticRoot : '/' + staticRoot;

    /***
     * 配置路由
     * @param  prefix    静态化前缀
     * @param  routerMap
     * @param  configFn  配置函数
     */
    function setRouter(prefix, routerMap, configFn) {
        for (let route of Object.keys(routerMap)) {
            let routeConf = routerMap[route];
            // routerConf 为字符串形式
            if (typeof routeConf === 'string') {
                routeConf = {
                    views: routeConf,
                    static: routeConf
                };
            }
            // 如果动态路由配置了静态化，则启用静态化
            if (!!routeConf.static) {
                // 检查每个路由配置的文件夹是否存在
                const staticPath = routeConf.static.split('/').filter(n => n !== '');
                let pathArr = [staticRoot, ...staticPath];
                // 如果以路径以 .html 结尾，就将其作为静态生成文件的文件名，否则将路径全部视为文件夹，文件名默认用 index.html
                let fileName = 'index.html';
                if (pathArr[pathArr.length-1].endsWith('.html')) {
                    fileName = pathArr.splice(-1)[0];
                }
                let filePath = pathArr.join('/');
                
                // 路由path不以'/'开头的则补全
                route = route.startsWith('/') ? route : '/' + route;
                const staticRouter = require('koa-router')();
                staticRouter.post(route, configFn(routeConf, filePath, fileName));
                router.use(prefix, staticRouter.routes());
            }
        }
    }

    // 原有静态化服务
    if (!!opt.staticPath) {

        /***
         * 静态化处理函数
         * @param  {object} routeConf           路由配置
         * @param  {string} filePath, fileName  要生成的文件路径和文件名
         */
        const configRouter = (routeConf, filePath, fileName) => function* staticRoutersHandler() {
            // log
            this.appendLog('routerConf: ' + JSON.stringify(routeConf));

            // 生成静态页面
            const writeResult = yield utils.writeStaticFile(this, routeConf.views, filePath, fileName, this.request.body);
            const resultMsg = writeResult === 304 ? `${[filePath, fileName].join('/')} is not modified` : `Create ${[filePath, fileName].join('/')} success`;
            
            // log
            this.appendLog(`staticMsg: ${resultMsg}`);

            // 返回结果
            this.body = {
                code: 0,
                msg: resultMsg
            };
        };

        // 设置路由
        setRouter(opt.staticPath, opt.staticRouterMap, configRouter);

    }

    // 新静态化接口，复用动态路由
    if (!!opt.dynamicStaticPath) {

        /***
         * 静态化处理函数
         * @param  {object} routeConf           路由配置
         * @param  {string} filePath, fileName  要生成的文件路径和文件名
         */
        const configRouter = (routeConf, filePath, fileName) => function* staticRoutersHandler() {
            // log
            this.appendLog('routerConf: ' + JSON.stringify(routeConf));

            // 取得去除前缀和端口号的host
            const host = utils.fixHost(this.host);

            let body = {};

            // 如果配置中有cgi，则向后端请求数据, 没有配置cgi则不向后端发送数据
            if (!!routeConf.cgi) {

                // 取得处理过的cgi请求路径，合并query
                const cgiUrl = utils.fixCgi(opt.getRequestIP ? yield opt.getRequestIP(this) : this.host, routeConf.cgi, this.query, this.params);

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
                // log
                this.appendLog('sendReq: No cgi, do not send request');
            }

            // 生成静态页面
            const writeResult = yield utils.writeStaticFile(this, routeConf.views, filePath, fileName, opt.getRenderData ? opt.getRenderData(body, this) : body);
            const resultMsg = writeResult === 304 ? `${[filePath, fileName].join('/')} is not modified` : `Create ${[filePath, fileName].join('/')} success`;
            
            // log
            this.appendLog(`staticMsg: ${resultMsg}`);

            // 返回结果
            this.body = {
                code: 0,
                msg: resultMsg
            };
        };

        // 设置路由
        setRouter(opt.dynamicStaticPath, opt.dynamicRouterMap,  configRouter);
    }

    return router;
};



