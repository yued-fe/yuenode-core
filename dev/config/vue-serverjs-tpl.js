/**
 * 此文件为 vue 项目框架及配置示例
 */

const activityPath = '%ACTIVITY_PATH%'; // 活动url，作为模板变量，在打包的时候会被替换

const host = ['activity.qidian.com'];

const nuxtConfig = {
    dev: false,
    buildDir: __dirname,
    router: {
        base: `/v/${activityPath}/`, // 新老板活动并存，加上 /v/ 用于 nginx 转发
    },
};

const allConfigs = {
    local: {
        nuxtConfig,
        cgiIp: 'devactivity.qidian.com',
        publicPath: `//127.0.0.1:8080/activity/${activityPath}/`,
    },

    // dev/oa/pre 等环境格式统一, 唯独 cgiIp 不一致
    dev: '10.247.165.120:10096',
    oa: '10.119.82.136:10096',
    pre: '10.212.19.208:10096',

    ol: {
        host,
        nuxtConfig,
        // 打包的时候 publicPath 就已经是线上环境的地址了
        cgiIp: '10.58.108.210:10096',
        // L5 配置，有则使用
        cgiL5: {
            MODID: 64162049,
            CMDID: 65536
        }
    },
};

// 把 dev/oa/pre 等环境配置补充完整
Object.keys(allConfigs).forEach(function(name) {
    if (typeof allConfigs[name] === 'string') {
        const cgiIp = allConfigs[name];
        allConfigs[name] = {
            host,
            nuxtConfig,
            cgiIp,
            publicPath: `//${name}qidian.gtimg.com/activity/${activityPath}/`,
        };
    }
});

module.exports = allConfigs;

