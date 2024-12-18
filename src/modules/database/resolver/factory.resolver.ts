import { isPromise } from 'util/types';

import { faker } from '@faker-js/faker';
import { isNil } from 'lodash';
import { EntityManager, EntityTarget } from 'typeorm';

import { panic } from '@/modules/core/helpers';

import { DbFactoryHandler, FactoryOverride } from '../types';

/**
 * 运行Factory
 */
export class FactoryResolver<Entity, Settings> {
    private mapFunction!: (entity: Entity) => Promise<Entity>;

    /**
     * 构造函数
     * @param name
     * @param entity
     * @param em
     * @param factory
     * @param settings
     */
    constructor(
        public name: string,
        public entity: EntityTarget<Entity>,
        protected readonly em: EntityManager,
        private readonly factory: DbFactoryHandler<Entity, Settings>,
        private readonly settings: Settings,
    ) {}

    /**
     * Entity映射
     * 用于一个Entity类绑定其它实现函数,此时Entity只作为一个键名
     * @param mapFunction
     */
    map(mapFunction: (entity: Entity) => Promise<Entity>): FactoryResolver<Entity, Settings> {
        this.mapFunction = mapFunction;
        return this;
    }

    /**
     * 创建模拟数据,但不存储
     * @param overrideParams
     */
    async make(overrideParams: FactoryOverride<Entity> = {}): Promise<Entity> {
        if (this.factory) {
            let entity: Entity = await this.resolveEntity(await this.factory(faker, this.settings));
            if (this.mapFunction) entity = await this.mapFunction(entity);
            for (const key in overrideParams) {
                if (overrideParams[key]) {
                    entity[key] = overrideParams[key]!;
                }
            }
            return entity;
        }
        throw new Error('Could not found entity');
    }

    /**
     * 创建模拟数据并存储
     * @param overrideParams
     * @param existsCheck
     */
    async create(
        overrideParams: FactoryOverride<Entity> = {},
        existsCheck?: string,
    ): Promise<Entity> {
        try {
            const entity = await this.make(overrideParams);
            if (!isNil(existsCheck)) {
                const repo = this.em.getRepository(this.entity);
                const value = (entity as any)[existsCheck];
                if (!isNil(value)) {
                    const item = await repo.findOneBy({ [existsCheck]: value } as any);
                    if (isNil(item)) return await this.em.save(entity);
                    return item;
                }
            }
            return await this.em.save(entity);
        } catch (error) {
            const message = 'Could not save entity';
            panic({ message, error });
            throw new Error(message);
        }
    }

    /**
     * 创建多条模拟数据但不存储
     * @param amount
     * @param overrideParams
     */
    async makeMany(
        amount: number,
        overrideParams: FactoryOverride<Entity> = {},
    ): Promise<Entity[]> {
        const list = [];
        for (let index = 0; index < amount; index += 1) {
            list[index] = await this.make(overrideParams);
        }
        return list;
    }

    /**
     * 创建多条模拟数据并存储
     * @param amount
     * @param overrideParams
     */
    async createMany(
        amount: number,
        overrideParams: FactoryOverride<Entity> = {},
        existsCheck?: string,
    ): Promise<Entity[]> {
        const list = [];
        for (let index = 0; index < amount; index += 1) {
            list[index] = await this.create(overrideParams, existsCheck);
        }
        return list;
    }

    /**
     * 根据Entity解析出其定义的处理器
     * @param entity
     */
    private async resolveEntity(entity: Entity): Promise<Entity> {
        for (const attribute in entity) {
            if (entity[attribute]) {
                if (isPromise(entity[attribute])) {
                    entity[attribute] = await Promise.resolve(entity[attribute]);
                }

                if (typeof entity[attribute] === 'object' && !(entity[attribute] instanceof Date)) {
                    const subEntityFactory = entity[attribute];
                    try {
                        if (typeof (subEntityFactory as any).make === 'function') {
                            entity[attribute] = await (subEntityFactory as any).make();
                        }
                    } catch (error) {
                        const message = `Could not make ${(subEntityFactory as any).name}`;
                        panic({ message, error });
                        throw new Error(message);
                    }
                }
            }
        }
        return entity;
    }
}
