import { registerEnumType } from '@nestjs/graphql';
import { SocialNetwork } from '@prisma/client';

registerEnumType(SocialNetwork, { name: 'SocialNetwork' });

export { SocialNetwork };
