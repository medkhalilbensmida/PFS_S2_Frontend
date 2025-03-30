export interface LoginResponseEnseignantDto {
    token: string;
    role: 'ROLE_ENSEIGNANT';
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    grade: string;
    departement: string;
  }