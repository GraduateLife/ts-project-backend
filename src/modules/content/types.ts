import { PostEntity } from './entities';

export type PostSearchBody = Pick<ClassToPlain<PostEntity>, 'title' | 'body' | 'summary'> & {
    categories: string;
};

export type SearchType = 'like' | 'against' | 'elastic';

export interface ContentConfig {
    searchType: SearchType;
}
