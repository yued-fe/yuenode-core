'use strict';

/***
 * 通用函数
 */

const url = require('url');
const fs = require('fs');
const path = require('path');
const request = require('co-request');
const thunk = require('thunkify');
const mkdirp = require('mkdirp');

const coMkdirp = thunk(mkdirp);

module.exports = {

    // 去除host前缀，例如local、dev等，去除端口号
    fixHost(host) {
        const reg = new RegExp('^' + global.config.ENV_TYPE, 'i');
        host = host.replace(reg, '');
        host = host.replace(/:\d*$/, '');
        return host;
    },

    /**
     * 处理cgi，补全协议、ip，合并query
     * @param   ip          ip
     * @param   cgi         routerMap中的原始cgi
     * @param   query
     * @param   params
     */
    fixCgi(ip, cgi, query, params) {

        // 根据配置获得当前环境后端请求地址
        const urlObj = url.parse(cgi, true, true);

        let ipArr = ip.split('//'), ipProtocol, ipHost;
        if (ipArr.length > 1) {
            ipProtocol = ipArr[0];
            ipHost = ipArr[1];
        } else {
            ipProtocol = 'http:';
            ipHost = ip;
        }

        let fixedCgi = {
            // 如果cgi有协议则采用，没有则根据环境变量添加
            protocol: urlObj.protocol || ipProtocol,
            // 如果cgi有域名则采用，没有则根据配置文件添加
            host: urlObj.host || ipHost,
            // 如果cgi有port则采用，没有则为空
            port: urlObj.port || null,
            pathname: urlObj.pathname,
            // 合并query，权重: 请求 query < cgi query < 请求url变量
            query: Object.assign(query, urlObj.query, params)
        };

        return url.format(fixedCgi);
    },

    /**
     * 请求后端数据
     * @param  url           处理过的url
     * @param  options       请求选项
     */
    requestCgi: function* (url, options) {
        let opt = {
            'uri': url,
            'method': 'GET',
            'gzip': true, //支持自动解析gzip
            'timeout': 5000,
            'followRedirect': false
        };

        if (options) {
            opt = Object.assign(opt, options);
        }
        let result, spendTime;
        
        const startTime = Date.now();
        result = yield request(opt);
        spendTime = (Date.now() - startTime) / 1000;
        
        return {result, spendTime};
    },

    /**
     * 处理请求返回
     * @param  result        请求结果
     * @param  ctx
     */
    handleResponce: function (result, ctx) {

        // 设置注入逻辑,透传后台的header setcookie
        if (result.headers && result.headers['set-cookie']) {
            ctx.set('set-cookie', result.headers['set-cookie']);
        }

        // 如果后台没有返回200，向外抛出
        if (result.statusCode !== 200) {

            // 如果后端返回301、302，跳转
            if (result.statusCode === 301 || result.statusCode === 302) {
                ctx.redirect(result.headers.location);
                ctx.status = result.statusCode;
                return false;
            }

            // 其余状态码直接返回客户端
            let err = new Error('status: ' + result.statusCode);
            err.status = result.statusCode;
            err.stack = JSON.stringify(result.body,null,4);
            throw err;
        }

        const body = JSON.parse(result.body);

        // 如果后端返回code不为0，向外抛出
        if (body.code !== 0) {
            let newErr = new Error(`${body.code}: ${body.msg}`);
            newErr.status = 400;
            newErr.stack = body.trace || "Backend trace is empty.";
            throw newErr;
        }

        // 都没问题就返回结果
        return body;
    },

    // 压缩html
    compressHTML(html) {
        // 如果站点配置中开启了静态化文件压缩，则执行压缩
        const minify = require('html-minifier').minify;
        try {
            // 压缩HTML
            let minifyHtml = minify(html, {
                collapseWhitespace: true,    //删除空格
                collapseInlineTagWhitespace: true    //删除行内属性空格
            });
            html = minifyHtml;
        } catch (err) {
            // 若压缩失败,则使用原始HTML,且在尾部增加tag标记,供debug用
            html += '<!-- min -->';
        }
        return html;
    },

    /**
     * 生成静态页面
     * @param   ctx       this
     * @param   tempPath  模板位置
     * @param   filePath, fileName  要生成的文件路径和文件名
     * @param   data      数据
     */
    writeStaticFile: function* (ctx, tempPath, filePath, fileName, data) {
        let html;
        // 渲染
        html = ctx.render(tempPath, data);

        //做一次内容检查
        if (!html) {
            throw new Error('Render done, No content');
        }

        // 压缩 html
        html = this.compressHTML(html);

        // 生成静态文件
        const viewPath = path.join(filePath, fileName);
        try {
            fs.writeFileSync(viewPath, html, 'utf8');
        } catch (err) {
            // 如果生成失败，则检查路径是否存在，创建后重新尝试生成
            yield coMkdirp(filePath);
            fs.writeFileSync(viewPath, html, 'utf8');
        }
    }
};