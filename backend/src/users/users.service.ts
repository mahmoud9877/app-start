import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { TenantDb } from '../tenancy/tenant-db';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Soft-deleted users are invisible everywhere except the unique email index.
const notDeleted = { deletedAt: null };

@Injectable()
export class UsersService {
  constructor(private readonly db: TenantDb) {}

  async findAll({ page, limit }: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.db.client.user.findMany({
        where: notDeleted,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.client.user.count({ where: notDeleted }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.db.client.user.findFirst({
      where: { id, ...notDeleted },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // The only query that returns the password hash.
  findForLogin(email: string) {
    return this.db.client.user.findFirst({
      where: { email, isActive: true, ...notDeleted },
      omit: { password: false },
    });
  }

  async create(dto: CreateUserDto) {
    return this.db.client.user.create({
      data: { ...dto, password: await bcrypt.hash(dto.password, 10) },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.db.client.user.update({
      where: { id },
      data: {
        ...dto,
        password: dto.password && (await bcrypt.hash(dto.password, 10)),
      },
    });
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    await this.findOne(id);
    await this.db.client.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
