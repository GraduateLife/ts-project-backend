import { DynamicModule, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { getDataSourceToken, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, ObjectType } from 'typeorm';

import { UniqueTreeConstraint, UniqueTreeExistConstraint } from '@/modules/database/constraints';

import { ModuleBuilder } from '../core/decorators';

import { panic } from '../core/helpers';

import * as commands from './commands';

import { CUSTOM_REPOSITORY_METADATA } from './constants';
import { DataExistConstraint, UniqueExistContraint } from './constraints';
import { UniqueConstraint } from './constraints/unique.constraint';
import { DbConfig } from './types';

@ModuleBuilder(async (configure) => {
    const imports: ModuleMetadata['imports'] = [];

    if (!configure.has('database')) {
        panic({ message: 'Database config not exists or not right!' });
    }
    const { connections } = await configure.get<DbConfig>('database');
    for (const dbOption of connections) {
        imports.push(TypeOrmModule.forRoot(dbOption as TypeOrmModuleOptions));
    }
    const providers: ModuleMetadata['providers'] = [
        DataExistConstraint,
        UniqueConstraint,
        UniqueExistContraint,
        UniqueTreeConstraint,
        UniqueTreeExistConstraint,
    ];
    return {
        global: true,
        commands: Object.values(commands),
        imports,
        providers,
    };
})
export class DatabaseModule {
    /**
     * 注册自定义Repository
     * @param repositories 需要注册的自定义类列表
     * @param dataSourceName 数据池名称,默认为默认连接
     */
    static forRepository<T extends Type<any>>(
        repositories: T[],
        dataSourceName?: string,
    ): DynamicModule {
        const providers: Provider[] = [];

        for (const Repo of repositories) {
            const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);

            if (!entity) {
                continue;
            }

            providers.push({
                inject: [getDataSourceToken(dataSourceName)],
                provide: Repo,
                useFactory: (dataSource: DataSource): InstanceType<typeof Repo> => {
                    const base = dataSource.getRepository<ObjectType<any>>(entity);
                    return new Repo(base.target, base.manager, base.queryRunner);
                },
            });
        }

        return {
            exports: providers,
            module: DatabaseModule,
            providers,
        };
    }
}
