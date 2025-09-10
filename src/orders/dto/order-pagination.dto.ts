import { IsEnum, IsOptional } from "class-validator";
import { OrderStatus } from "@prisma/client";

import { PaginationDto } from "src/common";
import { OrderStatusList } from "../enum/order.enum";


export class OrderPaginationDto extends PaginationDto {
    @IsOptional()
    @IsEnum(OrderStatusList, {
        message:  `Possible status values are ${ OrderStatusList }`
    })
    status: OrderStatus;
}