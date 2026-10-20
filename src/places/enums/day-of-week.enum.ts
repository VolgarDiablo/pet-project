import { registerEnumType } from '@nestjs/graphql';
import { DayOfWeek } from '@prisma/client';

registerEnumType(DayOfWeek, { name: 'DayOfWeek' });

export { DayOfWeek };
