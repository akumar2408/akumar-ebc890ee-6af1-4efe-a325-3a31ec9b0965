
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../../dto/auth.dto';
import { Public } from '../../security/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const u = await this.auth.validateUser(dto.email, dto.password);
    return this.auth.login(u);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const u = await this.auth.register(dto.email, dto.password);
    return this.auth.login(u);
  }
}