import { Configure } from './configure';

import { ModuleBuilder } from './decorators';

/**
 * 全局核心模块
 */
@ModuleBuilder(async (configure) => ({
    global: true,
    providers: [
        {
            provide: Configure,
            useValue: configure,
        },
    ],
    exports: [Configure],
}))
export class CoreModule {}
