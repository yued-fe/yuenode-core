'use strict';

/**
 * 加载nuxt ssr路由
 * @module router/vueRouter
 * 
 * @param {object}      opt                     启动参数对象
 * @param {string}      opt.serverConfigs       config 数组
 * @param {function}    opt.handleRequestIP     请求地址 例如使用L5
 */

const router = require('koa-router')();
const { Nuxt } = require('nuxt');

module.exports = function addNuxtRouter(opt) {

    opt.serverConfigs.forEach(config => {
        const nuxt = new Nuxt(config.nuxtConfig);

        // 替换各环境 pablicPath
        const publicPath = config.publicPath;
        if (publicPath) {
            nuxt.showOpen = function() {
                const resources = nuxt.renderer.resources;

                resources.clientManifest.publicPath = publicPath;
                const serverBundle = resources.serverBundle.files['server-bundle.js'];
                resources.serverBundle.files['server-bundle.js'] = serverBundle.replace(/__webpack_require__\.p = "[^"]+"/, `__webpack_require__.p = "${publicPath}"`);

                setImmediate(() => {
                    const originRenderToString = nuxt.renderer.bundleRenderer.renderToString;
                    nuxt.renderer.bundleRenderer.renderToString = function(context) {
                        return originRenderToString.apply(this, arguments).then((d) => {
                            context.nuxt.publicPath = publicPath;
                            return d;
                        });
                    };
                });
            };
        }

        // 根据前缀起多个 path router
        let routerBase = '';
        if (config.nuxtConfig.router && config.nuxtConfig.router.base) {
            routerBase = config.nuxtConfig.router.base.endsWith('/') ? config.nuxtConfig.router.base : config.nuxtConfig.router.base + '/';
        }
        router.get(routerBase + '*', function*() {
            if (opt.handleRequestIP) {
                yield opt.handleRequestIP(this, config);
            }
            yield new Promise((resolve, reject) => {
                this.res.on('close', resolve);
                this.res.on('finish', resolve);
                nuxt.render(this.req, this.res, promise => {
                    promise.then(resolve).catch(reject);
                });
            });
        });
    });

    return router;
};