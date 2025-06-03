/**
 * Configuration globale du système de planification
 */
const CONSTANTS = {
  HEURES_PAR_JOUR: 7.5,
  JOURS_OUVRES_MOIS: 21,
  POURCENTAGE_CAPACITE: 0.8,
  DELAI_MINIMUM_DESN_DEQP: 10,
  DELAI_NISR: 110,
  DUREES: {
    DESN: { COMPLEXE: 15, SIMPLE: 4 },
    DEQP: { COMPLEXE: 15, SIMPLE: 5 }
  },
  FORMATS: {
    DATE: "dd/MM/yyyy",
    NOMBRE: "0.0",
    POURCENTAGE: "0.0%"
  },
  COULEURS: {
    HEADER: "#000000",
    ALTERNANCE_1: "#f3f3f3",
    ALTERNANCE_2: "#ffffff",
    TEXTE_HEADER: "#ffffff"
  },
  PLANNING: {
    MAX_MOIS: 24,
    HEURES_PAR_MOIS_DS: 378,  // (472.5 * 0.8) capacité mensuelle DS
    HEURES_PAR_MOIS_TECH: 504, // (630 * 0.8) capacité mensuelle Tech
    DELAI_ENTRE_PHASES: 10
  },
  TEMPS: {
    TAMPON: 0.2 // 20% de tampon entre les projets
  }
};
