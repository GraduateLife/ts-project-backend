import { Controller } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { BaseControllerWithTrash } from '@/modules/restful/base';
import { Crud, Depends } from '@/modules/restful/decorators';

import { createHookOption } from '@/modules/restful/helpers';

import { CreateUserDto, QueryUserDto, UpdateUserDto } from '../dtos';
import { UserService } from '../services/user.service';
import { UserModule } from '../user.module';

/**
 * 用户管理控制器
 */
@ApiTags('用户管理')
@Depends(UserModule)
@Crud(() => ({
    id: 'user',
    enabled: [
        {
            name: 'list',
            option: createHookOption({ summary: '用户查询,以分页模式展示', guest: true }),
        },
        { name: 'detail', option: createHookOption({ summary: '用户详情', guest: true }) },
        { name: 'store', option: createHookOption('新增用户') },
        { name: 'update', option: createHookOption('修改用户信息') },
        { name: 'delete', option: createHookOption('删除用户') },
        { name: 'restore', option: createHookOption('恢复用户') },
    ],
    dtos: {
        list: QueryUserDto,
        store: CreateUserDto,
        update: UpdateUserDto,
    },
}))
@Controller('users')
export class UserController extends BaseControllerWithTrash<UserService> {
    constructor(protected userService: UserService) {
        super(userService);
    }
}
