'use strict';

/**
 * 简繁体转换，根据 cookie中的 lang 字段判断
 * @module middleware/characterConversion
 *
 * @param {object}  opt                  启动参数对象
 * @param {boolean} opt.conversionOn     是否开启简繁体转换
 */

const cookies = require('cookie');
const Chinese = require('chinese-s2t');

module.exports = (opt) => function* characterConversion(next) {
    
    const userHeader = this.header;
    const userCookie = !!userHeader.cookie ? userHeader.cookie : '';
    const cookieObj = cookies.parse(userCookie);
    
    // 默认为简体中文，以防没有cookie的情况下isZht为undefined
    let isZht = false;

    // 如果在站点设置中开启简繁体转换功能，则通过请求cookie中的 lang 字段判断简繁体
    if (opt.conversionOn) {
        if (!!userCookie) {
            // 如果有cookie且标记为繁体，则渲染为繁体
            isZht = (cookieObj.lang && cookieObj.lang === 'zht') ? true : false;
        }
        // 如果为繁体，则转换
        if (isZht) {
            const oldRender = this.render;

            // 将业务中较常使用到的 COOKIE,UA,URL 等信息作为通用信息抛给前端业务方使用
            this.render = (view, data) => {
                let html = oldRender.call(this, view, data);
                html = Chinese.s2t(html);
                this.appendLog('characterConversion: Traditional');

                return html;
            };
        }
    }

    yield next;
};
