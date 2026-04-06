import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

const ADMIN_FALLBACK_EMAILS = new Set([
  'admin@oricruit.com',
  'admin@oricuit.com',
]);

const ADMIN_FALLBACK_ENABLED =
  process.env.ADMIN_FALLBACK_ENABLED === 'true';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const normalizedEmail = email.trim().toLowerCase();
    const lookupEmail = ADMIN_FALLBACK_EMAILS.has(normalizedEmail)
      ? 'admin@oricruit.com'
      : normalizedEmail;

    const user = await this.usersService.findOne({ email: lookupEmail });

    // 1. Password Verification
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    // 2. Dev-only fallback for admin credentials
    if (
      ADMIN_FALLBACK_ENABLED &&
      ADMIN_FALLBACK_EMAILS.has(normalizedEmail) &&
      pass === 'password123'
    ) {
      let admin = user;

      if (!admin) {
        const defaultPassword = await bcrypt.hash('password123', 10);
        admin = await this.usersService.create({
          email: 'admin@oricruit.com',
          password: defaultPassword,
          name: 'Admin User',
          role: UserRole.ADMIN,
        });
      }

      if (admin.role === UserRole.ADMIN) {
        const { password, ...result } = admin;
        return result;
      }
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
