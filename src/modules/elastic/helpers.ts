import { ElasticsearchModuleOptions } from '@nestjs/elasticsearch';

import { ConfigureFactory, ConfigureRegister } from '../core/types';

type E = ElasticsearchModuleOptions;
export const createElasticConfig: (
    register: ConfigureRegister<Partial<E>>,
) => ConfigureFactory<Partial<E>, E> = (register) => ({
    register,
    defaultRegister: (configure) => ({
        node: configure.env('ELASTIC_HOST', 'http://localhost:9200'),
        maxRetries: 10,
        requestTimeout: 60000,
        pingTimeout: 60000,
        sniffOnStart: true,
    }),
});
