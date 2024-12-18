import { Type } from '@nestjs/common';
import { ExternalDocumentationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ClassTransformOptions } from 'class-transformer';

import { Configure } from '../core/configure';

/**
 * CRUD控制器方法列表
 */
export type CrudMethod = 'detail' | 'delete' | 'restore' | 'list' | 'store' | 'update';

/**
 * CRUD装饰器的方法选项
 */
export interface CrudMethodOption {
    /**
     * 该方法是否允许匿名访问
     */
    allowGuest?: boolean;
    /**
    /**
     * 序列化选项,如果为`noGroup`则不传参数，否则根据`id`+方法匹配来传参
     */
    serialize?: ClassTransformOptions | 'noGroup';
    hook?: (target: Type<any>, method: string) => void;
}
/**
 * 每个启用方法的配置
 */
export interface CrudItem {
    name: CrudMethod;
    option?: CrudMethodOption;
}

/**
 * CRUD装饰器选项
 */
export interface CrudOptions {
    id: string;
    // 需要启用的方法
    enabled: Array<CrudMethod | CrudItem>;
    // 一些方法要使用到的自定义DTO
    dtos: {
        [key in 'list' | 'store' | 'update']?: Type<any>;
    };
}

export type CrudOptionsRegister = (configure: Configure) => CrudOptions | Promise<CrudOptions>;

/**
 * API配置
 */
export interface ApiConfig extends ApiDocSource {
    prefix?: {
        route?: string;
        doc?: string;
    };
    default: string;
    enabled: string[];
    versions: Record<string, ApiVersionOption>;
}

/**
 * 版本配置
 */
export interface ApiVersionOption extends ApiDocSource {
    routes?: ApiRouteOption[];
}

/**
 * 路由配置
 */
export interface ApiRouteOption {
    name: string;
    path: string;
    controllers: Type<any>[];
    children?: ApiRouteOption[];
    doc?: ApiDocSource;
}

interface ApiTagOption {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
}

/**
 * swagger选项
 */
export interface ApiSwaggerOption extends ApiDocSource {
    version: string;
    path: string;
    include: Type<any>[];
}

/**
 * API与swagger整合的选项
 */
export interface ApiDocOption {
    default?: ApiSwaggerOption;
    routes?: { [key: string]: ApiSwaggerOption };
}

/**
 * 总配置,版本,路由中用于swagger的选项
 */
export interface ApiDocSource {
    title?: string;
    description?: string;
    auth?: boolean;
    tags?: (string | ApiTagOption)[];
}
