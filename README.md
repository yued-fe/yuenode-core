# yuenode-core

> 文档可见: [yuenode-core文档](https://yued-fe.github.io/yuenode-core/)

## 使用 npm 包

### 调用函数启动

```js
require('yuenode-core')({启动配置对象});
```

### 命令行启动

直接调用 yuenode-core 命令，即可启动当前目录下的 yuenode.config.js ；或你可以制定配置文件启动：

```bash
yuenode-core "配置文件路径"
```

## 单独使用 modules 包

所有的 middleware 和 router 的使用方法都是

```js
require('middleware or router')({启动配置对象});
```

## 配置文件

配置文件由 config（对象）、middlewares（数组）、routers（数组）三个部分组成。

### config

config 对象为框架机启动所需信息，具体项目陈列如下：

```js
config: {
    // 站点名
    NODE_SITE: 'm',
    // 当前环境
    ENV_TYPE: 'dev',
    IP: process.env.IP,
    PORT: process.env.PORT
}
```

### middlewares

middlewares 数组为框架机需要挂载的中间件，配置形式为 {name: '',options: {}}, 其中 name 为 middleware 文件夹下模块名称，options 为启动所需配置对象。如果需要使用其他中间件（例如自己扩展），可以直接在配置文件中启用，示例如下：

```js
middlewares: [
    // 简繁体转换
    {
        name: 'characterConversion',
        options: {
            conversionOn: true,
        }
    },
    // 个人编写的中间件
    require('path/to/middleware')({启动配置对象}),
]
```

### routers

routers 数组为框架机需要挂载的路由，配置形式为 {name:'',options:{}} , 其中 name 为 router 文件夹下路由名称，options 为启动所需配置对象。如果需要使用其他路由（例如自己扩展），可以直接在配置文件中启用，示例如下：

```js
routers: [
    // 模版渲染路由
    {
        name: 'dynamicRouter',
        options: {
            // 动态路由配置
            routerMap: routerMap,
            // 获取请求ip
            getRequestIP: function* (ctx) {
                /**
                 * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                 * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                 */
                if (siteConf.l5_on) {
                    const L5 = require('./lib/co-l5.js');
                    let reqHost = yield L5.getAddr(ctx, serverConf.cgi.L5);
                    return reqHost ? reqHost : serverConf.cgi.ip;
                }
                return serverConf.cgi.ip;
            },
            // 注入请求header
            getHeader: (header, ctx) => {
                return Object.assign({
                    'x-host': ctx.header['x-host'] ? ctx.header['x-host'] : ctx.host,
                    'x-url': ctx.url,
                }, header, {
                    host: serverConf.cgi.domain || ctx.host
                });
            },
            // 注入渲染数据
            getRenderData: (body, ctx) => {
                const clientHost = ctx.header['x-host'] ? ctx.header['x-host'] : ctx.host;
                const userClientUrl = ctx.protocol + '://' + clientHost + ctx.url;

                // 将业务中较常使用到的信息作为通用信息抛给前端业务方使用
                body.YUE = Object.assign(body.YUE || {}, stateInfo, {
                    ua: ctx.header['user-agent'],
                    location: url.parse(userClientUrl, true, true),
                    cookie: ctx.header.cookie,
                    cookieObj: cookies.parse(ctx.header.cookie),
                });

                return body;
            },
        }
    },
    // 个人编写的路由
    require('path/to/router')({启动配置对象}),
]
```

## 扩展

现有框架机中间件或者路由如果不能满足需求，可以自由进行扩展。

### 中间件

中间件模块的形式为一个接收一个配置对象、返回 generator 函数的函数，示例如下：

```js
'use strict';

module.exports = (opt) => function* favicon(next) {
    this.body = opt.message;
    yield next;
};
```

### 路由

路由模块的形式为一个接收一个配置对象、返回路由的函数，示例如下：

```js
'use strict';

const router = require('koa-router')();
module.exports = (opt) => {
    router.get(opt.route, function* () {
        this.body = opt.message;
    })
    return router;
};
```

## 现有模块

### dynamicRouter

因为有些项目有多域名的情况，所以首先会将动态路由变为 path.host.config 的形式，可以支持多域名的情况。收到客户端请求后根据 path 去寻找相应的域名下的路由配置，取得 views 模板，向后端发送 cgi 取得数据，cgi 返回不为 200/301/302，则发生对应错误。返回 200 但 code 不为 0 则发生 400 错误。

### addEjsRender

提供 ejs 渲染能力，通过调用 this.render(view, content) 进行渲染；在模板渲染时跳过 <script type="text/ejs-template"></script> 标签中的 <% %> 编译，但依旧会编译其中的 <%% %>，然后返回客户端供客户端使用。

### characterConversion

如果开启了简繁体转换，则会根据 cookie 中的 lang 字段判断简繁体，如果 lang 为 zht，则会将内容转换为繁体输出到客户端。

### errorHandler

发生错误时，如果模板文件根目录中存在有 error/{状态码}.html（如 error 文件夹下 404.html），则渲染对应状态码的页面，否则会渲染普通 error 页面。

寻找顺序为：模板文件根目录中对应域名文件夹下 error/{状态码}.html 页面 => 模板文件根目录 error/{状态码}.html 页面 => 模板文件根目录中对应域名文件夹下 error.html 页面 => 模板文件根目录 error.html 页面 => 框架机自带 error.html 页面。顺序寻找，找到即渲染。

为兼容已有项目，请注意 error.html 页面与 error 文件夹为平级。以上为强约定，不需要配置。

pro 环境可以通过 url 添加错误显示 query 密码来显示错误信息。

```js
/**
 * 完整顺序示例目录结构
 */
views
    |
    |-+ m.qidian.com
    |    |
    |    |-+ error
    |    |    |
    |    |    |- 404.html   // ① 模板文件根目录中对应域名文件夹下 error/{状态码}.html 页面
    |    |
    |    |- error.html      // ③ 模板文件根目录中对应域名文件夹下 error.html 页面
    |
    |-+ error
    |    |
    |    |- 404.html        // ② 模板文件根目录 error/{状态码}.html 页面
    |
    |- error.html           // ④ 模板文件根目录 error.html 页面

                            // ⑤ 框架机自带 error 页

/**
 * error 页面渲染错误信息，pro 环境可以通过 url 添加错误显示 query 密码来显示错误信息
 */
{
  code                      // [String] statusCode
  msg                       // [String] 错误描述信息
  stack                     // [String] 错误堆栈信息
}
```

### dynamicRouter

可以通过传入配置项 getRequestIP 函数进行请求地址的修改，例如进行负载均衡。要注意 getRequestIP 应为 generator 函数。

可以通过传入配置项 getHeader 函数进行请求 header 的修改，可以自由注入后端请求需要的参数。

可以通过传入配置项 getRenderData 函数进行模板渲染数据的修改，可以自由注入模板渲染需要的参数。

### staticRouter

静态化一律由后端 post 请求进行发起，旧有接口需要将页面所需 data 全部 post 过来，新接口则可以复用模板渲染的路由，可以直接 post 请求模板渲染的路由 path，只要在模板渲染的路由中配置好相应的 static 字段即可。

收到后端请求后，取得对应 path 的路由配置，取得 views 模板，从请求 body 中（新接口则向后端发送请求）获得数据，渲染完成后保存在 static 配置的文件路径中。

如果生成静态文件成功，后端则后收到 statusCode 为 200、body.code 为 0 的回应。否则 body.msg 为相应的原因。

可以通过传入配置项 getRequestIP 函数进行请求地址的修改，例如进行负载均衡。要注意 getRequestIP 应为 generator 函数。

可以通过传入配置项 getHeader 函数进行请求 header 的修改，可以自由注入后端请求需要的参数。

可以通过传入配置项 getRenderData 函数进行模板渲染数据的修改，可以自由注入模板渲染需要的参数。

### vueRouter

vueRouter 为 vue 提供 ssr 的支持。请参考以下相关格式来配置 server-entry 和以及应用入口：

```js
import { app, router, store } from './app';

export default context => {
  return new Promise((resolve, reject) => {

    const { url } = context;
    const fullPath = router.resolve(url).route.fullPath;
    if (fullPath !== url) {
      reject({ redirect: fullPath });
    }

    router.push(url);

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents();
      if (!matchedComponents.length) {
        reject({ status: 404 });
      }

      Promise.all(matchedComponents.map(component => {
        return component.preFetch && component.preFetch(store);
      })).then(() => {
        context.state = store.state;
        resolve(app);
      }).catch(reject);

    }, reject);
  });
};
```

## 框架机配置实例
```js
'use strict';

const dateformat = require('dateformat');
const cookies = require('cookie');
const url = require('url');

// yworkflow 可以传入 getConfigs 所需参数进行启动，不依赖环境变量
const getConfigs = require('../lib/getConfigs.js')();
const routerMap = getConfigs.getDynamicRouterMap();        // 动态路由
const siteConf = getConfigs.getSiteConf();
const serverConf = getConfigs.getServerConf();
const envType = getConfigs.getEnv();

/**
 * stateInfo
 * 动态静态路由都需要的渲染资料
 */
const stateInfo = {
    // 静态文件配置
    staticConf: serverConf.static || {},
    envType: envType || '',
    extends: getConfigs.getExtendsLoader()
};

module.exports = {
    config: {
        NODE_SITE: siteConf.NODE_SITE,
        ENV_TYPE: envType,
        IP: process.env.IP,
        PORT: process.env.PORT
    },
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
                    envType: envType || '',
                    staticConf: serverConf.static || {},
                    defaultSearch: { 'keywords': '' }
                },
                // pro 环境错误显示 query
                errorMsgPassword: '_y_error_show'
            }
        },
        // favicon
        {
            name: 'favicon',
            options: {
                root: serverConf.views.path
            }
        },
        // lb 探测回包, DONT REMOVE
        {
            name: 'monitorBack',
            options: {}
        },
        // 简繁体转换
        {
            name: 'characterConversion',
            options: {
                conversionOn: siteConf.character_conversion,
            }
        },
        /**
         * 将模板渲染方法render注入koa，需要渲染时调用 this.render(views, cgiData);
         * 模板文件统一默认配置使用.html结尾
         * 为了提高服务器性能,默认配置开启cache
         * 模板发布后框架机通过后置脚本重启,所以无需考虑内存缓存问题
         */
        {
            name: 'addEjsRender',
            options: {
                root: serverConf.views.path
            }
        },
        // 兼容旧项目，将 COOKIE,UA,URL 等信息、自定义扩展、静态文件配置注入
        {
            name: 'addOldRenderInfo',
            options: {
                staticConf: serverConf.static || {},
                extendsLoader: getConfigs.getExtendsLoader()
            }
        },
        // 解析post请求body
        {
            name: 'koa-bodyparser',
            options: {
                detectJSON: function(ctx) {
                    return /\.json$/i.test(ctx.path);
                },
                onerror: function(err, ctx) {
                    if (err) {
                        throw new Error('接口:' + ctx.request.url + '请求的JSON格式有误:\n' + err.message);
                    }
                }
            }
        }
    ],
    routers: [
        // 启用模版渲染路由
        {
            name: 'dynamicRouter',
            options: {
                // 动态路由配置
                routerMap: routerMap,
                // 获取请求ip
                getRequestIP: function* (ctx) {
                    /**
                     * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                     * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                     */
                    if (siteConf.l5_on) {
                        const L5 = require('../lib/co-l5.js');
                        let reqHost = yield L5.getAddr(ctx, serverConf.cgi.L5);
                        return reqHost ? reqHost : serverConf.cgi.ip;
                    }
                    return serverConf.cgi.ip;
                },
                // 注入请求header
                getHeader: (header, ctx) => {
                    return Object.assign({
                        'x-host': ctx.header['x-host'] ? ctx.header['x-host'] : ctx.host,
                        'x-url': ctx.url,
                    }, header, {
                        host: serverConf.cgi.domain || ctx.host
                    });
                },
                // 注入渲染数据
                getRenderData: (body, ctx) => {
                    const clientHost = ctx.header['x-host'] ? ctx.header['x-host'] : ctx.host;
                    const userClientUrl = ctx.protocol + '://' + clientHost + ctx.url;

                    // 将业务中较常使用到的信息作为通用信息抛给前端业务方使用
                    body.YUE = Object.assign(body.YUE || {}, stateInfo, {
                        ua: ctx.header['user-agent'],
                        location: url.parse(userClientUrl, true, true),
                        cookie: ctx.header.cookie,
                        cookieObj: cookies.parse(ctx.header.cookie),
                    });

                    return body;
                },
            }
        },
        // 启用静态化路由
        {
            name: 'staticRouter',
            options: {
                // 静态化服务开关
                staticServerOn: siteConf.static_server_on,
                // 静态文件存放跟路径
                staticFileRoot: serverConf.index,
                // 静态化接口路由路径和路由配置
                staticPath: siteConf.static_server_cgi,
                staticRouterMap: getConfigs.getStaticRouterMap(),
                // 新静态化接口路由路径和路由配置
                dynamicStaticPath: siteConf.static_dynamic_router,
                dynamicRouterMap: routerMap,
                // 获取请求ip
                getRequestIP: function* (ctx) {
                    /**
                     * 如果在站点配置中开启L5，则通过L5获得后台服务IP或者域名，否则默认使用配置文件中的ip地址
                     * 由于L5需要服务器环境支持(依赖底层库),本地调试不载入L5模块防止出错。
                     */
                    if (siteConf.l5_on) {
                        const L5 = require('../lib/co-l5.js');
                        let reqHost = yield L5.getAddr(ctx, serverConf.cgi.L5);
                        return reqHost ? reqHost : serverConf.cgi.ip;
                    }
                    return serverConf.cgi.ip;
                },
                // 注入请求header
                getHeader: (header, ctx) => {
                    return Object.assign({
                        'x-host': ctx.header['x-host'] ? ctx.header['x-host'] : ctx.host,
                        'x-url': ctx.url,
                    }, {
                        host: serverConf.cgi.domain || ctx.host
                    });
                },
                // 注入渲染数据
                getRenderData: (body, ctx) => {
                    // 将业务中较常使用到的信息作为通用信息抛给前端业务方使用
                    body.YUE = Object.assign(body.YUE || {}, stateInfo , {
                        pageUpdateTime: dateformat((new Date()).getTime(), "yyyy-mm-dd,HH:MM:ss"),
                    });

                    return body;
                },
            }
        }
    ]
};
```
