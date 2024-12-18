import { ElasticsearchModule, ElasticsearchModuleOptions } from '@nestjs/elasticsearch';

import { ModuleBuilder } from '../core/decorators';

@ModuleBuilder(async (configure) => ({
    global: true,
    imports: [
        ElasticsearchModule.register(await configure.get<ElasticsearchModuleOptions>('elastic')),
    ],
    exports: [ElasticsearchModule],
}))
export class ElasticModule {}
