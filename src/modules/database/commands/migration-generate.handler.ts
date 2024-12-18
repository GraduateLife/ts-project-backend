import { resolve } from 'path';

import chalk from 'chalk';
import { isNil, pick } from 'lodash';
import ora from 'ora';
import { DataSource, DataSourceOptions } from 'typeorm';
import yargs from 'yargs';

import { Configure } from '@/modules/core/configure';
import { EnvironmentType } from '@/modules/core/constants';
import { getRandomCharString, panic } from '@/modules/core/helpers';

import { DbConfig, MigrationGenerateArguments } from '../types';

import { MigrationRunHandler } from './migration-run.handler';
import { TypeormMigrationGenerate } from './typeorm-migration-generate';

/**
 * 生成迁移处理器
 * @param configure
 * @param args
 */
export const MigrationGenerateHandler = async (
    configure: Configure,
    args: yargs.Arguments<MigrationGenerateArguments>,
) => {
    if (configure.getRunEnv() === EnvironmentType.PRODUCTION) {
        panic('Migration generate command can not run in production environment!');
    }
    await MigrationRunHandler(configure, { connection: args.connection } as any);
    console.log();
    const spinner = ora('Start to generate migration');
    const cname = args.connection ?? 'default';
    try {
        spinner.start();
        console.log();
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        console.log();
        const dir = dbConfig.paths.migration ?? resolve(__dirname, '../../../database/migrations');
        const runner = new TypeormMigrationGenerate();
        // console.log(((dbConfig.entities ?? []) as ClassType<any>[]).map((e) => e.name));
        // process.exit();
        const dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        console.log();
        await runner.handler({
            name: args.name ?? getRandomCharString(6),
            dir,
            dataSource,
            ...pick(args, ['pretty', 'outputJs', 'dryrun', 'check']),
        });
        if (dataSource.isInitialized) await dataSource.destroy();
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished generate migration'));
        if (args.run) {
            console.log();
            await MigrationRunHandler(configure, { connection: args.connection } as any);
        }
    } catch (error) {
        panic({ spinner, message: 'Generate migration failed!', error });
    }
};
