import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { LoginInterface } from '../interfaces/login.interface';

export class LoginDto implements LoginInterface {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
