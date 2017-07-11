#!/usr/bin/env node

const path = require('path');
const yuenode = require('../index.js');

let config = {};
try {
    if (process.argv.length > 2) {
        config = require(path.resolve(process.cwd(), process.argv[2]));
    } else {
        config = require(path.join(process.cwd(), 'yuenode.config.js'));
    }
} catch (err) {
    console.log(err.message);
}

yuenode(config);
