import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDTO {
    @IsEmail({}, { message: 'must be a valid email' })
    email: string;

    @IsString()
    @MinLength(3, { message: 'too short' })
    @MaxLength(20, { message: 'too long' })
    name: string;

    @IsString()
    @MinLength(8, { message: 'password must be at least 8 characters' })
    password: string;
}
