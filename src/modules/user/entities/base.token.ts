import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn } from 'typeorm';

import { BaseEntity } from '@/modules/database/base';

/**
 * AccessToken与RefreshToken的公共字段
 */
@Exclude()
export abstract class BaseToken extends BaseEntity {
    /**
     * @description 令牌字符串
     * @type {string}
     */
    @Column({ length: 500 })
    value!: string;

    @Column({
        comment: '令牌过期时间',
    })
    expired_at!: Date;

    @CreateDateColumn({
        comment: '令牌创建时间',
    })
    createdAt!: Date;
}
