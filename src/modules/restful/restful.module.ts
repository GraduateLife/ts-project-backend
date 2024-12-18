import { ModuleBuilder } from '../core/decorators';

import { Restful } from './restful';

@ModuleBuilder(async (configure) => {
    const restful = new Restful(configure);
    await restful.create(await configure.get('api'));
    return {
        global: true,
        imports: restful.getModuleImports(),
        providers: [
            {
                provide: Restful,
                useValue: restful,
            },
        ],
        exports: [Restful],
    };
})
export class RestfulModule {}
