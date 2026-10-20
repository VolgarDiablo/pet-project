import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class OrdersService {
  findOrders(_req: Request) {
    throw new Error('OrdersService.findOrders not implemented');
  }

  findOrderById(_req: Request, _id: number) {
    throw new Error('OrdersService.findOrderById not implemented');
  }

  createOrder(_req: Request, _notes?: string) {
    throw new Error('OrdersService.createOrder not implemented');
  }

  cancelOrder(_req: Request, _id: number) {
    throw new Error('OrdersService.cancelOrder not implemented');
  }

  findItemsByOrderId(_orderId: number) {
    throw new Error('OrdersService.findItemsByOrderId not implemented');
  }

  findProductById(_productId: number) {
    throw new Error('OrdersService.findProductById not implemented');
  }
}
