import { Injectable } from '@nestjs/common';
import { AccountingRepository } from './accounting.repository';

@Injectable()
export class AccountingService {
  constructor(private readonly accountingRepository: AccountingRepository) {}
}
