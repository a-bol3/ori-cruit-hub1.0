import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsDateString, Matches } from 'class-validator';
import { SourceChannel } from '@prisma/client';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @Matches(/^[+\s0-9]{5,20}$/, { message: 'Phone must be a valid international format (digits, spaces, or +)' })
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsEnum(SourceChannel)
  @IsOptional()
  source?: SourceChannel;

  @IsString()
  @IsOptional()
  recruiterId?: string;

  @IsDateString()
  @IsOptional()
  availabilityDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
