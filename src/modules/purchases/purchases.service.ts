import { Injectable } from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository';

@Injectable()
export class PurchasesService {
  constructor(private readonly purchasesRepository: PurchasesRepository) {}
}
