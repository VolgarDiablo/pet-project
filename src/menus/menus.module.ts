import { Module } from '@nestjs/common';
import { MenuResolver } from './menu.resolver';
import { MenusService } from './menus.service';

@Module({
  providers: [MenusService, MenuResolver],
  exports: [MenusService],
})
export class MenusModule {}
