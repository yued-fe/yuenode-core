'use strict';

/**
 * 处理favicon逻辑
 * @module middleware/favicon
 *
 * @param {object}  opt         启动参数对象
 * @param {string}  opt.root    favicon文件路径
 */

const fs = require('fs');
const path = require('path');

module.exports = ({root}) => function* favicon(next) {
    const iconPath = path.join(root, '/favicon.ico');

    if ('/favicon.ico' !== this.path) {
        return yield next;
    }

    if ('GET' !== this.method && 'HEAD' !== this.method) {
        this.status = 'OPTIONS' === this.method ? 204 : 405;
        this.set('Allow', 'GET, HEAD, OPTIONS');
        return;
    }

    this.set('Cache-Control', 'public, max-age=86400');
    this.type = 'image/x-icon';
    this.body = fs.readFileSync(iconPath);
};