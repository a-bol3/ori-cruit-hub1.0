import { Controller, Patch, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateProfile(@Request() req, @Body() updateData: any) {
    this.logger.log(`Received profile update request for user: ${req.user?.id}`);
    
    const { email, name } = updateData;
    
    return this.usersService.update({
      where: { id: req.user.id },
      data: { email, name }
    });
  }
}
