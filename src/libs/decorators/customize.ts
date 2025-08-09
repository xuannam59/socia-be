import { SetMetadata } from '@nestjs/common';

export const ResponseMessageKey = 'ResponseMessageKey';
export const ResponseMessage = (message: string) => SetMetadata(ResponseMessageKey, message);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
