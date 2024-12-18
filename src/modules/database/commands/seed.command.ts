import yargs from 'yargs';

import { CommandItem } from '@/modules/core/types';

import { SeederArguments } from '../types';

import { SeedHandler } from './seed.handler';
/**
 * 数据填充
 */
export const SeedCommand: CommandItem<any, SeederArguments> = ({ configure }) => ({
    command: ['db:seed', 'dbs'],
    describe: 'Runs all seeds data.',
    builder: {
        clear: {
            type: 'boolean',
            alias: 'r',
            describe: 'Clear which tables will truncated specified by seeder class.',
            default: true,
        },
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        transaction: {
            type: 'boolean',
            alias: 't',
            describe: ' If is seed data in transaction,default is true',
            default: true,
        },
    } as const,

    handler: async (args: yargs.Arguments<SeederArguments>) => SeedHandler(args, configure),
});
