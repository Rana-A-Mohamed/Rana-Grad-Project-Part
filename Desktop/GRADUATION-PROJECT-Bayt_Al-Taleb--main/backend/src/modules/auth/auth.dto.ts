/** Response DTOs for the Auth module (what the API returns to clients). */

export interface AuthUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto {
  user: AuthUserDto;
  tokens: TokenPairDto;
}