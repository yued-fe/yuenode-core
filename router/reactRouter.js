'use strict';

/**
 * 加载vue ssr路由
 * @module router/vueRouter
 * 
 * @param {object}      opt                     启动参数对象
 * @param {string}      opt.templatePath        模板文件路径
 * @param {string}      opt.bundlePath          bundle 文件路径
 */

const fs = require('fs');
const router = require('koa-router')();
const React = require('react');
const { renderToString } = require('react-dom/server');

module.exports = function addVueRouter(opt) {

    const template = fs.readFileSync(opt.templatePath, 'utf8');
    const bundle = require(opt.bundlePath);

    router.get('*', function () {
        const instance = React.createElement(bundle.default, {});

        this.body = renderToString(instance);
    });

    return router;
};


// import React from 'react';  
// import {renderToString} from 'react-dom/server';  
// import { createMemoryHistory, match, RouterContext } from 'react-router';  
// import { Provider } from 'react-redux';  
// import createRoutes from 'routes';  
// import configureStore from 'stores/configureStore';  
// import {setImage} from 'actions/image';  
// import header from './meta';

// export default function render(req, res) {  
//   const history = createMemoryHistory();
//   const store = configureStore({}, history);
//   const routes = createRoutes();

//   match({routes, location: req.url}, (err, redirect, props) => {
//     if (err) {
//       res.status(500).json(err);
//     } else if (redirect) {
//       res.redirect(302, redirect.pathname + redirect.search);
//     } else if (props) {
//       new Promise(resolve => {
//         return resolve(store.dispatch(setImage()));
//       }).then(() => {
//         const initialState = store.getState();
//         const componentHTML = renderToString(
//           <Provider store={store}>
//             <RouterContext {...props} />
//           </Provider>
//         );
//         return res.status(200).send(`
//           <!doctype html>
//           <html>
//           <head>
//             ${header.title.toString()}
//             ${header.meta.toString()}
//             ${header.link.toString()}
//           </head>
//           <body>
//             <div id="app" class="content">${componentHTML}</div>
//             <script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};</script>
//             <script type="text/javascript" src="/assets/app.js"></script>
//           </body>
//           </html>
//         `);
//       }).catch((err) => {
//         console.log('Error happened ' + err.stack);
//         res.status(500).json(err);
//       });
//     } else {
//       res.sendStatus(404);
//     }
//   });
// }


// import express from 'express';
// import React from 'react';
// import { renderToString } from 'react-dom/server';
// import { RoutingContext, match } from 'react-router';
// import { Provider } from 'react-redux';
// import routes from './routes';
// import configureStore from './store';

// const app = express();

// function renderFullPage(html, initialState) {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//     </head>
//     <body>
//       <div id="root">
//         <div>
//           ${html}
//         </div>
//       </div>
//       <script>
//         window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
//       </script>
//       <script src="/static/bundle.js"></script>
//     </body>
//     </html>
//   `;
// }

// app.use((req, res) => {
//   match({ routes, location: req.url }, (err, redirectLocation, renderProps) => {
//     if (err) {
//       res.status(500).end(`Internal Server Error ${err}`);
//     } else if (redirectLocation) {
//       res.redirect(redirectLocation.pathname + redirectLocation.search);
//     } else if (renderProps) {
//       const store = configureStore();
//       const state = store.getState();

//       Promise.all([
//         store.dispatch(fetchList()),
//         store.dispatch(fetchItem(renderProps.params.id))
//       ])
//       .then(() => {
//         const html = renderToString(
//           <Provider store={store}>
//             <RoutingContext {...renderProps} />
//           </Provider>
//         );
//         res.end(renderFullPage(html, store.getState()));
//       });
//     } else {
//       res.status(404).end('Not found');
//     }
//   });
// });