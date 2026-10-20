import { Injectable } from '@nestjs/common';

@Injectable()
export class MenusService {
  findCategoryByMenuId(_menuId: number) {
    throw new Error('MenusService.findCategoryByMenuId not implemented');
  }
}
