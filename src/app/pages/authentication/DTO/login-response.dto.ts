export interface LoginResponseDto {
  token: string;
  role: 'ROLE_ADMIN' | 'ROLE_ENSEIGNANT';
}