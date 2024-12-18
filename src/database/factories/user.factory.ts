import { Faker } from '@faker-js/faker';

import { defineFactory } from '@/modules/database/helpers';
import { UserEntity } from '@/modules/user/entities';

export type IUserFactoryOptions = Partial<{
    [key in keyof UserEntity]: UserEntity[key];
}>;
export const UserFactory = defineFactory(
    UserEntity,
    async (faker: Faker, settings: IUserFactoryOptions = {}) => {
        faker.setLocale('zh_CN');
        const user = new UserEntity();
        const optionals: (keyof IUserFactoryOptions)[] = ['username', 'password', 'email', 'phone'];
        optionals.forEach((key) => {
            if (settings[key] !== undefined) {
                user[key] = settings[key] as never;
            }
        });
        user.nickname = settings.nickname ?? faker.name.fullName();
        return user;
    },
);
