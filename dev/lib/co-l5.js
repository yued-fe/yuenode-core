'use strict';

/***
 * L5
 * package.json add "@tencent/cl5": "^1.0.10",
 * 
 * @param ctx
 * @param L5_CONF: {
                "MODID": 64138113,
                "CMDID": 524288
            }
 */

const thunk = require('thunkify');
const L5 = require('@tencent/cl5');

const ApiGetRoute = thunk(L5.ApiGetRoute);
const ApiRouteResultUpdate = thunk(L5.ApiRouteResultUpdate);

function* getAddr(ctx, L5_CONF) {
    if (!L5_CONF || !L5_CONF.MODID || !L5_CONF.CMDID) {
        return false;
    }

    try {
        let addr = yield ApiGetRoute({
            modid: L5_CONF.MODID, //唯一MODID
            cmd: L5_CONF.CMDID, //唯一CMDID
            timeout: 0.2,
            debug: false
        });
        if (addr && addr.length && addr[0].ip && addr[0].port) {
            addr = addr[0].ip + ':' + addr[0].port;
            ctx.appendLog('L5 got IP: ' + addr);
            return addr;
        } else {
            ctx.appendLog('L5 got IP failed: got invalid addr');
            return false;
        }
    } catch (err) {
        ctx.appendLog('L5 got IP failed: ' + err.message);
        return false;
    }
}

exports.getAddr = getAddr;
exports.apiRouteResultUpdate = ApiRouteResultUpdate;