'use strict';

/**
 * 简繁体转换，根据 cookie中的 lang 字段判断
 * @module middleware/characterConversion
 *
 * @param {object}  opt                  启动参数对象
 * @param {boolean} opt.ConversionOn     是否开启简繁体转换
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
    }

    yield next;

    // 如果开启转换且为繁体，则转换
    if (isZht) {
        this.body = Chinese.s2t(this.body);
        this.appendLog('characterConversion: Traditional');
    }
};
