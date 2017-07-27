'use strict';

/**
 * 加载vue ssr路由
 * @module router/vueRouter
 * 
 * @param {object}      opt                     启动参数对象
 * @param {string}      opt.templatePath        模板文件路径，模板需要添加<!--vue-ssr-outlet-->
 * @param {string}      opt.bundlePath          bundle 文件路径
 * @param {string}      opt.manifestPath        manifest 文件路径
 * @param {object}      opt.renderContext       渲染上下文
 */

const fs = require('fs');
const router = require('koa-router')();
const { createBundleRenderer } = require('vue-server-renderer');

module.exports = function addVueRouter(opt) {

    const template = fs.readFileSync(opt.templatePath, 'utf8');
    const bundle = require(opt.bundlePath);

    const renderOption = {
        runInNewContext: false,
        template,
    };

    if (opt.manifestPath) {
        renderOption.clientManifest = require(opt.manifestPath);
    }

    const bundleRenderer = createBundleRenderer(bundle, renderOption);

    const renderer = context => {
        return new Promise((resolve, reject) => {
            bundleRenderer.renderToString(context, (err, html) => {
                if (err) {
                    reject(err);
                }
                resolve(html);
            });
        });
    };

    router.get('*', function* () {
        const context = Object.assign(opt.renderContext || {}, {
            url: this.url
        });
        yield renderer(context).then(html => {
            this.body = html;
        }).catch(err => {
            if (err.redirect) {
                return this.redirect(err.redirect);
            } else if (err.status === 404) {
                this.status = err.status;
            } else {
                throw new Error(err.msg || 'Vue render error');
            }
        });
    });

    return router;
};



