'use strict';

/**
 * 加载动态静态路由
 * @module router/bothRouter
 * 
 * @param {object}      opt                             启动参数对象
 * @param {object}      opt.basic                       动静态路由相同配置
 * @param {function}    opt.basic.getRequestIP          获取请求地址方法，返回ip或host用于发送后端请求，参数 ctx，注意为 generator 函数
 * 
 * @param {object}      opt.dynamic                     动态路由配置
 * @param {object}      opt.dynamic.routerMap           动态routerMap
 * @param {function}    opt.dynamic.getHeader           处理请求header方法，返回header用于发送后端请求，参数 原header,ctx
 * @param {function}    opt.dynamic.getRenderData       处理渲染data方法，返回data用于渲染，参数 原data,ctx
 * 
 * @param {object}      opt.static                      静态路由配置
 * @param {boolean}     opt.static.staticServerOn       是否开启静态化
 * @param {string}      opt.static.staticFileRoot       静态化文件存放根目录
 * @param {string}      opt.static.staticPath           静态化接口路径
 * @param {object}      opt.static.staticRouterMap      静态化routerMap
 * @param {string}      opt.static.dynamicStaticPath    新静态化接口路径
 * @param {object}      opt.static.dynamicRouterMap     动态routerMap
 * @param {function}    opt.static.getHeader            处理请求header方法，返回header用于发送后端请求，参数 原header,ctx
 * @param {function}    opt.static.getRenderData        处理渲染data方法，返回data用于渲染，参数 原data,ctx
 */

const router = require('koa-router')();

module.exports = function addTwoRouters(opt) {
    // 启用模版渲染路由
    const dynamicRouter = require('./dynamicRouter.js')(Object.assign({}, opt.basic, opt.dynamic));

    // 启用静态化路由
    const staticRouter = require('./staticRouter.js')(Object.assign({}, opt.basic, opt.static));

    return router.use(dynamicRouter.routes()).use(staticRouter.routes());
};