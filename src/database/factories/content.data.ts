export interface PostData {
    title: string;
    contentFile: string;
    summary?: string;
    categories?: string[];
    author?: string;
}

export interface CategoryData {
    name: string;
    children?: CategoryData[];
}

export interface ContentConfig {
    fixture?: {
        categories: CategoryData[];
        posts: PostData[];
    };
}

export const posts: PostData[] = [
    {
        title: '基于角色和属性的Node.js访问控制',
        contentFile: 'rbac.md',
        categories: ['node'],
    },
    {
        title: 'docker简介',
        contentFile: 'docker-introduce.md',
        categories: ['devops'],
    },
    {
        title: 'go协程入门',
        contentFile: 'goroutings.md',
        categories: ['go'],
        author: 'lige',
    },
    {
        title: '基于lerna.js构建monorepo',
        contentFile: 'lerna.md',
        categories: ['typescript'],
        author: 'xiaoming',
    },
    {
        title: '通过PHP理解IOC编程',
        contentFile: 'php-di.md',
        categories: ['php'],
        author: 'xiaoming',
    },
    {
        title: '玩转React Hooks',
        contentFile: 'react-hooks.md',
        categories: ['react'],
        author: 'lige',
    },
    {
        title: 'TypeORM fixtures cli中文说明',
        contentFile: 'typeorm-fixtures-cli.md',
        categories: ['typescript'],
        author: 'lige',
    },
    {
        title: '使用yargs构建node命令行(翻译)',
        contentFile: 'yargs.md',
        categories: ['node'],
    },
    {
        title: 'Typescript装饰器详解',
        summary:
            '装饰器用于给类,方法,属性以及方法参数等增加一些附属功能而不影响其原有特性。其在Typescript应用中的主要作用类似于Java中的注解,在AOP(面向切面编程)使用场景下非常有用',
        contentFile: 'typescript-decorator.md',
        categories: ['typescript'],
    },
];

export const categories: CategoryData[] = [
    {
        name: '技术文档',
        children: [
            {
                name: 'typescript',
                children: [{ name: 'node' }, { name: 'nestjs' }, { name: 'react' }],
            },
            {
                name: 'go',
                children: [{ name: 'gin' }, { name: 'echo' }],
            },
            {
                name: 'php',
                children: [{ name: 'laravel' }],
            },
            {
                name: 'java',
            },
            {
                name: 'python',
            },
            {
                name: 'devops',
            },
        ],
    },
    {
        name: '随笔记忆',
        children: [
            {
                name: '工作历程',
            },
            {
                name: '网站收藏',
            },
        ],
    },
];
