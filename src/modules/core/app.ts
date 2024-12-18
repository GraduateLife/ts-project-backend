/* eslint-disable func-names */
import { exit } from 'process';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { useContainer } from 'class-validator';

import { isNil } from 'lodash';

import { Restful } from '../restful/restful';
import { ApiConfig } from '../restful/types';

import { Configure } from './configure';
import { panic } from './helpers';
import { createBootModule } from './helpers/app';

import { ConfigStorageOption, CreateOptions, CreatorData } from './types';
/**
 * 应用核心类
 * 用于构建应用和配置实例
 */
export class App {
    /**
     * 配置对象
     */
    protected static _configure: Configure;

    /**
     * 应用实例
     */
    protected static _app: NestFastifyApplication;

    static get configure() {
        return this._configure;
    }

    static get app() {
        return this._app;
    }

    /**
     * 创建一个应用
     * @param options 应用创建选项
     */
    static async create(options: CreateOptions): Promise<CreatorData> {
        const { builder, configs, configure, commands = [] } = options;
        let modules = {};
        try {
            this._configure = await this.buildConfigure(configs, configure);
            const { BootModule, modules: maps } = await createBootModule(
                { configure: this._configure },
                options,
            );
            modules = maps;
            this._app = await builder({
                configure: this._configure,
                BootModule,
            });
            // 根据是否传入api配置来启用open api功能
            if (!isNil(await this._configure.get<ApiConfig>('api', null))) {
                const restful = this._app.get(Restful);
                restful.factoryDocs(this._app);
            }
            // 允许使用关闭监听的钩子
            this._app.enableShutdownHooks();
            // 为class-validator添加容器以便在自定义约束中可以注入dataSource等依赖
            useContainer(this._app.select(BootModule), {
                fallbackOnErrors: true,
            });
            // 初始化应用
            if (this._app.getHttpAdapter() instanceof FastifyAdapter) {
                await this._app.init();
            }
        } catch (error) {
            panic({ message: 'Create app failed!', error });
            exit(0);
        }

        return { configure: this._configure, app: this._app, modules, commands };
    }

    /**
     * 构建配置实例
     * @param configs 初始配置,一般会传入./configs目录中的所有配置
     * @param option 动态配置存储选项,可以通过yaml来动态存储配置
     */
    static async buildConfigure(configs: Record<string, any>, option?: ConfigStorageOption) {
        const configure = new Configure();
        configure.init(option);
        for (const key in configs) {
            configure.add(key, configs[key]);
        }
        await configure.sync();
        let appUrl = await configure.get('app.url', undefined);
        if (isNil(appUrl)) {
            const host = await configure.get<string>('app.host');
            const port = await configure.get<number>('app.port')!;
            const https = await configure.get<boolean>('app.https');
            appUrl =
                (await configure.get<boolean>('app.url', undefined)) ??
                `${https ? 'https' : 'http'}://${host!}:${port}`;

            configure.set('app.url', appUrl);
        }
        const routePrefix = await configure.get('api.prefix.route', undefined);
        const apiUrl = routePrefix
            ? `${appUrl}${routePrefix.length > 0 ? `/${routePrefix}` : routePrefix}`
            : appUrl;
        configure.set('app.api', apiUrl);
        return configure;
    }
}
