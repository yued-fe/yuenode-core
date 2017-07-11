'use strict';

/**
 * 错误处理中间件，将所有抛出的错误在此统一处理
 * @module middleware/errorHandler
 *
 * @param {object}  opt                 启动参数对象
 * @param {object}  opt.errorInfo       渲染错误页所需信息
 */
      
const path = require('path');
const fs = require('fs');

const utils = require('../lib/utils.js');

module.exports = ({errorInfo}) => function* onerror(next) {
    try {
        yield next;

        // 404
        if (this.status === 404) {
            let err = new Error('Not Found');
            err.status = 404;
            err.stack = 'Not Found';
            throw err;
        }
    } catch (err) {
        
        // ENOENT support
        if (err.code === 'ENOENT') {
            err.status = 404;
        }

        if (typeof err.status !== 'number') {
            err.status = 500;
        }
        this.status = err.status;

        // log
        this.appendLog(`ERRORMSG: ${err.message}`);

        // 静态化错误直接返回
        if (this.method.toUpperCase() === 'POST') {
            this.body = {
                code: err.status,
                msg: err.message,
                stack: err.stack
            };
            return false;
        }

        /**
         * 默认渲染错误数据，pro 环境可以通过 url 添加 ?__yuenode_error_show=666 来显示错误信息
         * @member errorinfo
         * @inner
         * @const
         * 
         * @property    {string}   code     错误状态码
         * @property    {string}   msg      错误描述信息
         * @property    {string}   stack    错误堆栈信息
         */
        let body = {
            code: this.status,
            msg: 'Something went wrong.',
            stack: ''
        };
        if (global.envType !== 'pro' || this.query.__yuenode_error_show == 666) {
            body.msg = err.message;
            body.stack = err.stack;
        }
        body = typeof errorInfo === 'object' ? Object.assign(body, errorInfo) : body;

        // 渲染状态码错误页
        try {
            const page = `error/${this.status}.html`;
            try {
                // 渲染项目模板中的状态码错误页
                const host = utils.fixHost(this.host);
                this.body = this.render(path.join(host, page), body);
            } catch (err) {
                // 没有的话渲染项目views根目录中的状态码错误页
                this.body = this.render(page, body);
            }

        // 没有配置状态码错误页则渲染error.html
        } catch (err) {
            try {
                // 渲染项目模板中的error.html
                const host = utils.fixHost(this.host);
                this.body = this.render(path.join(host,'error'), body);
            } catch (err) {
                try {
                    // 没有的话渲染项目views根目录中的error.html
                    this.body = this.render('error', body);
                } catch (err) {
                    // 没有的话使用框架机中的error页面，不使用render防止是渲染出错
                    const errPath = path.join(__dirname, '../views/error.html');
                    let errTxt = fs.readFileSync(errPath, 'utf8');
                    this.body = errTxt
                        .replace('{{code}}', body.code)
                        .replace('{{msg}}', body.msg)
                        .replace('{{stack}}', body.stack);
                }
            }
        }
    }
};
