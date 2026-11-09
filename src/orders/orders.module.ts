import { Module } from '@nestjs/common';
import { OrderResolver } from './order.resolver';
import { OrderItemResolver } from './order-item.resolver';
import { OrdersService } from './orders.service';
import { pubSubProvider } from '../graphql/pubsub.provider';
import { CartsModule } from '../carts/carts.module';
import './enums/order-status.enum';

@Module({
  imports: [CartsModule],
  providers: [OrdersService, OrderResolver, OrderItemResolver, pubSubProvider],
  exports: [OrdersService],
})
export class OrdersModule {}