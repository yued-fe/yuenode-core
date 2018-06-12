'use strict';

/**
 * 请求记录中间件，可以通过 this.appendLog('想要添加的信息') 在其他中间件中添加 log
 * @module middleware/logger
 */

const dateformat = require('dateformat');

module.exports = () => function* logger(next) {
    // request
    const start = Date.now();

    // 添加 log
    this._logItems = [
        '===== Separator =====',
        `[${dateformat(start, 'yyyy-mm-dd HH:MM:ss')}] ${this.method} ${this.originalUrl}`,
    ];

    // 添加 log 方法
    this.appendLog = function (log) {
        this._logItems.push(log);
    };
    
    yield next;

    // 返回结果
    this.appendLog(`<-- ${this.status} ${(Date.now() - start)/1000}s`);

    // 打印日志
    this.status < 400 || this.status === 404
        ? console.log(this._logItems.join('\n'))
        : console.error(this._logItems.join('\n'));
};  
