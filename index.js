'use strict';

/**
 * yuenode-core 使用入口文件
 * @module index
 * 
 * @param {object} opt              启动参数对象
 * @param {object} opt.config       站点配置对象
 * @param {array}  opt.middlewares  中间件数组
 * @param {array}  opt.routers      路由数组
 */

global.Promise = require('bluebird');
const app = require('koa')();
const chalk = require('chalk');
const dateformat = require('dateformat');

module.exports = function yuenode(opt = {}) {

    const config = opt.config || {},
        middlewares = opt.middlewares || [],
        routers = opt.routers || [];

    // 全局 config
    global.config = config || {};

    // 挂载中间件
    middlewares.forEach((m) => {
        // 是中间件直接应用
        if (typeof m === 'function') {
            app.use(m);
        } else {
            try {
                app.use(require(`./middleware/${m.name}`)(m.options || {}));
            } catch (err) {
                app.use(require(m.name)(m.options || {}));
            }
        }
    });

    // 挂载路由
    routers.forEach((r) => {
        // 是路由直接应用
        if (r.routes && r.allowedMethods) {
            app.use(r.routes()).use(r.allowedMethods());
        } else {
            let router = require(`./router/${r.name}`);
            router = typeof router === 'function' ? router(r.options || {}) : router;
            app.use(router.routes()).use(router.allowedMethods());
        }
    });

    // 启动监听
    app.listen(config.PORT, config.IP, () => {
        console.log(
            chalk.green('\n = = = = = = = = = = = = = = = = = = = = = =\n'),
            chalk.green('Reboot at: '), chalk.red(dateformat((new Date()).getTime(), 'yyyy-mm-dd HH:MM:ss')), '\n',
            chalk.green('Server NODE_SITE: '), chalk.blue(config.NODE_SITE), '\n',
            chalk.green('Server ENV_TYPE: '), chalk.blue(config.ENV_TYPE), '\n',
            chalk.green('Server IP: '), chalk.blue(config.IP), '\n',
            chalk.green('Yuenode Server is listening on port: '), chalk.bold(config.PORT), '\n',
            chalk.green('= = = = = = = = = = = = = = = = = = = = = =')
        );
    });
};

