'use strict';

/**
 * stateInfo
 * 动态静态路由都需要的渲染资料
 */

const config = {
    // NODE服务项目别名
    NODE_SITE: 'm',
    // 当前Node服务环境
    ENV_TYPE: 'local',
    // 服务端口
    port: 8080,
};
module.exports = {
    config,
    middlewares: [
        // 请求记录中间件
        {
            name: 'logger',
            options: {}
        },
        // 错误处理中间件
        {
            name: 'errorHandler',
            options: {
                // 渲染错误页要用的数据
                errorInfo: {
                    envType: config.ENV_TYPE || '',
                }
            }
        },
    ],
    routers: [
        {
            name: 'vueRouter',
            options: {
                templatePath: '/Users/shilei/test/vue-isomorphic/dist/m/index.html',
                bundlePath: '/Users/shilei/test/vue-isomorphic/dist/m/vue-ssr-bundle.json',
                // manifestPath: '/Users/shilei/test/vue-hackernews-2.0/dist/vue-ssr-client-manifest.json',
                renderContext: {}
            }
        },
    ]
};