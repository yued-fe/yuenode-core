'use strict';

/**
 * 将 COOKIE,UA,URL 等信息、自定义扩展、静态文件配置注入，用于兼容老项目
 * @module middleware/addOldRenderInfo
 *
 * @param {object} opt                  启动参数对象
 * @param {object} opt.staticConf       用于渲染的 staticConf
 * @param {object} opt.extendsLoader    用于渲染的自定义扩展方法对象
 */

const cookies = require('cookie');
const url = require('url');
const dateFormat = require('dateformat');

module.exports = (opt) => function* addOldRenderInfo(next) {

    const userHeader = this.header;
    const userCookie = !!userHeader.cookie ? userHeader.cookie : '';
    const cookieObj = cookies.parse(userCookie);
    
    const userUA = !!userHeader['user-agent'] ? userHeader['user-agent'] : 'NO USER-AGENT SET';
    const clientHost = !!userHeader['x-host'] ? userHeader['x-host'] : this.host;
    const userClientUrl = this.protocol + '://' + clientHost + this.url;
    const userUrlParse = url.parse(userClientUrl, true, true);

    const oldRender = this.render;

    // 将业务中较常使用到的 COOKIE,UA,URL 等信息作为通用信息抛给前端业务方使用
    this.render = function (view, data) {
        data = Object.assign(data, {
            CLIENT_URL: userClientUrl,
            cookie: userCookie,
            CLIENT_COOKIE: userCookie,
            CLIENT_UA: JSON.stringify(userUA, null, 4),
            LOCATION: userUrlParse,

            // 静态文件配置
            pageUpdateTime: dateFormat((new Date()).getTime(), "yyyy-mm-dd,HH:MM:ss"),
            staticConf: (opt.staticConf || ''),
            envType: global.config.ENV_TYPE || ''
        }, opt.extendsLoader);

        return oldRender.call(this, view, data);
    };

    yield next;
};
