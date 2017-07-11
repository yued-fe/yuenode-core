'use strict';

/**
 * lb探测回包, DONT REMOVE, 必用
 * @module middleware/monitorBack
 */

module.exports = (opt) => function* (next) {
    if (this.request.path === '/monitor/monitor.jsp') {
        this.body = '0';
    } else {
        yield next;
    }
};
