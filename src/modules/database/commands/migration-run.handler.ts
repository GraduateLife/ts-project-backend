import { join, resolve } from 'path';

import chalk from 'chalk';
import { isNil } from 'lodash';
import ora from 'ora';
import { DataSource, DataSourceOptions } from 'typeorm';
import yargs from 'yargs';

import { Configure } from '@/modules/core/configure';
import { EnvironmentType } from '@/modules/core/constants';
import { panic } from '@/modules/core/helpers';

import { getDbConfig, runSeeder } from '../helpers';
import { SeedResolver } from '../resolver';
import { DbConfig, MigrationRunArguments } from '../types';

import { TypeormMigrationRun } from './tyeporm-migration-run';

/**
 * 运行迁移处理器
 * @param configure
 * @param args
 */
export const MigrationRunHandler = async (
    configure: Configure,
    args: yargs.Arguments<MigrationRunArguments>,
) => {
    const isProd = configure.getRunEnv() === EnvironmentType.PRODUCTION;
    const spinner = ora('Start to run migrations');
    const cname = args.connection ?? 'default';
    let dataSource: DataSource | undefined;
    try {
        spinner.start();
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        let dropSchema = false;
        if (isProd && (args.refresh || args.onlydrop)) {
            panic('Migration refresh database schema can not run in production environment!');
        }
        dropSchema = args.refresh || args.onlydrop;
        console.log();
        const dir = dbConfig.paths.migration ?? resolve(__dirname, '../../../database/migrations');
        const runner = new TypeormMigrationRun();
        dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        if (dataSource && dataSource.isInitialized) await dataSource.destroy();
        const options = {
            subscribers: [],
            synchronize: false,
            migrationsRun: false,
            dropSchema,
            logging: ['error'],
            migrations: [join(dir, isProd ? '**/*.js' : '**/*.ts')],
        } as any;
        if (dropSchema) {
            dataSource.setOptions(options);
            await dataSource.initialize();
            await dataSource.destroy();
            spinner.succeed(chalk.greenBright.underline('\n 👍 Finished drop database schema'));
            if (args.onlydrop) process.exit();
        }
        dataSource.setOptions({ ...options, dropSchema: false });
        await dataSource.initialize();
        console.log();
        await runner.handler({
            dataSource,
            transaction: args.transaction,
            fake: args.fake,
        });
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished run migrations'));
    } catch (error) {
        if (dataSource && dataSource.isInitialized) await dataSource.destroy();
        panic({ spinner, message: 'Run migrations failed!', error });
    }
    if (args.seed) {
        try {
            spinner.start('Start run seeder');
            const runner = (await getDbConfig(args.connection)).seedRunner ?? SeedResolver;
            await runSeeder(
                runner,
                { connection: args.connection, transaction: true },
                spinner,
                configure,
            );
            spinner.succeed(`\n 👍 ${chalk.greenBright.underline(`Finished Seeding`)}`);
        } catch (error) {
            if (dataSource && dataSource.isInitialized) await dataSource.destroy();
            panic({ spinner, message: `Run seeder failed`, error });
        }
    }

    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
};
