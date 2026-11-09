import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { CartsService } from '../carts/carts.service';
import { extractBearerToken } from '../auth/utils/bearer-token.util';
import { verifyToken } from '../auth/utils/jwt.util';
import { PUB_SUB } from '../graphql/pubsub.provider';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartsService: CartsService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async findOrders(req: Request) {
    const userId = this.requireUserId(req);
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderById(req: Request, id: number) {
    const userId = this.requireUserId(req);
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== userId) {
      return null;
    }
    return order;
  }

  async createOrder(req: Request, res: Response, notes?: string) {
    const userId = this.getUserId(req);
    const cart = await this.cartsService.getOrCreateCart(req, res);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    if (items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of items) {
      if (!item.product.isActive) {
        throw new BadRequestException(
          `Product ${item.productId} is not available`,
        );
      }
    }

    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData = items.map((item) => {
      const unitPrice = item.product.discountPrice ?? item.product.price;
      const totalPrice = new Prisma.Decimal(unitPrice).mul(item.quantity);
      totalAmount = totalAmount.add(totalPrice);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          status: OrderStatus.PENDING,
          totalAmount,
          currency: 'UAH',
          notes,
          userId,
          item: { create: orderItemsData },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    await this.pubSub.publish('orderUpdated', { orderUpdated: order });
    return order;
  }

  async cancelOrder(req: Request, id: number) {
    const userId = this.requireUserId(req);
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Not allowed to cancel this order');
    }
    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        `Order cannot be cancelled from status ${order.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });

    await this.pubSub.publish('orderUpdated', { orderUpdated: updated });
    return updated;
  }

  findItemsByOrderId(orderId: number) {
    return this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { id: 'asc' },
    });
  }

  findProductById(productId: number) {
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  private requireUserId(req: Request): number {
    const userId = this.getUserId(req);
    if (userId === null) {
      throw new UnauthorizedException('Authentication required');
    }
    return userId;
  }

  private getUserId(req: Request): number | null {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return null;
    }
    return verifyToken(token).id;
  }
}
