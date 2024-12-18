import { isNil } from 'lodash';
import { EventSubscriber } from 'typeorm';

import { App } from '@/modules/core/app';
import { BaseSubscriber } from '@/modules/database/base';

import { PostBodyType } from '../constants';
import { PostEntity } from '../entities';
import { SanitizeService } from '../services';

/**
 * 文章模型观察者
 */
@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity> {
    protected entity = PostEntity;

    listenTo() {
        return PostEntity;
    }

    /**
     * 加载文章数据的处理
     * @param entity
     */
    async afterLoad(entity: PostEntity) {
        const sanitizeService = App.app.get(SanitizeService, { strict: false });
        if (entity.type === PostBodyType.HTML && !isNil(sanitizeService)) {
            entity.body = sanitizeService.sanitize(entity.body);
        }
    }
}
