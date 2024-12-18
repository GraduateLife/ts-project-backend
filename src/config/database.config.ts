import { toNumber } from 'lodash';

import { ContentFactory } from '@/database/factories/content.factory';
import ContentSeeder from '@/database/seeders/content.seeder';
import { createDbConfig } from '@/modules/database/helpers';

/**
 * 数据库配置函数
 */
export const database = createDbConfig((configure) => ({
    connections: [
        {
            type: 'mysql',
            host: configure.env('DB_HOST', '127.0.0.1'),
            port: configure.env('DB_PORT', (v) => toNumber(v), 3306),
            username: configure.env('DB_USER', 'root'),
            password: configure.env('DB_PASSWORD', 'root'),
            database: configure.env('DB_NAME', '3r-room'),
            seeders: [ContentSeeder],
            factories: [ContentFactory],
        },
    ],
}));
