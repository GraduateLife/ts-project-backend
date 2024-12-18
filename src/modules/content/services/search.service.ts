import { WriteResponseBase } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { instanceToPlain } from 'class-transformer';
import { pick } from 'lodash';

import { PostEntity } from '../entities';
import { PostSearchBody } from '../types';
/**
 * 文章全文搜索服务
 */
@Injectable()
export class SearchService {
    index = 'posts';

    constructor(protected esService: ElasticsearchService) {}

    /**
     * 根据传入的字符串搜索文章
     * @param text
     */
    async search(text: string) {
        const { hits } = await this.esService.search<PostEntity>({
            index: this.index,
            query: {
                multi_match: { query: text, fields: ['title', 'body', 'summary', 'categories'] },
            },
        });
        return hits.hits.map((item) => item._source);
    }

    /**
     * 当创建一篇文章时创建它的es索引
     * @param post
     */
    async create(post: PostEntity): Promise<WriteResponseBase> {
        return this.esService.index<PostSearchBody>({
            index: this.index,
            document: {
                ...pick(instanceToPlain(post), ['id', 'title', 'body', 'summary']),
                categories: (post.categories ?? []).join(','),
            },
        });
    }

    /**
     * 更新文章时更新它的es字段
     * @param post
     */
    async update(post: PostEntity) {
        const newBody: PostSearchBody = {
            ...pick(instanceToPlain(post), ['title', 'body', 'summary']),
            categories: (post.categories ?? []).join(','),
        };
        const script = Object.entries(newBody).reduce(
            (result, [key, value]) => `${result} ctx._source.${key}=>'${value}';`,
            '',
        );
        return this.esService.updateByQuery({
            index: this.index,
            query: { match: { id: post.id } },
            script,
        });
    }

    /**
     * 删除文章的同时在es中删除这篇文章
     * @param postId
     */
    async remove(postId: string) {
        return this.esService.deleteByQuery({
            index: this.index,
            query: { match: { id: postId } },
        });
    }
}
