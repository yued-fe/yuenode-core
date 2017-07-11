'use strict';

/**
 * 请求记录中间件，可以通过 this.appendLog('想要添加的信息') 在其他中间件中添加 log
 * @module middleware/logger
 */

const dateformat = require('dateformat');
const chalk = require('chalk');

module.exports = () => function* logger(next) {
    // request
    const start = Date.now();

    // 添加 log
    this._logItems = [
        chalk.gray('===== Separator ====='),
        `[${dateformat(start, 'yyyy-mm-dd HH:MM:ss')}] ${this.method} ${this.originalUrl}`,
    ];

    // 添加 log 方法
    this.appendLog = function (log) {
        this._logItems.push(log);
    };
    
    yield next;

    // 返回结果
    this.appendLog(`<-- ${
        String(this.status).startsWith('2') ?
        chalk.green(this.status) : 
        String(this.status).startsWith('3') ?
        chalk.yellow(this.status) : 
        chalk.red(this.status) 
    } ${(Date.now() - start)/1000}s`);

    // 打印日志
    console.log(this._logItems.join('\n'));
};  
