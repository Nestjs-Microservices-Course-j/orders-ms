import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { ChangeStatusDto, CreateOrderDto, OrderPaginationDto } from './dto';
import { PaginationDto } from 'src/common';
import { OrderStatus } from '../../generated/prisma/index';


@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected')
  }

  create(createOrderDto: CreateOrderDto) {
    return {
      service: 'OrdersMicroservice',
      createOrderDto
    }
   //return this.order.create({data: createOrderDto });
  }

  async findAll( paginationDto : OrderPaginationDto  ) {
    const { page, limit, status } = paginationDto;

      const total = await this.order.count({ where: { status: status} });

      return {
        data: await this.order.findMany({
                skip: (page - 1) * limit,
                take: limit,     
                where: {
                  status: status
                }       
              }),
        meta: {
          page,
          total,
          perPage: limit,
          totalPages: Math.ceil( total / limit ),
        }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id }
    });

    if( !order )
        throw new RpcException({
          message: `order with id #${ id } not found`,
          status: HttpStatus.NOT_FOUND
        }); 

    return order;
  }

  async changeOrderStatus( changeStatusDto : ChangeStatusDto ) {
    const { id, status } = changeStatusDto;

    const order = await this.findOne( id );

    if( order.status === status )
        return order;

    return this.order.update({
      where: { id },
      data: { status }
    });
  }

}
