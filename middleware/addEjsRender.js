'use strict';

/**
 * 为 koa 注入 this.render 方法用于模板渲染服务
 * @module middleware/addEjsRender
 * 
 * @param {object} opt          启动参数对象
 * @param {string} opt.root     动态模板根路径
 */

const path = require('path');
const ejs = require('ejs');

const rewriteEjsFileLoader = require('../lib/rewriteEjsFileLoader.js');

/**
 * ejs默认配置，可以传入修改
 * @property    {string}   viewExt     模板后缀，默认为 '.html'
 * @property    {boolean}  cache       缓存，默认为 true
 * @property    {string}   delimiter   分隔符，默认为 '%'
 */
const defaultSettings = {
    // 模板文件后缀名，默认为'.html'
    viewExt: '.html',
    // 是否缓存，默认缓存
    cache: true,
    // 是否开启debug，默认不开启
    debug: false,
    // 分隔符
    delimiter: '%'
    // 另有 root 属性，必需，存放模版文件的文件夹路径，需传入
};

module.exports = function (settings) {

    if (!settings || !settings.root) {
        throw new Error('Set ejsRender needs settings.root');
    }

    settings.root = path.resolve(process.cwd(), settings.root);

    settings = Object.assign(defaultSettings,settings);

    // 支持 inline-ejs，重写 ejs 的读取文件方法
    rewriteEjsFileLoader(settings.delimiter);

    function render(view, options) {
        // 处理绝对路径和后缀，生成绝对路径
        view += view.endsWith(settings.viewExt) ? '' : settings.viewExt;
        let viewPath = path.join(settings.root, view);

        // 调用原生 ejs.renderFile 方法
        return ejs.renderFile(viewPath, options, (err, str) => {
            if (err) {
                err.message = 'ejs render failed: \n' + err.message;
                throw err;
            }
            return str;
        });
    }

    return function* addEjsRender(next) {
        /**
         * this.render 渲染方法
         * @param {String} view     模板路径
         * @param {Object} content  渲染内容数据
         * @return {String} html
         */
        this.render = function (view, content) {
            // 将 setting 和 state、 render 传入的内容合并，供模板渲染使用
            let _content = Object.assign({
                cache: settings.cache,
                debug: settings.debug,
                delimiter: settings.delimiter
            }, content);

            let html = render(view, _content);

            // 返回内容
            return html;
        };

        yield next;
    };
    
};
