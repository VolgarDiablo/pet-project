import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { LoginInterface } from '../interfaces/login.interface';

export class LoginDto implements LoginInterface {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
