import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SignupDTO } from './validation/createUser.dto';
import { LoginDTO } from './validation/login.dto';

interface StoredUser {
    email: string;
    name: string;
    passwordHash: string;
}

@Injectable()
export class AuthService {
    private readonly users: StoredUser[] = [];

    async signup(dto: SignupDTO) {
        if (this.users.some((user) => user.email === dto.email)) {
            throw new ConflictException('email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        this.users.push({ email: dto.email, name: dto.name, passwordHash });

        return { email: dto.email, name: dto.name };
    }

    async login(dto: LoginDTO) {
        console.log('the users', this.users)
        const user = this.users.find((u) => u.email === dto.email);
        const passwordMatches = user && (await bcrypt.compare(dto.password, user.passwordHash));
        console.log('user', user, passwordMatches)

        if (!passwordMatches) {
            throw new UnauthorizedException('invalid email or password');
        }

        return { email: user.email, name: user.name };
    }
}
