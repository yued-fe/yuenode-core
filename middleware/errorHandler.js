'use strict';

/**
 * 错误处理中间件，将所有抛出的错误在此统一处理
 * @module middleware/errorHandler
 *
 * @param {object}  opt                     启动参数对象
 * @param {object}  opt.errorInfo           渲染错误页所需信息
 * @param {object}  opt.errorMsgPassword    显示错误信息 query 密码，例如为 error_show， 则在 url 后加入 ?error_show 就会显示错误信息
 */
      
const path = require('path');
const fs = require('fs');

const utils = require('../lib/utils.js');

const errPath = path.join(__dirname, '../views/error.html');
const errTxt = fs.readFileSync(errPath, 'utf8');

module.exports = (opt) => function* onerror(next) {
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
        if (err.code === 'ENOENT' || err.code === 'ENOTFOUND') {
            err.status = 404;
        }
        if (err.code === 'ETIMEDOUT') {
            err.status = 504;
        }
        if (err.code === 'ECONNREFUSED') {
            err.status = 502;
        }

        if (typeof err.status !== 'number') {
            err.status = 500;
        }
        this.status = err.status;

        // log
        this.appendLog(`ERRORMSG: ${err.message === 'Render Error' ? err.stack : err.message }`);

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
         * 默认渲染错误数据，ol 环境可以通过 url 添加显示错误信息 query 密码来显示错误信息
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
            msg: err.message,
            stack: ''
        };
        if ((global.config.ENV_TYPE !== 'pro' && global.config.ENV_TYPE !== 'ol') || (opt.errorMsgPassword && Object.keys(this.query).includes(opt.errorMsgPassword))) {
            body.stack = err.stack;
        }
        body = typeof opt.errorInfo === 'object' ? Object.assign(body, opt.errorInfo) : body;

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
                    this.body = errTxt
                        .replace('{{code}}', body.code)
                        .replace('{{msg}}', body.msg)
                        .replace('{{stack}}', body.stack);
                }
            }
        }
    }
};
