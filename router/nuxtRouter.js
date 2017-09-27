'use strict';

/**
 * 加载nuxt ssr路由
 * @module router/vueRouter
 * 
 * @param {object}      opt                     启动参数对象
 * @param {string}      opt.serverConfigs       config 数组
 * @param {function}    opt.handleRequestIP     请求地址 例如使用L5
 */

const url = require('url');
const router = require('koa-router')();
const { Nuxt } = require('nuxt');

module.exports = function addNuxtRouter(opt) {

    opt.serverConfigs.forEach(config => {
        const nuxt = new Nuxt(config.nuxtConfig);

        // 替换各环境 pablicPath
        const publicPath = config.publicPath;
        if (publicPath) {
            if (nuxt.renderer.noSSR) {
                // 如果非 ssr 模式，需要对 index.spa.html 文件的 publicPath 进行替换
                nuxt.renderer.plugin('resourcesLoaded', function(resources) {
                    const originPublicPath = resources.clientManifest.publicPath;
                    const originSpaTemplate = resources.spaTemplate;

                    // 通过重写 spaTemplate 来调整 index.spa.html 渲染内容
                    resources.spaTemplate = (data) => {
                        // manifest.xxx.js 中的 publicPath 读取的 window.__NUXT__.publicPath, ssr 的时候在下面有设置，而非 ssr 需要人工加一段 js
                        data.HEAD += `<script>window.__NUXT__ = { publicPath: "${publicPath}" }</script>`;

                        // 将 publicPath 进行全文替换
                        return originSpaTemplate(data).replace(new RegExp(originPublicPath, 'g'), publicPath);
                    };
                });
            } else {
                // ssr 模式，需要调整 server-bundle.json 中 server-bundle.js 文件的 __webpack_require__.p 变量
                nuxt.renderer.plugin('resourcesLoaded', function(resources) {
                    resources.clientManifest.publicPath = publicPath;
                    const serverBundle = resources.serverBundle.files['server-bundle.js'];
                    resources.serverBundle.files['server-bundle.js'] = serverBundle.replace(/__webpack_require__\.p = "[^"]+"/, `__webpack_require__.p = "${publicPath}"`);
                });

                // ssr 模式，还需要调整 window.__NUXT__ 对象：增加 publicPath 属性
                nuxt.renderer.plugin('ready', function(renderer) {
                    const originRenderToString = renderer.bundleRenderer.renderToString;
                    renderer.bundleRenderer.renderToString = function(context) {
                        // 通过重写 renderToString 方法，在 window.__NUXT__ 对象增加 publicPath 属性，这里需要延时一下才有 context.nuxt
                        return originRenderToString.apply(this, arguments).then((d) => {
                            context.nuxt.publicPath = publicPath;
                            return d;
                        });
                    };
                });
            }
        }

        // 根据前缀起多个 path router
        let routerBase = '';
        if (config.nuxtConfig.router && config.nuxtConfig.router.base) {
            routerBase = config.nuxtConfig.router.base.endsWith('/') ? config.nuxtConfig.router.base : config.nuxtConfig.router.base + '/';
        }
        router.get(routerBase + '*', function*() {
            this.req.url = url.parse(this.req.url).path;

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