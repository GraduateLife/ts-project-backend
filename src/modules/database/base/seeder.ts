import { Ora } from 'ora';
import { DataSource, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';

import { Configure } from '@/modules/core/configure';
import { EnvironmentType } from '@/modules/core/constants';

import { factoryBuilder } from '../helpers';
import {
    DbFactory,
    DbFactoryOption,
    Seeder,
    SeederConstructor,
    SeederLoadParams,
    SeederOptions,
} from '../types';

/**
 * 数据填充基类
 */
export abstract class BaseSeeder implements Seeder {
    protected dataSource: DataSource;

    protected em: EntityManager;

    protected connection: string;

    protected configure: Configure;

    protected factories!: {
        [entityName: string]: DbFactoryOption<any, any>;
    };

    protected truncates: EntityTarget<ObjectLiteral>[] = [];

    constructor(protected readonly spinner: Ora, protected readonly args: SeederOptions) {}

    /**
     * 清空原数据并重新加载数据
     * @param params
     */
    async load(params: SeederLoadParams): Promise<any> {
        const { factorier, factories, dataSource, em, connection, configure } = params;
        this.connection = connection;
        this.dataSource = dataSource;
        this.em = em;
        this.factories = factories;
        this.configure = configure;
        if (this.configure.getRunEnv() !== EnvironmentType.PRODUCTION) {
            for (const truncate of this.truncates) {
                await this.em.clear(truncate);
            }
        }

        const result = await this.run(factorier, this.dataSource);
        return result;
    }

    /**
     * 运行seeder的关键方法
     * @param factorier
     * @param dataSource
     * @param em
     */
    protected abstract run(
        factorier?: DbFactory,
        dataSource?: DataSource,
        em?: EntityManager,
    ): Promise<any>;

    /**
     * 运行子seeder
     *
     * @param SubSeeder
     */
    protected async call(SubSeeder: SeederConstructor) {
        const subSeeder: Seeder = new SubSeeder(this.spinner, this.args);
        await subSeeder.load({
            connection: this.connection,
            factorier: factoryBuilder(this.dataSource, this.factories),
            factories: this.factories,
            dataSource: this.dataSource,
            em: this.em,
            configure: this.configure,
        });
    }
}
