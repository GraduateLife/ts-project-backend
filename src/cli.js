#!/usr/bin/env node
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable import/no-extraneous-dependencies */
const { existsSync } = require('fs');
const { join } = require('path');

const projectPath = join(__dirname, '../tsconfig.build.json');
if (existsSync(projectPath)) {
    require('ts-node').register({
        files: true,
        transpileOnly: true,
        project: projectPath,
    });
    require('tsconfig-paths/register');
}

const { creator } = require('./creator');
const { buildCli } = require('./modules/core/helpers/app');

buildCli(creator);
