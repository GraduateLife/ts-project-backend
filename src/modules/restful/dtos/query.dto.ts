import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorators';
import { SelectTrashMode } from '@/modules/database/constants';
import { PaginateOptions, TrashedOptions } from '@/modules/database/types';

@DtoValidation({ type: 'query' })
export class ListQueryDto implements PaginateOptions {
    @ApiPropertyOptional({
        description: '当前页',
        type: Number,
        minimum: 1,
        default: 1,
    })
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @ApiPropertyOptional({
        description: '每页最大显示数',
        type: Number,
        minimum: 1,
        default: 10,
    })
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示数据必须大于1' })
    @IsNumber()
    @IsOptional()
    limit = 10;
}

@DtoValidation({ type: 'query' })
export class ListWithTrashedQueryDto extends ListQueryDto implements TrashedOptions {
    @ApiPropertyOptional({
        description:
            '回收站数据过滤,all:包含已软删除和未软删除的数据;only:只包含软删除的数据;none:只包含未软删除的数据',
        enum: SelectTrashMode,
    })
    @IsEnum(SelectTrashMode)
    @IsOptional()
    trashed?: SelectTrashMode;
}
