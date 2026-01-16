/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Body, Controller, HttpException, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiResponse } from '../interfaces/apiResponse';
import { RegisterUserDto } from '../dto/register.user.dto';
import { SafeUser } from '../interfaces/user.interface';
import { LoginUserDto } from '../dto/login.user';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() data: LoginUserDto): Promise<
      ApiResponse<{
        token: string;
        user: {
          id: string;
          email: string;
          role: string;
        };
      }>
    > {
      try {
        const result = await this.authService.login(data);
        return {
          success: true,
          message: 'User logged in successfully',
          data: result,
        };
      } catch (error) {
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid credentials',
          data: null,
        });
      }
    }

    @Post('register')
    async register(@Body() data: RegisterUserDto): Promise<ApiResponse<SafeUser>> {
      try {
        const user = await this.authService.register(data);
  
        return {
          success: true,
          message: 'User registered successfully',
          data: user,
        };
      } catch (error) {
        throw new HttpException(
          {
            success: false,
            message: error.message || 'Registration failed',
            data: null,
          },
          HttpStatus.CONFLICT,
        );
      }
    }

    @Post('verify-email')
    async verifyEmail(@Body('email') email: string, @Body('code') code: string,
): Promise<ApiResponse<{message: string}>> {
    try{
        const result = await this.authService.verifyEmail(email, code);
        return{
            success: true,
            message: result.message,
            data: result,
        }
    } catch(error){
        throw new HttpException(
            {
                success: false,
                message: error.message,
                data: null,
            },
            HttpStatus.BAD_REQUEST,
        )
    }

}

// request verification code
    @Post('request-verification-code')
    async requestVerification(@Body('email') email: string,
): Promise<ApiResponse<{ message: string }>> {
    try{
        const result = await this.authService.requestNewVerificationCode(email);
        return {
            success: true,
            message: result.message,
            data: result,
        };
    } catch(error) {
        throw new HttpException(
            {
                success: false,
                message: error.message || 'Request verification failed',
                data: null,
            },
            HttpStatus.BAD_REQUEST,
        );
    }
  }

 // resend reset code
  @Post('forgot-password')
  async resenResetCode(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  // resend reset code
  @Post('resend-reset-code')
  async resendResetCode(@Body('email') email: string) {
    return this.authService.resendResetCode(email);
  }

  // reset password
  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; code: string; password: string},
  ) {
    return this.authService.resetPassword(
        body.email,
        body.code,
        body.password,
    );
  }
}
