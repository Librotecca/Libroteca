export type StatoLettura = "da_leggere" | "in_lettura" | "letto" | "abbandonato";

export interface Libro {
  id: string;
  titolo: string;
  sottotitolo?: string | null;
  autori: string[];
  descrizione?: string | null;
  immagine_url?: string | null;
  isbn_13?: string | null;
  isbn_10?: string | null;
  editore?: string | null;
  data_pubblicazione?: string | null;
  categorie: string[];
  lingua?: string | null;
  pagine?: number | null;
  link_google_books?: string | null;
}

export interface VoceLibreria {
  id: string;
  user_id: string;
  libro_id: string;
  stato: StatoLettura;
  valutazione: number | null;
  note: string | null;
  data_inizio: string | null;
  data_fine: string | null;
  created_at: string;
  updated_at: string;
  libro?: Libro;
}

export interface Consiglio {
  titolo: string;
  autore: string;
  motivo: string;
  genere?: string;
  // Arricchito lato server con i dati reali da Google Books, se trovato
  libro?: Libro | null;
}

export const ETICHETTE_STATO: Record<StatoLettura, string> = {
  da_leggere: "Da leggere",
  in_lettura: "In lettura",
  letto: "Letto",
  abbandonato: "Abbandonato",
};

export interface Profilo {
  user_id: string;
  email: string | null;
  nome_visualizzato: string | null;
}

export interface Famiglia {
  id: string;
  nome: string;
  codice_invito: string;
  creato_da: string;
}

export interface MembroFamiglia {
  user_id: string;
  famiglia_id: string;
  ruolo: "creatore" | "membro";
  profilo?: Profilo;
}
