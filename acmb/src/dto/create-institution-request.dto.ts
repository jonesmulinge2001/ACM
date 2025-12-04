/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateInstitutionRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  description?: string;

  @IsEmail()
  officialEmail: string;

  @IsNotEmpty()
  @IsString()
  officialDomain: string;

  @IsUrl()
  websiteUrl: string;

  // files will be handled via Multer, so we don't include them here
}
