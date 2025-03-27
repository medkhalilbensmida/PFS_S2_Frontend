export interface RegisterEnseignantDto {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  grade: string;
  departement: string;
}

export interface RegisterAdminDto {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  fonction: string;
}