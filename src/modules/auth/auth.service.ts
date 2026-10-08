import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

// Token issuing (JWT) and the global auth guard are not implemented yet.
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('email already registered');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      password,
    });

    return { email: user.email, name: user.name };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const passwordMatches =
      user && (await bcrypt.compare(dto.password, user.password));

    if (!passwordMatches) {
      throw new UnauthorizedException('invalid email or password');
    }

    return { email: user.email, name: user.name };
  }
}
