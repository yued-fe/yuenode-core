const ENV_TYPE = process.env.ENV_TYPE || 'local';

module.exports = {
  /**
   * 服务环境配置
   */
  apps: [
    {
      // 服务别名
      name: 'm',
      script: 'example/index.js',
      node_args: '--harmony',
      instances: 0,
      exec_mode: 'cluster',
      // 以下是日志输出选项
      out_file: 'logs/m.qidian.com/out.log',
      error_file: 'logs/m.qidian.com/err.log',
      merge_logs: true,
      // 以下是站点配置
      env: {
        // 站点配置
        yuenodeConf: JSON.stringify({
          // NODE服务项目别名
          NODE_SITE: 'm',
          // 当前Node服务环境
          ENV_TYPE: ENV_TYPE,
          // 服务端口
          port: 10500,
          // 是否开启L5 taf平台适用
          l5_on: false,

          // 项目配置文件夹地址
          path: '/Users/shilei/qidian-git/qidian-m/.cache/config',
          // 配置文件名,默认为 server.js
          server_conf_file: 'server',
          // 动态路由映射文件或文件夹名,默认为 routermap，如果是文件夹默认加载文件夹内的index
          routermap_file: 'routes', 
          // extends文件或文件夹名，如果是文件夹默认加载文件夹内的index，没有index的话加载loader
          extends_file: 'extends',
          // 是否开启简繁体转换功能
          character_conversion: true,

          // 是否开启静态化服务
          static_server_on: true,
          // 静态化路由配合文件,默认为 static_routermap
          static_routermap_file: 'static_routermap',
          // 静态化服务原有后端接口，后端post所有页面数据，不使用此静态化接口改为空字符串即可
          static_server_cgi: '/api/v2/setData',
          // 新静态化接口，复用动态路由，使用则注意在动态路由加入static字段，后端post请求动态路由，不需要传body数据，不使用此静态化接口改为空字符串即可
          static_dynamic_router: '/api/setStatic',
        })
      }
    }
  ]
};