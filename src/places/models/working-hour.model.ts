import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DayOfWeek } from '@prisma/client';

@ObjectType('WorkingHour')
export class WorkingHourModel {
  @Field(() => Int)
  id: number;

  @Field(() => DayOfWeek)
  dayOfWeek: DayOfWeek;

  @Field({ nullable: true })
  openTime?: string;

  @Field({ nullable: true })
  closeTime?: string;

  @Field(() => Boolean)
  isClosed: boolean;
}
