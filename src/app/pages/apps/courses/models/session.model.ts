export interface SessionExamen {
  id: number;
  dateDebut: string;
  dateFin: string;
  type: string;
  estActive: boolean;
  anneeUniversitaireId: number;
  numSemestre: string;
}

export interface AddSessionExamenDTO {
  dateDebut: string | Date;
  dateFin: string | Date;
  type: string;
  estActive: boolean;
  anneeUniversitaireId: number;
  numSemestre: string;
}

export interface AnneeUniversitaire {
  id: number;
  dateDebut: string | Date;
  dateFin: string | Date;
  estActive: boolean;
  annee?: string; 
}