import { Global, Module, ModuleMetadata, Type } from '@nestjs/common';

import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import chalk from 'chalk';
import { isNil, omit } from 'lodash';

import yargs, { CommandModule } from 'yargs';

import { DatabaseModule } from '@/modules/database/database.module';

import { ElasticModule } from '@/modules/elastic/elastic.module';

import { RestfulModule } from '@/modules/restful/restful.module';

import { App } from '../app';
import { Configure } from '../configure';
import { MODULE_BUILDER_REGISTER } from '../constants';
import { CoreModule } from '../core.module';

import { AppFilter, AppIntercepter, AppPipe } from '../providers';
import {
    AppConfig,
    AppParams,
    CommandItem,
    CreateOptions,
    Creator,
    CreatorData,
    ModuleBuilderMeta,
    ModuleBuildMap,
    ModuleItem,
    ModuleOption,
} from '../types';

import { CreateModule, isAsyncFn, mergeMeta } from './utils';

/**
 * 创建应用的快捷函数
 * @param options
 */
export function createApp(options: CreateOptions): Creator {
    return async () => App.create(options);
}

/**
 * 构建APP CLI,默认start命令应用启动监听app
 * @param creator APP构建器
 * @param listened 监听回调
 */
export async function bootApp(
    creator: () => Promise<CreatorData>,
    listened?: (params: CreatorData) => () => Promise<void>,
) {
    const { app, configure } = await creator();
    const { port, host } = await configure.get<AppConfig>('app');
    await app.listen(port, host, listened({ app, configure } as any));
}

/**
 * 构建一个启动模块
 * @param params
 * @param options
 */
export async function createBootModule(
    params: AppParams,
    options: Pick<Partial<CreateOptions>, 'meta' | 'modules' | 'globals'>,
): Promise<{ BootModule: Type<any>; modules: ModuleBuildMap }> {
    const { meta: bootMeta, modules, globals = {} } = options;
    const { configure } = params;
    const importModules = [...modules, CoreModule];
    if (configure.has('database')) importModules.push(DatabaseModule);
    if (configure.has('elastic')) importModules.push(ElasticModule);
    if (configure.has('api')) importModules.push(RestfulModule);
    const moduleMaps = await createImportModules(configure, importModules);
    const imports: ModuleMetadata['imports'] = Object.values(moduleMaps).map((m) => m.module);
    const providers: ModuleMetadata['providers'] = [];
    if (globals.pipe !== null) {
        const pipe = globals.pipe
            ? globals.pipe(params)
            : new AppPipe({
                  transform: true,
                  forbidUnknownValues: false,
                  validationError: { target: false },
              });
        providers.push({
            provide: APP_PIPE,
            useValue: pipe,
        });
    }
    if (globals.interceptor !== null) {
        providers.push({
            provide: APP_INTERCEPTOR,
            useClass: globals.interceptor ?? AppIntercepter,
        });
    }
    if (globals.filter !== null) {
        providers.push({
            provide: APP_FILTER,
            useClass: AppFilter,
        });
    }
    if (!isNil(globals.guard)) {
        providers.push({
            provide: APP_GUARD,
            useClass: globals.guard,
        });
    }
    return {
        BootModule: CreateModule('BootModule', () => {
            let meta: ModuleMetadata = {
                imports,
                providers,
            };
            if (bootMeta) {
                meta = mergeMeta(meta, bootMeta(params));
            }
            return meta;
        }),
        modules: moduleMaps,
    };
}

/**
 * 根据模块类生成导入到启动模块的模块列表
 * @param configure 配置实例
 * @param modules 模块类列表
 */
async function createImportModules(
    configure: Configure,
    modules: ModuleItem[],
): Promise<ModuleBuildMap> {
    const maps: ModuleBuildMap = {};
    for (const m of modules) {
        const option: ModuleOption = 'module' in m ? m : { module: m };
        const metadata: ModuleBuilderMeta = await getModuleMeta(configure, option);
        Module(omit(metadata, ['global', 'commands']))(option.module);
        if (metadata.global) Global()(option.module);
        maps[option.module.name] = { module: option.module, meta: metadata };
    }
    return maps;
}

/**
 * 根据模块构建装饰器生成medadata
 * @param configure
 * @param option
 */
async function getModuleMeta(configure: Configure, option: ModuleOption) {
    let metadata: ModuleBuilderMeta = {};
    const register = Reflect.getMetadata(MODULE_BUILDER_REGISTER, option.module);
    const params = option.params ?? {};
    if (!isNil(register)) {
        metadata = isAsyncFn(register)
            ? await register(configure, params)
            : register(configure, params);
    }
    return metadata;
}

/**
 * 创建所有自定义及模块的命令
 * @param params
 */
export async function createCommands(params: CreatorData): Promise<CommandModule<any, any>[]> {
    const { app, modules } = params;
    const moduleCommands: Array<CommandItem<any, any>> = Object.values(modules)
        .map((m) => m.meta.commands ?? [])
        .reduce((o, n) => [...o, ...n], []);
    const commands = [...params.commands, ...moduleCommands].map((item) => {
        const command = item(params);
        return {
            ...command,
            handler: async (args: yargs.Arguments<any>) => {
                const handler = command.handler as (
                    ...argvs: yargs.Arguments<any>
                ) => Promise<void>;
                await handler({ ...params, ...args });
                await app.close();
                process.exit();
            },
        };
    });
    return commands;
}

export async function buildCli(builder: () => Promise<CreatorData>) {
    const params = await builder();
    const commands = await createCommands(params);
    console.log();
    commands.forEach((command) => yargs.command(command));
    yargs
        .usage('Usage: $0 <command> [options]')
        .scriptName('cli')
        .demandCommand(1, '')
        .fail((msg, err, y) => {
            if (!msg && !err) {
                yargs.showHelp();
                process.exit();
            }
            if (msg) console.error(chalk.red(msg));
            if (err) console.error(chalk.red(err.message));
            process.exit();
        })
        .strict()
        .alias('v', 'version')
        .help('h')
        .alias('h', 'help').argv;
}
