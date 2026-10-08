import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'must be a valid email' })
  email: string;

  @IsString()
  password: string;
}
