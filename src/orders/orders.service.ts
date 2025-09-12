import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderItem, PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, map } from 'rxjs';

import { ChangeStatusDto, CreateOrderDto, OrderPaginationDto } from './dto';
import { PRODUCTS_SERVICE } from 'src/config';


@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy
  ) {
    super();
  }
 
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected')
  }

  async create(createOrderDto: CreateOrderDto) {

    // extraer ids de productos
    const ids = createOrderDto.items.map(item => item.productId);

    try {
       //comprobar ids de productos
       const products  = await firstValueFrom(
          this.productsClient.send({cmd: 'validate_products'}, ids)
       );

       //calculos de los valores        
        const totalAmount = createOrderDto.items.reduce((total, item) => {
          const product =  products.find(product => product.id == item.productId);
          return  total + (product.price * item.quantity);
        }, 0);

        const totalItems = createOrderDto.items.reduce((total, item) => total + item.quantity, 0 );

        //crear transaccion de base de datos con prisma
        const order = await this.order.create({ data: {
          totalAmount,                        
          totalItems,
          OrderItem: {
            createMany:{ 
              data: products.map(product => ({
                productId: product.id,
                quantity:  createOrderDto.items.find(item => item.productId == product.id).quantity,
                price: product.price,
              }))
            }
            } //*insertando los items al mismo tiempo
          },
          include: {
            OrderItem: {
              select: {
                price: true,
                quantity: true,
                productId: true
              }
            } //incluyendo en el resultado los items de compra
          }
        })

        //*insertando varios elementos de manera indiviaual
        //await this.orderItem.createMany({ data: items})

        return {
          ...order,
          OrderItem: order.OrderItem.map(item => ({
            ...item,
            name: products.find(product => product.id == item.productId).name
          }))
        }

    } catch ( error) {
      throw new RpcException(error)
    }
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

    try {
    
      const order = await this.order.findFirst({
        where: { id },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,             
            }
          }
        }
      });

    if( !order )
        throw new RpcException({
          message: `order with id #${ id } not found`,
          status: HttpStatus.NOT_FOUND
        }); 

    const ids = order.OrderItem.map(item => item.productId);

    const products  = await firstValueFrom(
          this.productsClient.send({cmd: 'validate_products'}, ids)
        );

    return {
      ...order,
      OrderItem: order.OrderItem.map(item => ({
        ...item,
        name: products.find(product => product.id == item.productId).name
      }))
    }
          
      
    } catch (error) {
      throw new RpcException(error)
    }
    
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
