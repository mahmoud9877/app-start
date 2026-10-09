import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizeEmail, trim } from '../../common/transforms';

export class CreateUserDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  // bcrypt only uses the first 72 bytes.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
