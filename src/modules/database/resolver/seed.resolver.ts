import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { Type } from '@nestjs/common';
import { ensureFileSync, readFileSync } from 'fs-extra';

import { get, isNil, set } from 'lodash';
import { DataSource } from 'typeorm';

import YAML from 'yaml';

import { EnvironmentType } from '@/modules/core/constants';

import { BaseSeeder } from '../base';
import { getDbConfig } from '../helpers';
import { DbFactory } from '../types';

/**
 * 默认的Seed Runner
 */
export class SeedResolver extends BaseSeeder {
    /**
     * 运行一个连接的填充类
     * @param _factory
     * @param _dataSource
     */
    public async run(_factory: DbFactory, _dataSource: DataSource): Promise<any> {
        let seeders: Type<any>[] = ((await getDbConfig(this.connection)) as any).seeders ?? [];
        if (this.configure.getRunEnv() === EnvironmentType.PRODUCTION) {
            const seedLockFile = resolve(__dirname, '../../../..', 'seed-lock.yml');
            ensureFileSync(seedLockFile);
            const yml = YAML.parse(readFileSync(seedLockFile, 'utf8'));
            const locked = isNil(yml) ? {} : yml;
            const lockNames = get<string[]>(locked, this.connection, []).reduce<string[]>(
                (o, n) => (o.includes(n) ? o : [...o, n]),
                [],
            );
            seeders = seeders.filter((s) => !lockNames.includes(s.name));
            for (const seeder of seeders) {
                await this.call(seeder);
            }
            set(locked, this.connection, [
                ...lockNames.filter((n) => !isNil(n)),
                ...seeders.map((s) => s.name).filter((n) => !isNil(n)),
            ]);
            writeFileSync(seedLockFile, JSON.stringify(locked, null, 4));
        } else {
            for (const seeder of seeders) {
                await this.call(seeder);
            }
        }
    }
}
