import { resolve } from 'path';

import chalk from 'chalk';
import { isNil } from 'lodash';
import ora from 'ora';
import yargs from 'yargs';

import { Configure } from '@/modules/core/configure';
import { EnvironmentType } from '@/modules/core/constants';
import { panic } from '@/modules/core/helpers';

import { DbConfig, MigrationCreateArguments } from '../types';

import { TypeormMigrationCreate } from './typeorm-migration-create';

/**
 * 创建迁移处理器
 * @param configure
 * @param args
 */
export const MigrationCreateHandler = async (
    configure: Configure,
    args: yargs.Arguments<MigrationCreateArguments>,
) => {
    if (configure.getRunEnv() === EnvironmentType.PRODUCTION) {
        panic('Migration create command can not run in production environment!');
    }
    const spinner = ora('Start to create migration').start();
    const cname = args.connection ?? 'default';
    try {
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        const runner = new TypeormMigrationCreate();
        console.log();
        const dir = dbConfig.paths.migration ?? resolve(__dirname, '../../../database/migrations');
        runner.handler({
            name: cname,
            dir,
            // outputJs: args.outputJs,
        });
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished create migration'));
    } catch (error) {
        panic({ spinner, message: 'Create migration failed!', error });
    }
};
