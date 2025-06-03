/**
 * Classe représentant un projet
 */
class Projet {
  constructor(data, CONSTANTS) {
    this.id = data.projet;
    this.reseaux = Array.isArray(data.reseaux) ? data.reseaux : [data.reseau];
    this.priorite = data.priorite;
    this.estComplexe = data.sapHeaders ? data.sapHeaders.charAt(17) === "D" : false;
    this.directTechnicien = data.directTechnicien === "Oui";
    this.technologie = data.technologie;
    this.dateNISR = data.dateNISR ? new Date(data.dateNISR) : null;
    this.kickOffDAPP = data.kickOffDAPP ? new Date(data.kickOffDAPP) : null;
    this.sapHeaders = data.sapHeaders;
    this.dateRecue = data.dateRecue ? new Date(data.dateRecue) : null;
    this.constants = CONSTANTS;
    
    // Ajout de logs pour le débogage
    Logger.debug(`Création du projet ${this.id}:`, {
      reseaux: this.reseaux,
      estComplexe: this.estComplexe,
      sapHeaders: this.sapHeaders
    });

    this.calculerDurees();
    this.calculerDateFinCible();
    this.validation();
  }

calculerDurees() {
    // Calcul de la durée DESN
    this.dureeDESN = this.reseaux.reduce((total, reseau) => {
      const dureeUnitaire = this.estComplexe ? 
        this.constants.DUREES.DESN.COMPLEXE : 
        this.constants.DUREES.DESN.SIMPLE;
      return total + dureeUnitaire;
    }, 0);

    // Calcul de la durée DEQP
    this.dureeDEQP = this.reseaux.reduce((total, reseau) => {
      const dureeUnitaire = this.estComplexe ? 
        this.constants.DUREES.DEQP.COMPLEXE : 
        this.constants.DUREES.DEQP.SIMPLE;
      return total + dureeUnitaire;
    }, 0);

    // Log des durées calculées
    Logger.debug(`Durées calculées pour ${this.id}:`, {
      dureeDESN: this.dureeDESN,
      dureeDEQP: this.dureeDEQP,
      nombreReseaux: this.reseaux.length
    });
  }

  calculerDureeTotal(type, CONSTANTS) {
  if (!CONSTANTS || !CONSTANTS.DUREES || !CONSTANTS.DUREES[type]) {
    throw new Error(`Configuration DUREES manquante pour le type ${type}`);
  }
  
  // S'assurer que this.reseaux est un tableau
  if (!Array.isArray(this.reseaux)) {
    this.reseaux = [this.reseaux].filter(Boolean);
  }
  
  const durees = CONSTANTS.DUREES[type];
  return this.reseaux.reduce((total, reseau) => {
    // Vérifier si le réseau est valide
    if (!reseau) return total;
    
    // Ajouter un log pour le débogage
    Logger.debug(`Calcul durée ${type} pour réseau ${reseau}:`, {
      estComplexe: this.estComplexe,
      dureeUnitaire: this.estComplexe ? durees.COMPLEXE : durees.SIMPLE
    });
    
    return total + (this.estComplexe ? durees.COMPLEXE : durees.SIMPLE);
  }, 0);
}

  calculerDateFinCible() {
    if (this.kickOffDAPP) {
      this.dateFinCible = new Date(this.kickOffDAPP);
    } else if (this.dateNISR) {
      this.dateFinCible = new Date(this.dateNISR);
      this.dateFinCible.setDate(this.dateFinCible.getDate() - this.constants.DELAI_NISR);
    } else {
      this.dateFinCible = null;
    }
  }

  calculerDureeTotal() {
    return this.dureeDESN + this.dureeDEQP + 
           (this.constants.PLANNING.DELAI_ENTRE_PHASES * this.constants.HEURES_PAR_JOUR);
  }

  validation() {
    if (!this.id) throw new Error("ID du projet manquant");
    if (!this.reseaux || this.reseaux.length === 0) throw new Error("Réseaux manquants");
    if (this.dureeDESN <= 0) throw new Error(`Durée DESN invalide pour ${this.id}: ${this.dureeDESN}`);
    if (this.dureeDEQP <= 0) throw new Error(`Durée DEQP invalide pour ${this.id}: ${this.dureeDEQP}`);
  }


  toString() {
    return `Projet ${this.id} (${this.reseaux.length} réseaux)`;
  }
}
