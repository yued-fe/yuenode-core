'use strict';

/**
 * 加载nuxt ssr路由
 * @module router/vueRouter
 * 
 * @param {object}      opt                     启动参数对象
 * @param {string}      opt.configPath          nuxt config 文件路径
 * @param {function}    opt.handleRequestIP     请求地址 例如使用L5
 * @param {function}    opt.webpackPablicPath   webpack pablicPath
 */

const router = require('koa-router')();
const { Nuxt } = require('nuxt');

module.exports = function addNuxtRouter(opt) {

    const config = require(opt.configPath);

    const nuxt = new Nuxt(config);

    // let __webpack_public_path__;
    // global.webpackPablicPath = opt.webpackPablicPath || '//' + global.config.ENV_TYPE + 'qidian.gtimg.com'
    // __webpack_public_path__ = __webpack_public_path__.startsWith('//') ?
    // '//' + global.config.ENV_TYPE + __webpack_public_path__.substr(2) :
    // global.config.ENV_TYPE + __webpack_public_path__;

    const renderer = ctx => {
        return new Promise((resolve, reject) => {
            nuxt.render(ctx.req, ctx.res, promise => {
                promise.then(resolve).catch(reject);
            });
        });
    };

    router.get(config.router.base + '*', function*() {
        if (opt.handleRequestIP) {
            yield opt.handleRequestIP(this);
        }
        yield renderer(this);
    });

    return router;
};