import { Injectable } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

import { IsMatch, IsMatchPhone, IsPassword } from '@/modules/core/constraints';
import { IsUnique, IsUniqueExist } from '@/modules/database/constraints';

import { UserValidateGroups } from '../constants';
import { UserEntity } from '../entities/user.entity';

/**
 * 用户模块DTO的通用基础字段
 */
@Injectable()
export class UserCommonDto {
    @ApiProperty({
        description: '登录凭证:可以是用户名,手机号,邮箱地址',
        minLength: 4,
        maxLength: 20,
    })
    @Length(4, 30, {
        message: '登录凭证长度必须为$constraint1到$constraint2',
        always: true,
    })
    @IsNotEmpty({ message: '登录凭证不得为空', always: true })
    readonly credential!: string;

    @ApiProperty({
        description: '用户名',
        minLength: 4,
        maxLength: 30,
        uniqueItems: true,
    })
    @IsUnique(
        { entity: UserEntity },
        {
            groups: [UserValidateGroups.CREATE],
            message: '该用户名已被注册',
        },
    )
    @IsUniqueExist(
        { entity: UserEntity, ignore: 'id' },
        {
            groups: [UserValidateGroups.UPDATE],
            message: '该用户名已被注册',
        },
    )
    @Length(4, 30, {
        always: true,
        message: '用户名长度必须为$constraint1到$constraint2',
    })
    @IsOptional({ groups: [UserValidateGroups.UPDATE] })
    username!: string;

    @ApiPropertyOptional({
        description: '昵称:不设置则为用户名',
    })
    @Length(3, 20, {
        always: true,
        message: '昵称必须为$constraint1到$constraint2',
    })
    @IsOptional({ always: true })
    nickname?: string;

    @ApiProperty({
        description: '手机号:必须是区域开头的,比如+86.15005255555',
        uniqueItems: true,
    })
    @IsUnique(
        { entity: UserEntity },
        {
            message: '手机号已被注册',
            groups: [UserValidateGroups.CREATE],
        },
    )
    @IsMatchPhone(
        undefined,
        { strictMode: true },
        {
            message: '手机格式错误,示例: +86.15005255555',
            always: true,
        },
    )
    @IsOptional({ groups: [UserValidateGroups.CREATE, UserValidateGroups.UPDATE] })
    phone: string;

    @ApiProperty({
        description: '邮箱地址:必须符合邮箱地址规则',
        uniqueItems: true,
    })
    @IsUnique(
        { entity: UserEntity },
        {
            message: '邮箱已被注册',
            groups: [UserValidateGroups.CREATE],
        },
    )
    @IsEmail(undefined, {
        message: '邮箱地址格式错误',
        always: true,
    })
    @IsOptional({ groups: [UserValidateGroups.CREATE, UserValidateGroups.UPDATE] })
    email: string;

    @ApiProperty({
        description: '用户密码:密码必须由小写字母,大写字母,数字以及特殊字符组成',
        minLength: 8,
        maxLength: 50,
    })
    @IsPassword(5, {
        message: '密码必须由小写字母,大写字母,数字以及特殊字符组成',
        always: true,
    })
    @Length(8, 50, {
        message: '密码长度不得少于$constraint1',
        always: true,
    })
    @IsOptional({ groups: [UserValidateGroups.UPDATE] })
    readonly password!: string;

    @ApiProperty({
        description: '确认密码:必须与用户密码输入相同的字符串',
        minLength: 8,
        maxLength: 50,
    })
    @IsMatch('password', { message: '两次输入密码不同', always: true })
    @IsNotEmpty({ message: '请再次输入密码以确认', always: true })
    readonly plainPassword!: string;
}
