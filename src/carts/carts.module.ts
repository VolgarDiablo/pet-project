import { Module } from '@nestjs/common';
import { CartResolver } from './cart.resolver';
import { CartItemResolver } from './cart-item.resolver';
import { CartsService } from './carts.service';

@Module({
  providers: [CartsService, CartResolver, CartItemResolver],
  exports: [CartsService],
})
export class CartsModule {}
