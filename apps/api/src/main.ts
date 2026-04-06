import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users/users.service';
import { UserRole } from '@prisma/client';

async function ensureAdminUser(usersService: UsersService) {
  const adminEmail = 'admin@oricruit.com';
  const existingAdmin = await usersService.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const password = await bcrypt.hash('password123', 10);
    await usersService.create({
      email: adminEmail,
      password,
      name: 'Admin User',
      role: UserRole.ADMIN,
    });
    console.log(`Created default admin user: ${adminEmail}`);
  } else if (existingAdmin.role !== UserRole.ADMIN) {
    await usersService.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });
    console.log(`Updated existing user to ADMIN role: ${adminEmail}`);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const usersService = app.get(UsersService);
  await ensureAdminUser(usersService);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
