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

    const middlewares = opt.middlewares || [],
        routers = opt.routers || [];

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
    app.listen(process.env.PORT, process.env.IP, () => {
        console.log(
            chalk.green('\n = = = = = = = = = = = = = = = = = = = = = =\n'),
            chalk.green('Reboot at: '), chalk.red(dateformat(Date.now(), 'yyyy-mm-dd HH:MM:ss')), '\n',
            chalk.green('Server SITE_NAME: '), chalk.blue(opt.SITE_NAME), '\n',
            chalk.green('Server ENV_TYPE: '), chalk.blue(process.env.QD_TSF_ENV), '\n',
            chalk.green('Server IP: '), chalk.blue(process.env.IP), '\n',
            chalk.green('Yuenode Server is listening on PORT: '), chalk.bold(process.env.PORT), '\n',
            chalk.green('= = = = = = = = = = = = = = = = = = = = = =')
        );
    });
};

