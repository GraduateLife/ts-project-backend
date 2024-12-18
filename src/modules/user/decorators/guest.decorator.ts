import { SetMetadata } from '@nestjs/common';

import { ALLOW_GUEST } from '@/modules/restful/constants';

export const Guest = () => SetMetadata(ALLOW_GUEST, true);
