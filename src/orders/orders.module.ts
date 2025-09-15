import { Module } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports:[  
    //*importando configuracion para ClientsModule
    NatsModule
  ]
})
export class OrdersModule {}
