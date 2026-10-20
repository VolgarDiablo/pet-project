import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => Boolean, {
    name: 'health',
    description: 'Проверка, что GraphQL поднялся.',
  })
  health(): boolean {
    return true;
  }
}
