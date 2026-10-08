import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDTO } from './validation/createUser.dto';
import { LoginDTO } from './validation/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('/signup')
    signup(@Body() dto: SignupDTO) {
        return this.authService.signup(dto);
    }

    @Post('/login')
    login(@Body() dto: LoginDTO) {
        return this.authService.login(dto);
    }
}
