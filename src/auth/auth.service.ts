import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SignupDTO } from './validation/createUser.dto';
import { LoginDTO } from './validation/login.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class AuthService {
    constructor(private readonly userRepository: UserRepository) { }

    async signup(dto: SignupDTO) {
        const existing = await this.userRepository.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('email already registered');
        }

        const password = await bcrypt.hash(dto.password, 10);
        const user = await this.userRepository.create({ email: dto.email, name: dto.name, password });

        return { email: user.email, name: user.name };
    }

    async login(dto: LoginDTO) {
        const user = await this.userRepository.findByEmail(dto.email);
        const passwordMatches = user && (await bcrypt.compare(dto.password, user.password));

        if (!passwordMatches) {
            throw new UnauthorizedException('invalid email or password');
        }

        return { email: user.email, name: user.name };
    }
}
