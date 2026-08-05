import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { UpdateProduct } from '../interfaces/product.interface';

export class UpdateProductDto
  extends PartialType(CreateProductDto)
  implements UpdateProduct {}
