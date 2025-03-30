export interface LoginResponseAdminDto {
  token: string;
  role: 'ROLE_ADMIN';
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  fonction: string;
}