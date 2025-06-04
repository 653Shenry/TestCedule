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

/**
 * Classe de gestion des logs
 */
class Logger {
  static log(type, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  static error(message, error) {
    this.log('ERROR', message, error);
    console.error(error);
  }

  static info(message, data) {
    this.log('INFO', message, data);
  }

  static debug(message, data) {
    this.log('DEBUG', message, data);
  }
  }

/**
 * Classe de gestion des dates
 */
class DateManager {
  static get JOURS_SEMAINE() {
    return ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  }
  
  static estJourOuvrable(date) {
    if (!date) return false;
    const jour = date.getDay();
    return jour !== 0 && jour !== 6;
  }

  static estEnVacances(ressource, date, vacances) {
    if (!ressource || !date || !vacances || !vacances[ressource]) return false;
    return vacances[ressource].some(function(vacanceDate) {
      var dateVacances = new Date(vacanceDate);
      dateVacances.setHours(0, 0, 0, 0);
      var dateTest = new Date(date);
      dateTest.setHours(0, 0, 0, 0);
      return dateTest.getTime() === dateVacances.getTime();
    });
  }

  static estJourValide(date, ressource, vacances) {
    return this.estJourOuvrable(date) && !this.estEnVacances(ressource, date, vacances);
  }

  static calculerHeuresDisponiblesMois(annee, mois, ressource, vacances, debutJour = 1, finJour = null) {
    // Ajouter des logs pour le débogage
    Logger.info(`Calcul des heures disponibles pour ${ressource}:`, {
        annee: annee,
        mois: mois,
        debutJour: debutJour,
        finJour: finJour
    });

    const premierJour = new Date(annee, mois, debutJour);
    const dernierJour = finJour 
        ? new Date(annee, mois, finJour)
        : new Date(annee, mois + 1, 0);
    
    let joursOuvrables = 0;
    let dateCourante = new Date(premierJour);

    while (dateCourante <= dernierJour) {
        if (this.estJourValide(dateCourante, ressource, vacances)) {
            joursOuvrables++;
        }
        dateCourante.setDate(dateCourante.getDate() + 1);
    }

    const heuresDisponibles = joursOuvrables * CONSTANTS.HEURES_PAR_JOUR;

    Logger.info(`Résultat du calcul:`, {
        joursOuvrables: joursOuvrables,
        heuresDisponibles: heuresDisponibles
    });

    return heuresDisponibles;
  }
  static soustraireHeuresOuvrables(dateFin, nombreHeures, ressource, vacances, constants) {
  let dateCourante = new Date(dateFin);
  let heuresRestantes = nombreHeures;
  
  while (heuresRestantes > 0) {
    if (this.estJourValide(dateCourante, ressource, vacances)) {
      const heuresTravaillees = Math.min(constants.HEURES_PAR_JOUR, heuresRestantes);
      heuresRestantes -= heuresTravaillees;
      
      if (heuresRestantes > 0) {
        dateCourante.setDate(dateCourante.getDate() - 1);
        dateCourante.setHours(17, 0, 0, 0); // Fin de journée précédente
      } else {
        dateCourante.setHours(dateCourante.getHours() - heuresTravaillees);
      }
    } else {
      dateCourante.setDate(dateCourante.getDate() - 1);
      dateCourante.setHours(17, 0, 0, 0); // Fin de journée précédente
    }
  }
  
  return dateCourante;
}

  static trouverProchainJourValide(date, ressource, vacances) {
    var resultat = new Date(date);
    resultat.setHours(9, 0, 0, 0);
    
    while (!this.estJourValide(resultat, ressource, vacances)) {
      resultat.setDate(resultat.getDate() + 1);
    }
    
    return resultat;
  }

  static ajouterJoursOuvrables(date, nombreJours, ressource, vacances) {
    var resultat = new Date(date);
    var joursAjoutes = 0;
    
    while (joursAjoutes < nombreJours) {
      resultat.setDate(resultat.getDate() + 1);
      if (this.estJourValide(resultat, ressource, vacances)) {
        joursAjoutes++;
      }
    }
    
    return resultat;
  }

  static ajouterHeuresOuvrables(dateDebut, nombreHeures, ressource, vacances, constants) {
    let dateCourante = new Date(dateDebut);
    let heuresRestantes = nombreHeures;
    
    while (heuresRestantes > 0) {
      if (this.estJourValide(dateCourante, ressource, vacances)) {
        const heuresTravaillees = Math.min(constants.HEURES_PAR_JOUR, heuresRestantes);
        heuresRestantes -= heuresTravaillees;
        
        if (heuresRestantes > 0) {
          dateCourante.setDate(dateCourante.getDate() + 1);
          dateCourante.setHours(9, 0, 0, 0);
        } else {
          dateCourante.setHours(dateCourante.getHours() + heuresTravaillees);
        }
      } else {
        dateCourante.setDate(dateCourante.getDate() + 1);
        dateCourante.setHours(9, 0, 0, 0);
      }
    }
    
    return dateCourante;
  }

  static formatDate(date) {
    if (!date || !(date instanceof Date)) return '';
    return Utilities.formatDate(date, Session.getScriptTimeZone(), CONSTANTS.FORMATS.DATE);
  }

  static genererListeMois(dateDebut, dateFin) {
    var mois = [];
    var currentDate = new Date(dateDebut);
    currentDate.setDate(1);
    
    while (currentDate <= dateFin) {
      mois.push(Utilities.formatDate(currentDate, Session.getScriptTimeZone(), "yyyy-MM"));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return mois;
  }

  static calculerNombreJoursOuvres(dateDebut, dateFin) {
    var count = 0;
    var currentDate = new Date(dateDebut);
    
    while (currentDate <= dateFin) {
      if (this.estJourOuvrable(currentDate)) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }

  static calculerHeuresOuvrees(dateDebut, dateFin, ressource, vacances) {
    var heures = 0;
    var currentDate = new Date(dateDebut);
    
    while (currentDate <= dateFin) {
      if (this.estJourValide(currentDate, ressource, vacances)) {
        heures += CONSTANTS.HEURES_PAR_JOUR;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return heures;
  }
}

/**
 * Classe de gestion de l'état du planning
 */
class PlanningState {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.capaciteUtilisee = {};
    this.assignationParRessource = {
      DS: {},
      Tech: {}
    };
    this.dernieresDates = {
      DS: {},
      Tech: {}
    };
  }

  ajouterCapaciteUtilisee(ressource, mois, heures) {
    const cle = `${ressource}-${mois}`;
    this.capaciteUtilisee[cle] = (this.capaciteUtilisee[cle] || 0) + heures;
  }

  getCapaciteUtilisee(ressource, mois) {
    return this.capaciteUtilisee[`${ressource}-${mois}`] || 0;
  }

  mettreAJourDerniereDateRessource(type, ressource, date) {
    this.dernieresDates[type][ressource] = new Date(date);
  }
}

/**
 * Classe de gestion de la capacité
 */
class CapaciteCalculator {
  constructor(capaciteTotale) {
    this.capaciteTotale = capaciteTotale;
    this.utilisee = {};
  }

  peutAjouter(mois, heures) {
    const utilise = this.utilisee[mois] || 0;
    return (utilise + heures) <= this.capaciteTotale;
  }

  ajouter(mois, heures) {
    if (!this.peutAjouter(mois, heures)) return false;
    this.utilisee[mois] = (this.utilisee[mois] || 0) + heures;
    return true;
  }

  getCapaciteRestante(mois) {
    return this.capaciteTotale - (this.utilisee[mois] || 0);
  }

  getPourcentageUtilisation(mois) {
    return ((this.utilisee[mois] || 0) / this.capaciteTotale) * 100;
  }

  verifierCapaciteMensuelle(ressource, dateDebut, dateFin, dureeHeures) {
  Logger.debug(`Vérification capacité pour ${ressource}`, {
    dateDebut: dateDebut,
    dateFin: dateFin,
    dureeHeures: dureeHeures
  });

  const dateMaximale = new Date();
  dateMaximale.setMonth(dateMaximale.getMonth() + CONSTANTS.PLANNING.MAX_MOIS);
  
  let dateCourante = new Date(dateDebut);
  let heuresRestantes = dureeHeures;
  let dateDebutTrouvee = null;
  let repartitionMois = [];
  
  while (dateCourante <= dateMaximale && heuresRestantes > 0) {
    const moisKey = `${dateCourante.getFullYear()}-${(dateCourante.getMonth() + 1).toString().padStart(2, '0')}`;
    const heuresDisponiblesMois = Math.min(heuresRestantes, this.getCapaciteRestante(moisKey));
    
    if (this.peutAjouter(moisKey, heuresDisponiblesMois)) {
      if (!dateDebutTrouvee) {
        dateDebutTrouvee = new Date(dateCourante);
      }
      
      this.ajouter(moisKey, heuresDisponiblesMois);
      heuresRestantes -= heuresDisponiblesMois;
      
      repartitionMois.push({
        mois: moisKey,
        heures: heuresDisponiblesMois
      });
    }
    
    // Passer au mois suivant
    dateCourante.setMonth(dateCourante.getMonth() + 1);
    dateCourante.setDate(1);
  }
  
  return {
    success: heuresRestantes === 0,
    dateDebut: dateDebutTrouvee,
    repartitionMois: repartitionMois
  };
}
}

/**
 * Classe représentant un projet
 */
class Projet {
  constructor(data, CONSTANTS) {
    this.id = data.projet;
    this.reseaux = Array.isArray(data.reseaux) ? data.reseaux : [data.reseau];
    this.priorite = data.priorite;
    this.estComplexe = data.estComplexe;
    this.directTechnicien = data.directTechnicien === "Oui";
    this.technologie = data.technologie;
    this.dateNISR = data.dateNISR ? new Date(data.dateNISR) : null;
    this.kickOffDAPP = data.kickOffDAPP ? new Date(data.kickOffDAPP) : null;
    this.sapHeaders = data.sapHeaders;
    this.dateRecue = data.dateRecue ? new Date(data.dateRecue) : null;
    this.constants = CONSTANTS;
    
    this.dureeDESN = this.calculerDuree("DESN", CONSTANTS);
    this.dureeDEQP = this.calculerDuree("DEQP", CONSTANTS);
    
    this.calculerDateFinCible();
    this.validation();
  }

  calculerDuree(type, CONSTANTS) {
    if (!CONSTANTS || !CONSTANTS.DUREES || !CONSTANTS.DUREES[type]) {
      throw new Error(`Configuration DUREES manquante pour le type ${type}`);
    }
    const durees = CONSTANTS.DUREES[type];
    return this.reseaux.length * (this.estComplexe ? durees.COMPLEXE : durees.SIMPLE);
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
    if (this.dureeDESN <= 0) throw new Error("Durée DESN invalide");
    if (this.dureeDEQP <= 0) throw new Error("Durée DEQP invalide");
  }

  toString() {
    return `Projet ${this.id} (${this.reseaux.length} réseaux)`;
  }
}


/**
 * Classe principale de planification
 */
class Planificateur {
  constructor(ressourcesDS, ressourcesTech, vacances, constants) {
    this.ressourcesDS = ressourcesDS;
    this.ressourcesTech = ressourcesTech;
    this.vacances = vacances;
    this.constants = constants;
    this.planningState = new PlanningState();
    
    this.capaciteDS = new CapaciteCalculator(this.constants.PLANNING.HEURES_PAR_MOIS_DS);
    this.capaciteTech = new CapaciteCalculator(this.constants.PLANNING.HEURES_PAR_MOIS_TECH);
  }

choisirRessourceMoinsChargee(ressources, dernieresDates) {
    if (!ressources || ressources.length === 0) {
      throw new Error("Aucune ressource disponible");
    }

    return ressources.reduce((moins, actuel) => {
      const dateMoins = dernieresDates[moins] || new Date(0);
      const dateActuel = dernieresDates[actuel] || new Date(0);
      return dateActuel < dateMoins ? actuel : moins;
    }, ressources[0]);
  }


  planifierProjet(projet) {
    Logger.info(`Début planification: ${projet.toString()}`);
    
    try {
      if (projet.directTechnicien) {
        return this.planifierTacheTechnicien(projet);
      }
      return this.planifierTacheComplete(projet);
    } catch (e) {
      Logger.error(`Erreur planification ${projet.id}`, e);
      return null;
    }
  }

  planifierTacheTechnicien(projet) {
    const techChoisi = this.choisirRessourceMoinsChargee(this.ressourcesTech, this.planningState.dernieresDates.Tech);
    let dateDebutDEQP;

    if (projet.dateFinCible) {
      // Si une date fin cible existe, on planifie à rebours
      let dateFinDEQP = new Date(projet.dateFinCible);
      dateDebutDEQP = DateManager.soustraireHeuresOuvrables(
        dateFinDEQP,
        projet.dureeDEQP,
        techChoisi,
        this.vacances,
        this.constants
      );
    } else {
      // Sinon, on planifie à partir de la dernière date connue
      dateDebutDEQP = DateManager.trouverProchainJourValide(
        this.planningState.dernieresDates.Tech[techChoisi] || new Date(),
        techChoisi,
        this.vacances
      );
    }

    const dateFinDEQP = DateManager.ajouterHeuresOuvrables(
      dateDebutDEQP,
      projet.dureeDEQP,
      techChoisi,
      this.vacances,
      this.constants
    );

    // Vérifier si la planification respecte la date fin cible
    if (projet.dateFinCible && dateFinDEQP > projet.dateFinCible) {
      throw new Error(`Impossible de respecter la date fin cible pour le projet ${projet.id}`);
    }

    this.planningState.mettreAJourDerniereDateRessource('Tech', techChoisi, dateFinDEQP);

    return {
      ...projet,
      techAssigne: techChoisi,
      dateDebutDEQP,
      dateFinDEQP,
      dsAssigne: null,
      dateDebutDESN: null,
      dateFinDESN: null
    };
  }

  planifierTacheComplete(projet) {
  const dsChoisi = this.choisirRessourceMoinsChargee(
    this.ressourcesDS, 
    this.planningState.dernieresDates.DS
  );

  const techChoisi = this.choisirRessourceMoinsChargee(
    this.ressourcesTech,
    this.planningState.dernieresDates.Tech
  );

  let dateDebutDESN, dateFinDESN, dateDebutDEQP, dateFinDEQP;
  const dateActuelle = new Date();

  if (projet.dateFinCible && projet.dateFinCible > dateActuelle) {
    // Planification à rebours depuis la date fin cible
    dateFinDEQP = new Date(projet.dateFinCible);
    dateDebutDEQP = DateManager.soustraireHeuresOuvrables(
      dateFinDEQP,
      projet.dureeDEQP,
      techChoisi,
      this.vacances,
      this.constants
    );

    dateFinDESN = DateManager.soustraireHeuresOuvrables(
      dateDebutDEQP,
      this.constants.PLANNING.DELAI_ENTRE_PHASES * this.constants.HEURES_PAR_JOUR,
      null,
      this.vacances,
      this.constants
    );

    dateDebutDESN = DateManager.soustraireHeuresOuvrables(
      dateFinDESN,
      projet.dureeDESN,
      dsChoisi,
      this.vacances,
      this.constants
    );

    // Vérifier si la date de début DESN est dans le passé
    if (dateDebutDESN < dateActuelle) {
      dateDebutDESN = DateManager.trouverProchainJourValide(dateActuelle, dsChoisi, this.vacances);
      dateFinDESN = DateManager.ajouterHeuresOuvrables(
        dateDebutDESN,
        projet.dureeDESN,
        dsChoisi,
        this.vacances,
        this.constants
      );
      dateDebutDEQP = DateManager.ajouterHeuresOuvrables(
        dateFinDESN,
        this.constants.PLANNING.DELAI_ENTRE_PHASES * this.constants.HEURES_PAR_JOUR,
        null,
        this.vacances,
        this.constants
      );
      dateFinDEQP = DateManager.ajouterHeuresOuvrables(
        dateDebutDEQP,
        projet.dureeDEQP,
        techChoisi,
        this.vacances,
        this.constants
      );
    }
  } else {
    // Planification normale à partir de la première date disponible
    dateDebutDESN = DateManager.trouverProchainJourValide(
      Math.max(dateActuelle, this.planningState.dernieresDates.DS[dsChoisi] || dateActuelle),
      dsChoisi,
      this.vacances
    );

    dateFinDESN = DateManager.ajouterHeuresOuvrables(
      dateDebutDESN,
      projet.dureeDESN,
      dsChoisi,
      this.vacances,
      this.constants
    );

    dateDebutDEQP = DateManager.ajouterHeuresOuvrables(
      dateFinDESN,
      this.constants.PLANNING.DELAI_ENTRE_PHASES * this.constants.HEURES_PAR_JOUR,
      null,
      this.vacances,
      this.constants
    );

    dateFinDEQP = DateManager.ajouterHeuresOuvrables(
      dateDebutDEQP,
      projet.dureeDEQP,
      techChoisi,
      this.vacances,
      this.constants
    );
  }

  // Vérifier la capacité
  const verificationCapaciteDS = this.capaciteDS.verifierCapaciteMensuelle(
    dsChoisi,
    dateDebutDESN,
    dateFinDESN,
    projet.dureeDESN
  );

  const verificationCapaciteTech = this.capaciteTech.verifierCapaciteMensuelle(
    techChoisi,
    dateDebutDEQP,
    dateFinDEQP,
    projet.dureeDEQP
  );

  if (!verificationCapaciteDS.success || !verificationCapaciteTech.success) {
    throw new Error(`Capacité insuffisante pour le projet ${projet.id}`);
  }

  this.planningState.mettreAJourDerniereDateRessource('DS', dsChoisi, dateFinDESN);
  this.planningState.mettreAJourDerniereDateRessource('Tech', techChoisi, dateFinDEQP);

  return {
    ...projet,
    dsAssigne: dsChoisi,
    techAssigne: techChoisi,
    dateDebutDESN,
    dateFinDESN,
    dateDebutDEQP,
    dateFinDEQP
  };
}

}

/**
 * Classe de génération de rapports
 */

class RapportGenerator {
  constructor(spreadsheet, CONSTANTS) {
    this.ss = spreadsheet;
    this.CONSTANTS = CONSTANTS;
  }

  genererTousLesRapports(cedule) {
    this.genererCedulePrincipale(cedule);
    this.genererCeduleDS(cedule);
    this.genererCeduleTech(cedule);
    this.genererRapportCharge(cedule);
  }

  genererCedulePrincipale(cedule) {
    const sheet = this.getOrCreateSheet("Cédule Principale");
    const headers = [
      "Projet", "Réseaux", "Priorité", "Technologie", 
      "DS assigné", "Durée DESN totale", "Début DESN", "Fin DESN",
      "Tech assigné", "Durée DEQP totale", "Début DEQP", "Fin DEQP",
      "Direct Technicien", "Date NISR", "Kick Off DAPP"
    ];
    
    const data = cedule.map(projet => [
      projet.id,
      projet.reseaux.join(", "),
      projet.priorite,
      projet.technologie,
      projet.dsAssigne,
      projet.dureeDESN,
      projet.dateDebutDESN,
      projet.dateFinDESN,
      projet.techAssigne,
      projet.dureeDEQP,
      projet.dateDebutDEQP,
      projet.dateFinDEQP,
      projet.directTechnicien ? "Oui" : "Non",
      projet.dateNISR,
      projet.kickOffDAPP
    ]);

    this.ecrireEtFormaterDonnees(sheet, headers, data);

    // Formater spécifiquement les colonnes de durées (colonnes F et J)
    if (data.length > 0) {
      sheet.getRange(2, 6, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.NOMBRE); // Durée DESN
      sheet.getRange(2, 10, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.NOMBRE); // Durée DEQP
    }
}

  genererCeduleDS(cedule) {
    const sheet = this.getOrCreateSheet("Cédule DS");
    const headers = [
      "Projet", "Réseaux", "Priorité", "Technologie", 
      "DS assigné", "Durée DESN totale", "Début DESN", "Fin DESN",
      "Date NISR", "Kick Off DAPP"
    ];
    
    const data = cedule.map(projet => [
      projet.id,
      projet.reseaux.join(", "),
      projet.priorite,
      projet.technologie,
      projet.dsAssigne,
      projet.dureeDESN,
      projet.dateDebutDESN,
      projet.dateFinDESN,
      projet.dateNISR,
      projet.kickOffDAPP // La valeur brute sera formatée plus tard
    ]);

    this.ecrireEtFormaterDonnees(sheet, headers, data);

    // Formater spécifiquement la colonne Kick Off DAPP (colonne J)
    if (data.length > 0) {
      const kickOffRange = sheet.getRange(2, 10, data.length, 1); // Colonne J, à partir de la ligne 2
      kickOffRange.setNumberFormat(this.CONSTANTS.FORMATS.DATE);
    }
}

  genererCeduleTech(cedule) {
    const sheet = this.getOrCreateSheet("Cédule Tech");
    const headers = [
      "Projet", "Réseaux", "Priorité", "Technologie", 
      "Tech assigné", "Durée DEQP totale", "Début DEQP", "Fin DEQP",
      "Direct Technicien"
    ];
    
    const data = cedule.map(projet => [
      projet.id,
      projet.reseaux.join(", "),
      projet.priorite,
      projet.technologie,
      projet.techAssigne,
      projet.dureeDEQP,
      projet.dateDebutDEQP,
      projet.dateFinDEQP,
      projet.directTechnicien ? "Oui" : "Non"
    ]);

    this.ecrireEtFormaterDonnees(sheet, headers, data);
  }

  genererRapportCharge(cedule) {
    const sheet = this.getOrCreateSheet("Charge Mensuelle");
    const dateMin = new Date(Math.min(...cedule.flatMap(p => [p.dateDebutDESN, p.dateDebutDEQP].filter(Boolean))));
    const dateMax = new Date(Math.max(...cedule.flatMap(p => [p.dateFinDESN, p.dateFinDEQP].filter(Boolean))));
    const mois = DateManager.genererListeMois(dateMin, dateMax);

    const headers = ["Mois", "Type", "Heures disponibles", "Heures allouées", "% Utilisation", "Heures tampon", "% Tampon"];
    const data = [];

    mois.forEach(mois => {
      ['DS', 'Tech'].forEach(type => {
        const stats = this.calculerStatsMois(cedule, mois, type);
        data.push([
          mois,
          type,
          stats.heuresDisponibles,
          stats.heuresAllouees,
          stats.pourcentageUtilisation,
          stats.heuresTampon,
          stats.pourcentageTampon
        ]);
      });
    });

    this.ecrireEtFormaterDonnees(sheet, headers, data);

    // Formater spécifiquement les colonnes
    if (data.length > 0) {
      // Format nombre pour les heures
      sheet.getRange(2, 3, data.length, 2).setNumberFormat(this.CONSTANTS.FORMATS.NOMBRE);
      // Format pourcentage pour les colonnes % Utilisation et % Tampon
      sheet.getRange(2, 5, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.POURCENTAGE);
      sheet.getRange(2, 7, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.POURCENTAGE);
      // Format nombre pour les heures tampon
      sheet.getRange(2, 6, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.NOMBRE);
    }
}

  calculerStatsMois(cedule, mois, type) {
    const capaciteTotale = type === 'DS' ? CONSTANTS.PLANNING.HEURES_PAR_MOIS_DS : CONSTANTS.PLANNING.HEURES_PAR_MOIS_TECH;
    let heuresAllouees = 0;

    cedule.forEach(projet => {
      if (type === 'DS' && projet.dsAssigne) {
        if (this.estDansMois(projet.dateDebutDESN, projet.dateFinDESN, mois)) {
          heuresAllouees += projet.dureeDESN;
        }
      } else if (type === 'Tech' && projet.techAssigne) {
        if (this.estDansMois(projet.dateDebutDEQP, projet.dateFinDEQP, mois)) {
          heuresAllouees += projet.dureeDEQP;
        }
      }
    });

    // Limiter les heures allouées à la capacité totale
    heuresAllouees = Math.min(heuresAllouees, capaciteTotale);

    const heuresTampon = heuresAllouees * CONSTANTS.TEMPS.TAMPON;
    
    // Calculer les pourcentages correctement
    const pourcentageUtilisation = heuresAllouees / capaciteTotale;
    const pourcentageTampon = heuresTampon / capaciteTotale;

    if (heuresAllouees > capaciteTotale) {
        Logger.warning(`Surcharge détectée pour ${type} en ${mois}: ${heuresAllouees}h allouées pour une capacité de ${capaciteTotale}h`);
    }

    return {
      heuresDisponibles: capaciteTotale,
      heuresAllouees: heuresAllouees,
      heuresTampon: heuresTampon,
      pourcentageUtilisation: Math.min(pourcentageUtilisation, 1), // Limité à 1 (100%)
      pourcentageTampon: Math.min(pourcentageTampon, 1) // Limité à 1 (100%)
    };
}

  estDansMois(dateDebut, dateFin, mois) {
    if (!dateDebut || !dateFin) return false;
    const [annee, moisNum] = mois.split('-').map(Number);
    const debutMois = new Date(annee, moisNum - 1, 1);
    const finMois = new Date(annee, moisNum, 0);
    return dateDebut <= finMois && dateFin >= debutMois;
  }

  getOrCreateSheet(nomFeuille) {
    let sheet = this.ss.getSheetByName(nomFeuille);
    if (!sheet) {
      sheet = this.ss.insertSheet(nomFeuille);
    }
    sheet.clear();
    return sheet;
  }

  ecrireEtFormaterDonnees(sheet, headers, data) {
  // Écrire les en-têtes
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (data.length > 0) {
    // Écrire les données
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
    
    // Formater les colonnes de dates (colonnes 7, 8, 9, 10 pour inclure Kick Off DAPP)
    const colonnesDates = [7, 8, 9, 10];
    colonnesDates.forEach(colonne => {
      if (colonne <= headers.length) {
        sheet.getRange(2, colonne, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.DATE);
      }
    });

    // Formater les colonnes de durées (colonne 6)
    const colonnesDurees = [6];
    colonnesDurees.forEach(colonne => {
      if (colonne <= headers.length) {
        sheet.getRange(2, colonne, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.NOMBRE);
      }
    });
  }
  
  this.formaterTableau(sheet, headers.length, data.length + 1);
}

  formaterTableau(sheet, numColumns, numRows) {
    // Format header
    const headerRange = sheet.getRange(1, 1, 1, numColumns);
    headerRange
      .setBackground(this.CONSTANTS.COULEURS.HEADER)
      .setFontColor(this.CONSTANTS.COULEURS.TEXTE_HEADER)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(true);

    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 40);

    // Format data
    if (numRows > 1) {
      const dataRange = sheet.getRange(2, 1, numRows - 1, numColumns);
      dataRange
        .setVerticalAlignment("middle")
        .setHorizontalAlignment("center")
        .setBorder(true, true, true, true, true, true);

      // Alternate colors
      for (let i = 2; i <= numRows; i++) {
        const rowRange = sheet.getRange(i, 1, 1, numColumns);
        rowRange.setBackground(i % 2 === 0 ? this.CONSTANTS.COULEURS.ALTERNANCE_1 : this.CONSTANTS.COULEURS.ALTERNANCE_2);
      }
    }

    // Adjust column widths
    sheet.autoResizeColumns(1, numColumns);
    for (let i = 1; i <= numColumns; i++) {
      const width = sheet.getColumnWidth(i);
      if (width < 100) sheet.setColumnWidth(i, 100);
      if (width > 300) sheet.setColumnWidth(i, 300);
    }
  }
}


/**
 * Fonctions principales
 */
function genererCedules() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Générer les cédules', 'Voulez-vous générer toutes les cédules ou une cédule spécifique ?', ui.ButtonSet.YES_NO_CANCEL);

  if (response == ui.Button.YES) {
    creerCedule();
  } else if (response == ui.Button.NO) {
    const choix = ui.prompt('Choisir une cédule', 'Entrez le type de cédule à générer (Principale, DS, ou Tech):', ui.ButtonSet.OK_CANCEL);
    if (choix.getSelectedButton() == ui.Button.OK) {
      const typeCedule = choix.getResponseText().toLowerCase();
      switch(typeCedule) {
        case 'principale':
          genererCedulePrincipale();
          break;
        case 'ds':
          genererCeduleDS();
          break;
        case 'tech':
          genererCeduleTech();
          break;
        default:
          ui.alert('Type de cédule non reconnu');
      }
    }
  }
}

function creerCedule() {
  try {
    Logger.info("Début de la création de la cédule");
    const CONSTANTS = initialiserConstantes();
    const donnees = initialiserDonnees(CONSTANTS);
    
    const planificateur = new Planificateur(
      donnees.ressourcesDS, 
      donnees.ressourcesTech, 
      donnees.vacances,
      CONSTANTS
    );
    
    const projetsPretraites = pretraiterProjets(donnees.projets, CONSTANTS);
    const projetsParPriorite = regrouperParPriorite(projetsPretraites, donnees.prioritesOrdre);
    
    Logger.info(`Capacité DS: ${donnees.capaciteDS}, Capacité Tech: ${donnees.capaciteTech}`);
    
    const cedule = planifierProjets(projetsParPriorite, donnees.prioritesOrdre, planificateur);
    
    // Ajouter l'appel à debugPlanification
    debugPlanification(cedule);
    
    if (cedule && cedule.length > 0) {
      const rapportGenerator = new RapportGenerator(SpreadsheetApp.getActiveSpreadsheet(), CONSTANTS);
      rapportGenerator.genererTousLesRapports(cedule);
      const chargeMensuelle = calculerChargeParMois(cedule); // Ajout ici
      const stats = afficherStatistiques(cedule, donnees.projetsBruts);
    } else {
      throw new Error("Aucun projet n'a été planifié");
    }
    
    Logger.info("Création de la cédule terminée avec succès");
    return cedule;
  } catch (e) {
    Logger.error("Erreur lors de la création de la cédule", e);
    throw e;
  }
}

function initialiserConstantes() {
  try {
    const params = chargerParametres();
    
    const CONSTANTS = {
      // Paramètres généraux
      HEURES_PAR_JOUR: params.general.HEURES_PAR_JOUR,
      JOURS_OUVRES_MOIS: params.general.JOURS_OUVRES_MOIS,
      TEMPS: {
        TAMPON: params.general.TAMPON
      },
      
      // Délais
      DELAI_MINIMUM_DESN_DEQP: params.delais.DELAI_MINIMUM_DESN_DEQP,
      DELAI_NISR: params.delais.DELAI_NISR,
      
      // Durées
      DUREES: params.durees,
      
      // Planning
      PLANNING: {
        MAX_MOIS: 18,
        HEURES_PAR_MOIS_DS: params.general.JOURS_OUVRES_MOIS * params.general.HEURES_PAR_JOUR,
        HEURES_PAR_MOIS_TECH: params.general.JOURS_OUVRES_MOIS * params.general.HEURES_PAR_JOUR,
        DELAI_ENTRE_PHASES: params.delais.DELAI_MINIMUM_DESN_DEQP
      },
      
      // Formats
      FORMATS: {
        DATE: "dd/MM/yyyy",
        NOMBRE: "0.0",
        POURCENTAGE: "0.0%"
      },
      
      // Couleurs
      COULEURS: {
        HEADER: "#000000",
        ALTERNANCE_1: "#f3f3f3",
        ALTERNANCE_2: "#ffffff",
        TEXTE_HEADER: "#ffffff"
      }
    };

    Logger.info("Constantes initialisées", CONSTANTS);
    return CONSTANTS;
  } catch (e) {
    Logger.error("Erreur lors de l'initialisation des constantes", e);
    throw e;
  }
}


function initialiserDonnees(CONSTANTS) {
  try {
    Logger.info("Initialisation des données");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetSuiviBIRI = ss.getSheetByName("suivi_biri");
    const sheetRessources = ss.getSheetByName("Ressources");
    const sheetPriorites = ss.getSheetByName("Priorités");
    const sheetVacances = ss.getSheetByName("Vacances");
    
    if (!sheetSuiviBIRI || !sheetRessources || !sheetPriorites || !sheetVacances) {
      throw new Error("Une ou plusieurs feuilles requises sont manquantes");
    }
    
    const ressourcesDS = sheetRessources.getRange("A2:A").getValues().flat().filter(String);
    const ressourcesTech = sheetRessources.getRange("B2:B").getValues().flat().filter(String);
    
    const prioritesOrdre = sheetPriorites.getRange("A2:A").getValues().flat().filter(String);
    
    const vacances = recupererVacances(sheetVacances);
    
    // Récupérer les données brutes et créer les projets
    const donneesBrutes = sheetSuiviBIRI.getDataRange().getValues().slice(1)
      .filter(row => row[0])
      .map(row => ({
        projet: row[0],
        reseau: Number(row[1]),
        sapHeaders: row[2],
        priorite: row[3],
        kickOffDAPP: row[5],
        technologie: row[6],
        dateRecue: row[7],
        dateNISR: row[8],
        directTechnicien: row[9],
        estComplexe: row[2].charAt(17) === "D"
      }));

    const projets = donneesBrutes.map(data => new Projet(data, CONSTANTS));

    // Calculer les capacités pour le mois en cours
    const capaciteDS = calculerCapaciteMensuelle(ressourcesDS.length, CONSTANTS);
    const capaciteTech = calculerCapaciteMensuelle(ressourcesTech.length, CONSTANTS);
    
    return {
      projets,
      projetsBruts: donneesBrutes,
      ressourcesDS,
      ressourcesTech,
      prioritesOrdre,
      vacances,
      capaciteDS,
      capaciteTech,
      nombreProjetsInitial: donneesBrutes.length
    };
  } catch (e) {
    Logger.error("Erreur lors de l'initialisation des données", e);
    throw e;
  }
}

// Version simple pour le calcul initial de la capacité
function calculerCapaciteMensuelle(nombreRessources, CONSTANTS) {
  try {
    // Calcul basé sur le nombre de ressources et les paramètres généraux
    const capaciteMensuelle = nombreRessources * 
                             CONSTANTS.HEURES_PAR_JOUR * 
                             CONSTANTS.JOURS_OUVRES_MOIS;
    
    Logger.debug(`Calcul capacité mensuelle:`, {
      nombreRessources: nombreRessources,
      heuresParJour: CONSTANTS.HEURES_PAR_JOUR,
      joursOuvresMois: CONSTANTS.JOURS_OUVRES_MOIS,
      capaciteMensuelle: capaciteMensuelle
    });

    return capaciteMensuelle;
  } catch (e) {
    Logger.error("Erreur lors du calcul de la capacité mensuelle", e);
    throw e;
  }
}

// Nouvelle fonction pour le calcul détaillé de la charge mensuelle
function calculerChargeParMois(cedule, CONSTANTS) {
  try {
    // Déterminer la période globale
    const dateDebut = new Date(Math.min(...cedule.flatMap(p => [p.dateDebutDESN, p.dateDebutDEQP].filter(Boolean))));
    const dateFin = new Date(Math.max(...cedule.flatMap(p => [p.dateFinDESN, p.dateFinDEQP].filter(Boolean))))

    // Initialiser la structure pour stocker les charges mensuelles
    const chargeMensuelle = {};
    
    // Parcourir tous les mois entre dateDebut et dateFin
    let currentDate = new Date(dateDebut.getFullYear(), dateDebut.getMonth(), 1);
    const lastDate = new Date(dateFin.getFullYear(), dateFin.getMonth() + 1, 0);

    while (currentDate <= lastDate) {
      const moisKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      chargeMensuelle[moisKey] = {
        'DS': {
          heuresDisponibles: CONSTANTS.PLANNING.HEURES_PAR_MOIS_DS,
          heuresAllouees: 0,
          utilisation: 0,
          heuresTampon: 0
        },
        'Tech': {
          heuresDisponibles: CONSTANTS.PLANNING.HEURES_PAR_MOIS_TECH,
          heuresAllouees: 0,
          utilisation: 0,
          heuresTampon: 0
        }
      };

      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Calculer les heures allouées pour chaque projet
    cedule.forEach(projet => {
      if (projet.dateDebutDESN && projet.dateFinDESN) {
        const moisDebut = new Date(projet.dateDebutDESN.getFullYear(), projet.dateDebutDESN.getMonth(), 1);
        const moisFin = new Date(projet.dateFinDESN.getFullYear(), projet.dateFinDESN.getMonth() + 1, 0);
        
        let currentMonth = new Date(moisDebut);
        while (currentMonth <= moisFin) {
          const moisKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
          if (chargeMensuelle[moisKey]) {
            chargeMensuelle[moisKey]['DS'].heuresAllouees += projet.dureeDESN;
          }
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      }

      if (projet.dateDebutDEQP && projet.dateFinDEQP) {
        const moisDebut = new Date(projet.dateDebutDEQP.getFullYear(), projet.dateDebutDEQP.getMonth(), 1);
        const moisFin = new Date(projet.dateFinDEQP.getFullYear(), projet.dateFinDEQP.getMonth() + 1, 0);
        
        let currentMonth = new Date(moisDebut);
        while (currentMonth <= moisFin) {
          const moisKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
          if (chargeMensuelle[moisKey]) {
            chargeMensuelle[moisKey]['Tech'].heuresAllouees += projet.dureeDEQP;
          }
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      }
    });

    // Calculer les pourcentages d'utilisation et le tampon
    Object.values(chargeMensuelle).forEach(mois => {
      ['DS', 'Tech'].forEach(type => {
        const charge = mois[type];
        charge.utilisation = charge.heuresAllouees / charge.heuresDisponibles;
        charge.heuresTampon = charge.heuresAllouees * CONSTANTS.TEMPS.TAMPON;
      });
    });

    return chargeMensuelle;
  } catch (e) {
    Logger.error("Erreur lors du calcul de la charge par mois", e);
    throw e;
  }
}

function recupererProjets(sheetSuiviBIRI, CONSTANTS) {
  const donnees = sheetSuiviBIRI.getDataRange().getValues();
  const headers = donnees[0];
  return donnees.slice(1)
    .filter(row => row[0])
    .map(row => new Projet({
      projet: row[0],
      reseau: Number(row[1]),
      sapHeaders: row[2],
      priorite: row[3],
      kickOffDAPP: row[5],
      technologie: row[6],
      dateRecue: row[7],
      dateNISR: row[8],
      directTechnicien: row[9],
      estComplexe: row[2].charAt(17) === "D"
    }, CONSTANTS));
}

function pretraiterProjets(projets) {
  try {
    Logger.info("Début du prétraitement des projets");
    const projetsGroupes = {};
    
    projets.forEach(projet => {
      if (!projetsGroupes[projet.id]) {
        projetsGroupes[projet.id] = projet;
      } else {
        projetsGroupes[projet.id].reseaux.push(...projet.reseaux);
        projetsGroupes[projet.id].dureeDESN += projet.dureeDESN;
        projetsGroupes[projet.id].dureeDEQP += projet.dureeDEQP;
      }
    });

    const projetsTraites = Object.values(projetsGroupes);
    Logger.info(`Prétraitement terminé: ${projetsTraites.length} projets traités`);
    return projetsTraites;
  } catch (e) {
    Logger.error("Erreur lors du prétraitement des projets", e);
    throw e;
  }
}

function regrouperParPriorite(projets, prioritesOrdre) {
  try {
    Logger.info("Regroupement des projets par priorité");
    var projetsParPriorite = {};
    
    prioritesOrdre.concat(["Non défini"]).forEach(function(priorite) {
      projetsParPriorite[priorite] = [];
    });
    
    projets.forEach(function(projet) {
      var priorite = projet.priorite;
      if (!priorite || !projetsParPriorite.hasOwnProperty(priorite)) {
        priorite = "Non défini";
      }
      projetsParPriorite[priorite].push(projet);
    });
    
    Object.keys(projetsParPriorite).forEach(function(priorite) {
      projetsParPriorite[priorite].sort(function(a, b) {
        // Si les deux projets ont une date fin cible, on les compare
        if (a.dateFinCible && b.dateFinCible) return a.dateFinCible - b.dateFinCible;
        // Si seulement a a une date fin cible, il est prioritaire
        if (a.dateFinCible) return -1;
        // Si seulement b a une date fin cible, il est prioritaire
        if (b.dateFinCible) return 1;
        // Si aucun n'a de date fin cible, on compare les dates reçues
        if (a.dateRecue && b.dateRecue) return a.dateRecue - b.dateRecue;
        // Si seulement a a une date reçue, il est prioritaire
        if (a.dateRecue) return -1;
        // Si seulement b a une date reçue, il est prioritaire
        if (b.dateRecue) return 1;
        // Si aucune date n'est disponible, on ne change pas l'ordre
        return 0;
      });
      
      Logger.info("Priorité " + priorite + ": " + projetsParPriorite[priorite].length + " projets");
    });
    
    return projetsParPriorite;
  } catch (e) {
    Logger.error("Erreur lors du regroupement par priorité", e);
    throw e;
  }
}



function planifierProjets(projetsParPriorite, prioritesOrdre, planificateur) {
  try {
    Logger.info("Début de la planification des projets");
    const ceduleFinale = [];
    
    for (const priorite of prioritesOrdre) {
      const projets = projetsParPriorite[priorite] || [];
      Logger.info(`Traitement des projets de priorité ${priorite}: ${projets.length} projets`);
      
      for (const projet of projets) {
        try {
          const resultat = planificateur.planifierProjet(projet);
          if (resultat) {
            ceduleFinale.push(resultat);
          }
        } catch (e) {
          Logger.error(`Erreur planification ${projet.id}`, e);
        }
      }
    }
    
    // Planifier les projets sans priorité définie
    const projetsNonDefinis = projetsParPriorite["Non défini"] || [];
    Logger.info(`Traitement des projets sans priorité: ${projetsNonDefinis.length} projets`);
    
    for (const projet of projetsNonDefinis) {
      try {
        const resultat = planificateur.planifierProjet(projet);
        if (resultat) {
          ceduleFinale.push(resultat);
        }
      } catch (e) {
        Logger.error(`Erreur planification ${projet.id}`, e);
      }
    }
    
    Logger.info(`Planification terminée: ${ceduleFinale.length} projets planifiés`);
    return ceduleFinale;
  } catch (e) {
    Logger.error("Erreur lors de la planification des projets", e);
    throw e;
  }
}

function afficherStatistiques(cedule, donneesBrutes) {
  try {
    Logger.info("Calcul des statistiques");
    
    const stats = {
      global: {
        nombreProjetsUniques: new Set(cedule.map(p => p.id)).size,
        nombreReseauxTotal: cedule.reduce((total, p) => total + p.reseaux.length, 0),
        nombreProjetsInitial: Array.isArray(donneesBrutes) ? new Set(donneesBrutes.map(d => d.projet)).size : 'N/A',
        nombreReseauxInitial: Array.isArray(donneesBrutes) ? donneesBrutes.length : 'N/A',
        heuresDESNTotal: cedule.reduce((total, p) => total + (p.dureeDESN || 0), 0),
        heuresDEQPTotal: cedule.reduce((total, p) => total + (p.dureeDEQP || 0), 0),
        dateDebutGlobale: new Date(Math.min(...cedule.flatMap(p => [p.dateDebutDESN, p.dateDebutDEQP].filter(Boolean)))),
        dateFinGlobale: new Date(Math.max(...cedule.flatMap(p => [p.dateFinDESN, p.dateFinDEQP].filter(Boolean))))
      },
      ressources: {}
    };

    // Calculer les statistiques par ressource
    cedule.forEach(projet => {
      // Pour DS
      if (projet.dsAssigne) {
        if (!stats.ressources[projet.dsAssigne]) {
          stats.ressources[projet.dsAssigne] = {
            type: 'DS',
            projets: new Set(),
            reseaux: 0,
            heures: 0,
            dateDebut: null,
            dateFin: null
          };
        }
        const ressourceDS = stats.ressources[projet.dsAssigne];
        ressourceDS.projets.add(projet.id);
        ressourceDS.reseaux += projet.reseaux.length;
        ressourceDS.heures += projet.dureeDESN;
        ressourceDS.dateDebut = ressourceDS.dateDebut ? 
          new Date(Math.min(ressourceDS.dateDebut, projet.dateDebutDESN)) : 
          projet.dateDebutDESN;
        ressourceDS.dateFin = ressourceDS.dateFin ? 
          new Date(Math.max(ressourceDS.dateFin, projet.dateFinDESN)) : 
          projet.dateFinDESN;
      }

      // Pour Tech
      if (projet.techAssigne) {
        if (!stats.ressources[projet.techAssigne]) {
          stats.ressources[projet.techAssigne] = {
            type: 'Tech',
            projets: new Set(),
            reseaux: 0,
            heures: 0,
            dateDebut: null,
            dateFin: null
          };
        }
        const ressourceTech = stats.ressources[projet.techAssigne];
        ressourceTech.projets.add(projet.id);
        ressourceTech.reseaux += projet.reseaux.length;
        ressourceTech.heures += projet.dureeDEQP;
        ressourceTech.dateDebut = ressourceTech.dateDebut ? 
          new Date(Math.min(ressourceTech.dateDebut, projet.dateDebutDEQP)) : 
          projet.dateDebutDEQP;
        ressourceTech.dateFin = ressourceTech.dateFin ? 
          new Date(Math.max(ressourceTech.dateFin, projet.dateFinDEQP)) : 
          projet.dateFinDEQP;
      }
    });

    // Calculer les pourcentages d'utilisation
    Object.values(stats.ressources).forEach(ressource => {
      const joursOuvres = DateManager.calculerNombreJoursOuvres(
        ressource.dateDebut,
        ressource.dateFin
      );
      const heuresDisponibles = joursOuvres * CONSTANTS.HEURES_PAR_JOUR;
      ressource.utilisation = ressource.heures / heuresDisponibles;
    });

    // Générer le rapport dans la feuille de calcul
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetStats = ss.getSheetByName("Statistiques") || ss.insertSheet("Statistiques");
    sheetStats.clear();

    // En-têtes et données globales
    let row = 1;
    sheetStats.getRange(row++, 1).setValue("Statistiques globales");
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Nombre de projets planifiés", stats.global.nombreProjetsUniques]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Nombre total de réseaux", stats.global.nombreReseauxTotal]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Nombre de projets initial", stats.global.nombreProjetsInitial]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Nombre de réseaux initial", stats.global.nombreReseauxInitial]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Total des heures DESN", stats.global.heuresDESNTotal.toFixed(1)]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Total des heures DEQP", stats.global.heuresDEQPTotal.toFixed(1)]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Date de début globale", DateManager.formatDate(stats.global.dateDebutGlobale)]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Date de fin globale", DateManager.formatDate(stats.global.dateFinGlobale)]]);

    row += 2;

    // En-têtes statistiques par ressource
    const headers = ["Statistiques par ressource", "Projets", "Réseaux", "Heures", "Période", "Utilisation"];
    sheetStats.getRange(row++, 1, 1, 6).setValues([headers]);

    // Données des ressources
    Object.entries(stats.ressources).forEach(([nom, ressource]) => {
      const periode = `${DateManager.formatDate(ressource.dateDebut)} - ${DateManager.formatDate(ressource.dateFin)}`;
      sheetStats.getRange(row++, 1, 1, 6).setValues([[
        `${nom} (${ressource.type})`,
        ressource.projets.size,
        ressource.reseaux,
        ressource.heures.toFixed(1),
        periode,
        `${(ressource.utilisation * 100).toFixed(1)}%`
      ]]);
    });

    // Formatage
    sheetStats.autoResizeColumns(1, 6);

    return stats;
  } catch (e) {
    Logger.error("Erreur lors du calcul des statistiques", e);
    throw e;
  }
}

function calculerStatistiques(cedule) {
  // Initialisation des statistiques globales
  const stats = {
    global: {
      nombreProjetsUniques: new Set(cedule.map(p => p.id)).size,
      nombreReseauxTotal: cedule.reduce((total, p) => total + p.reseaux.length, 0),
      nombreProjetsInitial: cedule.length,
      heuresDESNTotal: cedule.reduce((total, p) => total + (p.dureeDESN || 0), 0),
      heuresDEQPTotal: cedule.reduce((total, p) => total + (p.dureeDEQP || 0), 0),
      dateDebutGlobale: new Date(Math.min(...cedule.flatMap(p => [p.dateDebutDESN, p.dateDebutDEQP].filter(Boolean)))),
      dateFinGlobale: new Date(Math.max(...cedule.flatMap(p => [p.dateFinDESN, p.dateFinDEQP].filter(Boolean))))
    },
    ressources: {}
  };

  // Calculer les statistiques par ressource
  cedule.forEach(projet => {
    // Pour DS
    if (projet.dsAssigne) {
      if (!stats.ressources[`${projet.dsAssigne} (DS)`]) {
        stats.ressources[`${projet.dsAssigne} (DS)`] = {
          type: 'DS',
          projets: new Set(),
          reseaux: 0,
          heures: 0,
          dateDebut: null,
          dateFin: null
        };
      }
      const ressourceDS = stats.ressources[`${projet.dsAssigne} (DS)`];
      ressourceDS.projets.add(projet.id);
      ressourceDS.reseaux += projet.reseaux.length;
      ressourceDS.heures += projet.dureeDESN;
      ressourceDS.dateDebut = ressourceDS.dateDebut ? 
        new Date(Math.min(ressourceDS.dateDebut, projet.dateDebutDESN)) : 
        projet.dateDebutDESN;
      ressourceDS.dateFin = ressourceDS.dateFin ? 
        new Date(Math.max(ressourceDS.dateFin, projet.dateFinDESN)) : 
        projet.dateFinDESN;
    }

    // Pour Tech
    if (projet.techAssigne) {
      if (!stats.ressources[`${projet.techAssigne} (Tech)`]) {
        stats.ressources[`${projet.techAssigne} (Tech)`] = {
          type: 'Tech',
          projets: new Set(),
          reseaux: 0,
          heures: 0,
          dateDebut: null,
          dateFin: null
        };
      }
      const ressourceTech = stats.ressources[`${projet.techAssigne} (Tech)`];
      ressourceTech.projets.add(projet.id);
      ressourceTech.reseaux += projet.reseaux.length;
      ressourceTech.heures += projet.dureeDEQP;
      ressourceTech.dateDebut = ressourceTech.dateDebut ? 
        new Date(Math.min(ressourceTech.dateDebut, projet.dateDebutDEQP)) : 
        projet.dateDebutDEQP;
      ressourceTech.dateFin = ressourceTech.dateFin ? 
        new Date(Math.max(ressourceTech.dateFin, projet.dateFinDEQP)) : 
        projet.dateFinDEQP;
    }
  });

  // Calculer les pourcentages d'utilisation
  Object.values(stats.ressources).forEach(ressource => {
    const joursOuvres = DateManager.calculerNombreJoursOuvres(
      ressource.dateDebut,
      ressource.dateFin
    );
    const heuresDisponibles = joursOuvres * CONSTANTS.HEURES_PAR_JOUR;
    ressource.utilisation = ressource.heures / heuresDisponibles;
  });

  return stats;
}

function calculerHeuresDisponiblesPeriode(dateDebut, dateFin, type, CONSTANTS) {
  let heuresDisponibles = 0;
  let dateCourante = new Date(dateDebut);
  dateCourante.setDate(1); // Premier jour du mois

  const capaciteMensuelle = type === 'DS' ? 
    CONSTANTS.PLANNING.HEURES_PAR_MOIS_DS : 
    CONSTANTS.PLANNING.HEURES_PAR_MOIS_TECH;

  while (dateCourante <= dateFin) {
    // Pour le premier mois
    if (dateCourante.getMonth() === dateDebut.getMonth() && 
        dateCourante.getFullYear() === dateDebut.getFullYear()) {
      const joursOuvrablesRestants = DateManager.calculerNombreJoursOuvres(
        dateDebut,
        new Date(dateDebut.getFullYear(), dateDebut.getMonth() + 1, 0)
      );
      const joursOuvrablesMois = DateManager.calculerNombreJoursOuvres(
        new Date(dateDebut.getFullYear(), dateDebut.getMonth(), 1),
        new Date(dateDebut.getFullYear(), dateDebut.getMonth() + 1, 0)
      );
      heuresDisponibles += (joursOuvrablesRestants / joursOuvrablesMois) * capaciteMensuelle;
    }
    // Pour le dernier mois
    else if (dateCourante.getMonth() === dateFin.getMonth() && 
             dateCourante.getFullYear() === dateFin.getFullYear()) {
      const joursOuvrablesUtilises = DateManager.calculerNombreJoursOuvres(
        new Date(dateFin.getFullYear(), dateFin.getMonth(), 1),
        dateFin
      );
      const joursOuvrablesMois = DateManager.calculerNombreJoursOuvres(
        new Date(dateFin.getFullYear(), dateFin.getMonth(), 1),
        new Date(dateFin.getFullYear(), dateFin.getMonth() + 1, 0)
      );
      heuresDisponibles += (joursOuvrablesUtilises / joursOuvrablesMois) * capaciteMensuelle;
    }
    // Pour les mois complets
    else {
      heuresDisponibles += capaciteMensuelle;
    }

    dateCourante.setMonth(dateCourante.getMonth() + 1);
  }

  return heuresDisponibles;
}

function ecrireStatistiquesDansFeuille(stats) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Statistiques");
  if (!sheet) {
    sheet = ss.insertSheet("Statistiques");
  }
  sheet.clear();

  // Écrire les statistiques dans la feuille
  let row = 1;
  sheet.getRange(row++, 1, 1, 2).setValues([["Statistiques de planification", ""]]);
  sheet.getRange(row++, 1, 1, 2).setValues([["Nombre de projets planifiés", stats.nombreProjetsUniques]]);
  sheet.getRange(row++, 1, 1, 2).setValues([["Nombre total de réseaux", stats.nombreReseauxTotal]]);
  sheet.getRange(row++, 1, 1, 2).setValues([["Nombre initial de projets", stats.nombreProjetsInitial]]);
  sheet.getRange(row++, 1, 1, 2).setValues([["Total des heures DESN", stats.heuresDESNTotal]]);
  sheet.getRange(row++, 1, 1, 2).setValues([["Total des heures DEQP", stats.heuresDEQPTotal]]);
  
  // Ajouter d'autres statistiques ici...

  Logger.info("Statistiques écrites dans la feuille 'Statistiques'");
}

function genererMessageStatistiques(stats) {
  let message = "Statistiques de planification :\n\n";
  
  // Statistiques globales
  message += "=== STATISTIQUES GLOBALES ===\n";
  message += `Nombre de projets planifiés : ${stats.global.nombreProjetsUniques}\n`;
  message += `Nombre total de réseaux : ${stats.global.nombreReseauxTotal}\n`;
  message += `Nombre initial de projets : ${stats.global.nombreProjetsInitial}\n`;
  message += `Total des heures DESN : ${stats.global.heuresDESNTotal.toFixed(1)}\n`;
  message += `Total des heures DEQP : ${stats.global.heuresDEQPTotal.toFixed(1)}\n`;
  message += `Date de début globale : ${DateManager.formatDate(stats.global.dateDebutGlobale)}\n`;
  message += `Date de fin globale : ${DateManager.formatDate(stats.global.dateFinGlobale)}\n\n`;

  // Statistiques par ressource
  message += "=== STATISTIQUES PAR RESSOURCE ===\n";
  Object.entries(stats.ressources).forEach(([nom, ressource]) => {
    message += `\n${nom} (${ressource.type}):\n`;
    message += `- Projets uniques : ${ressource.nombreProjetsUniques}\n`;
    message += `- Réseaux traités : ${ressource.reseaux}\n`;
    message += `- Heures ${ressource.type === 'DS' ? 'DESN' : 'DEQP'} : ${(ressource.type === 'DS' ? ressource.heuresDESN : ressource.heuresDEQP).toFixed(1)}\n`;
    message += `- Période : ${DateManager.formatDate(ressource.dateDebut)} - ${DateManager.formatDate(ressource.dateFin)}\n`;
    message += `- Utilisation : ${(ressource.pourcentageUtilisation * 100).toFixed(1)}%\n`;
  });

  return message;
}

function ajouterStatistiquesAuRapport(stats) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetStats = ss.getSheetByName("Statistiques") || ss.insertSheet("Statistiques");
    sheetStats.clear();
    
    let row = 1;
    
    // Statistiques globales
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Statistiques globales", ""]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Nombre de projets planifiés", stats.global.nombreProjetsUniques]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Nombre total de réseaux", stats.global.nombreReseauxTotal]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Nombre initial de projets", stats.global.nombreProjetsInitial]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Total des heures DESN", stats.global.heuresDESNTotal.toFixed(1)]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Total des heures DEQP", stats.global.heuresDEQPTotal.toFixed(1)]]);
    
    // Formater les dates pour l'affichage
    const dateDebut = DateManager.formatDate(stats.global.dateDebutGlobale);
    const dateFin = DateManager.formatDate(stats.global.dateFinGlobale);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Date de début globale", dateDebut]]);
    sheetStats.getRange(row++, 1, 1, 2).setValues([["Date de fin globale", dateFin]]);

    row++; // Ligne vide

    // Statistiques par ressource
    sheetStats.getRange(row++, 1, 1, 6).setValues([["Statistiques par ressource", "Projets", "Réseaux", "Heures", "Période", "Utilisation"]]);
    
    Object.entries(stats.ressources).forEach(([nom, ressource]) => {
    const periode = `${DateManager.formatDate(stats.global.dateDebutGlobale)} - ${DateManager.formatDate(stats.global.dateFinGlobale)}`;
    sheetStats.getRange(row++, 1, 1, 6).setValues([[
      `${nom} (${ressource.type})`,
      ressource.nombreProjetsUniques,
      ressource.reseaux,
      ressource.heures.toFixed(1),
      periode,
      (ressource.pourcentageUtilisation * 100).toFixed(1) + "%"
    ]]);
  
  });


    // Formatage
    const range = sheetStats.getRange(1, 1, row-1, 6);
    range.setBorder(true, true, true, true, true, true);
    range.setHorizontalAlignment("center");
    
    // Format des en-têtes
    sheetStats.getRange(1, 1, 1, 6).setBackground(CONSTANTS.COULEURS.HEADER)
                                   .setFontColor(CONSTANTS.COULEURS.TEXTE_HEADER)
                                   .setFontWeight("bold");
    sheetStats.getRange(10, 1, 1, 6).setBackground(CONSTANTS.COULEURS.HEADER)
                                    .setFontColor(CONSTANTS.COULEURS.TEXTE_HEADER)
                                    .setFontWeight("bold");

    // Ajuster les largeurs de colonnes
    sheetStats.autoResizeColumns(1, 6);
    
    // S'assurer que les colonnes numériques sont au bon format
    if (row > 11) { // S'il y a des données dans la section ressources
      sheetStats.getRange(11, 2, row-11, 1).setNumberFormat("0"); // Format nombre entier pour la colonne Projets
      sheetStats.getRange(11, 3, row-11, 1).setNumberFormat("0"); // Format nombre entier pour la colonne Réseaux
      sheetStats.getRange(11, 4, row-11, 1).setNumberFormat("0.0"); // Format décimal pour la colonne Heures
    }
    
    Logger.info("Statistiques écrites dans la feuille 'Statistiques'");
    
  } catch (e) {
    Logger.error("Erreur lors de l'ajout des statistiques au rapport", e);
    throw e;
  }
}

function importerSuiviBIRI() {
  const sourceFileId = "1qZ0h1k6HsYnTpeCxvqIdZJHGwfBtGcBrhlVLyoy5awg";
  const dateFileId = "18VaMsyAzpm6J0sOwFiD1oAEt-zgcUEdBTcBsOkTYvCw";
  
  // Initialiser les maps
  const dateMap = {};
  const dateNISRMap = {};
  const directTechnicienMap = {};
  const desnRequisMap = {};
  
  try {
    Logger.info("Début de l'importation du suivi BIRI");
    
    const sourceFile = SpreadsheetApp.openById(sourceFileId);
    const sourceSheet = sourceFile.getSheetByName("Suivi_BIRI");
    
    const dateFile = SpreadsheetApp.openById(dateFileId);
    const dateSheet = dateFile.getSheetByName("Feuille 1");
    
    if (!sourceSheet || !dateSheet) {
      throw new Error("Feuilles source non trouvées");
    }
    
    // Récupération des données de dates
    const dateHeaders = dateSheet.getRange("1:1").getValues()[0];
    const dateData = dateSheet.getRange("B:P").getValues();
    
    // Création des maps pour les dates
    dateData.forEach(row => {
      if (row[0]) {
        dateMap[row[0]] = row[6] || "";            // Date reçue
        dateNISRMap[row[0]] = row[7] || "";        // Date NISR
        directTechnicienMap[row[0]] = row[14] || ""; // Direct Technicien
        desnRequisMap[row[0]] = row[12] || "";     // DESN Requis (colonne M - date)
      }
    });
    
    // Récupération des données source
    const sourceData = sourceSheet.getRange("A5:AJ" + sourceSheet.getLastRow()).getValues();
    
    // Transformation des données
    const filteredData = sourceData
      .filter(row => row[0] && (!row[35] || row[35].toLowerCase() === "en cours"))
      .map(row => {
        const projet = row[0];
        return [
          projet,                         // Projet
          row[1],                        // Réseau
          row[2],                        // SAP Headers
          row[3],                        // Priorité
          row[12],                       // Date Kick-Off
          row[15],                       // DAPP KO
          row[21],                       // Technologie
          dateMap[projet] || "",         // Date reçue
          dateNISRMap[projet] || "",     // Date NISR
          directTechnicienMap[projet] || "", // Direct Technicien
          desnRequisMap[projet] || ""    // DESN Requis (date)
        ];
      });
    
    // Écriture des données dans la feuille de destination
    if (filteredData.length > 0) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const destSheet = ss.getSheetByName("suivi_biri") || ss.insertSheet("suivi_biri");
      destSheet.clear();
      
      // Nouveaux en-têtes avec les noms corrects
      const headers = [
        "Projet", 
        "Réseau", 
        "SAP Headers", 
        "Priorité",
        "Date Kick-Off",
        "DAPP KO",
        "Technologie",
        "Date reçue", 
        "Date NISR", 
        "Direct Technicien",
        "DESN Requis"
      ];
      
      destSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      destSheet.getRange(2, 1, filteredData.length, headers.length).setValues(filteredData);
      
      // Formatage des en-têtes
      const headerRange = destSheet.getRange(1, 1, 1, headers.length);
      headerRange
        .setBackground("#000000")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle")
        .setWrap(true);

      // Formatage des colonnes de dates (colonnes 5, 6, 8, 9 et 11)
      const dateColumns = [5, 6, 8, 9, 11];  // Ajout de la colonne 11 (DESN Requis)
      dateColumns.forEach(col => {
        if (filteredData.length > 0) {
          destSheet.getRange(2, col, filteredData.length, 1).setNumberFormat("dd/MM/yyyy");
        }
      });

      destSheet.setFrozenRows(1);
      destSheet.autoResizeColumns(1, headers.length);
      
      Logger.info(`Import terminé avec succès. ${filteredData.length} lignes importées.`);
    } else {
      Logger.info("Aucune donnée à importer.");
    }
    
  } catch (e) {
    Logger.error("Erreur lors de l'import du suivi BIRI", e);
    throw e;
  }
}

// Point d'entrée principal
function main() {
  try {
    importerSuiviBIRI();
    creerCedule();
  } catch (e) {
    Logger.error("Erreur dans l'exécution principale", e);
    SpreadsheetApp.getUi().alert("Une erreur est survenue lors de l'exécution. Veuillez consulter les logs pour plus de détails.");
  }
}

// Fonction pour créer le menu dans Google Sheets
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Cedule BIRI')
      .addItem('Importer données BIRI', 'importerSuiviBIRIAvecConfirmation')
      .addSeparator()
      .addItem('Créer cédule', 'creerCeduleAvecConfirmation')
      .addToUi();
}

function creerFeuilleParametres() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetParams = ss.getSheetByName("Paramètres");
  
  if (!sheetParams) {
    sheetParams = ss.insertSheet("Paramètres");
  }
  
  // Définir les valeurs par défaut
  const parametres = [
    ["Paramètres Généraux", "Valeur", "Description"],
    ["Heures par jour", 7.5, "Nombre d'heures travaillées par jour"],
    ["Jours ouvrés par mois", 21, "Nombre de jours ouvrés par mois"],
    ["Pourcentage capacité", 0.8, "Pourcentage de capacité utilisable (80%)"],
    ["Tampon entre projets", 0.2, "Pourcentage de tampon entre les projets"],
    [""],
    ["Délais", "Valeur", "Description"],
    ["DESN-DEQP minimum", 10, "Délai minimum entre DESN et DEQP"],
    ["NISR", 110, "Délai pour NISR"],
    ["Entre phases", 10, "Délai entre les phases"],
    [""],
    ["Durées DESN", "Simple", "Complexe", "Description"],
    ["Durée", 4, 15, "Durée en heures par réseau"],
    [""],
    ["Durées DEQP", "Simple", "Complexe", "Description"],
    ["Durée", 5, 15, "Durée en heures par réseau"],
    [""],
    ["Capacités Mensuelles", "Heures Base", "% Disponible", "Heures Effectives", "Description"],
    ["DS", 472.5, 0.8, "=B19*C19", "Capacité mensuelle DS"],
    ["Tech", 630, 0.8, "=B20*C20", "Capacité mensuelle Tech"],
    [""],
    ["Période de Planification", "Valeur", "Description"],
    ["Mois max", 24, "Nombre maximum de mois pour la planification"]
  ];

  // Écrire les valeurs
  sheetParams.clear();
  sheetParams.getRange(1, 1, parametres.length, 5).setValues(parametres.map(row => {
    while (row.length < 5) row.push(""); // Ajouter des cellules vides si nécessaire
    return row;
  }));

  // Formater la feuille
  sheetParams.getRange(1, 1, 1, 5).setBackground("#000000").setFontColor("#ffffff");
  sheetParams.getRange(7, 1, 1, 5).setBackground("#000000").setFontColor("#ffffff");
  sheetParams.getRange(12, 1, 1, 5).setBackground("#000000").setFontColor("#ffffff");
  sheetParams.getRange(15, 1, 1, 5).setBackground("#000000").setFontColor("#ffffff");
  sheetParams.getRange(18, 1, 1, 5).setBackground("#000000").setFontColor("#ffffff");
  sheetParams.getRange(22, 1, 1, 5).setBackground("#000000").setFontColor("#ffffff");

  // Ajuster les largeurs de colonnes
  sheetParams.setColumnWidth(1, 200);
  sheetParams.setColumnWidth(2, 150);
  sheetParams.setColumnWidth(3, 150);
  sheetParams.setColumnWidth(4, 150);
  sheetParams.setColumnWidth(5, 300);

  // Protéger la feuille sauf les cellules de valeurs
  const protection = sheetParams.protect();
  const range = sheetParams.getRange("B2:D24"); // Plage des valeurs modifiables
  protection.setUnprotectedRanges([range]);

  Logger.info("Feuille de paramètres créée avec les valeurs par défaut");
}

function chargerParametres() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetParams = ss.getSheetByName("Paramètres");
  
  if (!sheetParams) {
    Logger.info("La feuille Paramètres n'existe pas. Création en cours...");
    creerFeuilleParametres();
    throw new Error("La feuille Paramètres a été créée. Veuillez vérifier les valeurs avant de continuer.");
  }

  try {
    Logger.info("Extraction des paramètres...");
    const params = extraireParametres(sheetParams);
    Logger.info("Paramètres extraits :", params);

    if (!params || typeof params !== 'object') {
      throw new Error("Les paramètres extraits ne sont pas valides");
    }

    Logger.info("Validation des paramètres...");
    const validation = validerParametres(params);
    
    if (!validation.valide) {
      const messageErreur = "Erreurs dans les paramètres:\n" + validation.erreurs.join("\n");
      Logger.error(messageErreur);
      throw new Error(messageErreur);
    }

    Logger.info("Paramètres chargés et validés avec succès");
    return params;
  } catch (e) {
    Logger.error("Erreur lors du chargement des paramètres", e);
    throw e;
  }
}

function testerParametres() {
  try {
    Logger.info("=== Test des paramètres ===");
    
    // 1. Créer/réinitialiser la feuille de paramètres
    Logger.info("1. Création de la feuille de paramètres");
    creerFeuilleParametres();
    
    // 2. Charger les paramètres
    Logger.info("2. Chargement des paramètres");
    const params = chargerParametres();
    Logger.info("Paramètres chargés avec succès:", params);
    
    return "Test des paramètres réussi";
  } catch (e) {
    Logger.error("Erreur lors du test des paramètres", e);
    return `Erreur : ${e.message}`;
  }
}

function extraireParametres(sheetParams) {
  try {
    Logger.info("Début de l'extraction des paramètres");

    const params = {
      general: {
        HEURES_PAR_JOUR: Number(sheetParams.getRange("B2").getValue()),
        JOURS_OUVRES_MOIS: Number(sheetParams.getRange("B3").getValue()),
        TAMPON: Number(sheetParams.getRange("B4").getValue())
      },
      delais: {
        DELAI_MINIMUM_DESN_DEQP: Number(sheetParams.getRange("B7").getValue()),
        DELAI_NISR: Number(sheetParams.getRange("B8").getValue())
      },
      durees: {
        DESN: {
          SIMPLE: Number(sheetParams.getRange("B11").getValue()),
          COMPLEXE: Number(sheetParams.getRange("C11").getValue())
        },
        DEQP: {
          SIMPLE: Number(sheetParams.getRange("B14").getValue()),
          COMPLEXE: Number(sheetParams.getRange("C14").getValue())
        }
      }
    };

    return params;
  } catch (e) {
    Logger.error("Erreur lors de l'extraction des paramètres", e);
    throw e;
  }
}

function validerParametres(params) {
  const erreurs = [];

  // Validation des paramètres généraux
  if (params.general.HEURES_PAR_JOUR <= 0 || params.general.HEURES_PAR_JOUR > 24) {
    erreurs.push("Les heures par jour doivent être comprises entre 0 et 24");
  }
  if (params.general.JOURS_OUVRES_MOIS <= 0 || params.general.JOURS_OUVRES_MOIS > 31) {
    erreurs.push("Les jours ouvrés par mois doivent être compris entre 0 et 31");
  }
  if (params.general.TAMPON < 0 || params.general.TAMPON > 1) {
    erreurs.push("Le tampon doit être compris entre 0 et 1");
  }

  // Validation des délais
  if (params.delais.DELAI_MINIMUM_DESN_DEQP < 0) {
    erreurs.push("Le délai minimum DESN-DEQP ne peut pas être négatif");
  }
  if (params.delais.DELAI_NISR < 0) {
    erreurs.push("Le délai NISR ne peut pas être négatif");
  }

  // Validation des durées
  if (params.durees.DESN.SIMPLE <= 0 || params.durees.DESN.COMPLEXE <= 0) {
    erreurs.push("Les durées DESN doivent être positives");
  }
  if (params.durees.DEQP.SIMPLE <= 0 || params.durees.DEQP.COMPLEXE <= 0) {
    erreurs.push("Les durées DEQP doivent être positives");
  }

  return {
    valide: erreurs.length === 0,
    erreurs: erreurs
  };
}


function verifierFeuillesNecessaires() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const feuillesNecessaires = ["suivi_biri", "Ressources", "Priorités", "Vacances"];
    const rapport = {};

    feuillesNecessaires.forEach(nomFeuille => {
      const feuille = ss.getSheetByName(nomFeuille);
      if (feuille) {
        const nombreLignes = feuille.getLastRow();
        const nombreColonnes = feuille.getLastColumn();
        const contientDonnees = nombreLignes > 1; // Plus d'une ligne (en-têtes)
        rapport[nomFeuille] = {
          present: true,
          lignes: nombreLignes,
          colonnes: nombreColonnes,
          contientDonnees: contientDonnees
        };
      } else {
        rapport[nomFeuille] = {
          present: false,
          lignes: 0,
          colonnes: 0,
          contientDonnees: false
        };
      }
    });

    Logger.info("Rapport des feuilles nécessaires :", rapport);
    
    // Vérifier si toutes les feuilles sont présentes et contiennent des données
    const feuillesManquantes = [];
    const feuillesVides = [];
    
    Object.entries(rapport).forEach(([nom, info]) => {
      if (!info.present) {
        feuillesManquantes.push(nom);
      } else if (!info.contientDonnees) {
        feuillesVides.push(nom);
      }
    });

    if (feuillesManquantes.length > 0) {
      throw new Error(`Feuilles manquantes : ${feuillesManquantes.join(", ")}`);
    }
    if (feuillesVides.length > 0) {
      throw new Error(`Feuilles sans données : ${feuillesVides.join(", ")}`);
    }

    return rapport;
  } catch (e) {
    Logger.error("Erreur lors de la vérification des feuilles", e);
    throw e;
  }
}

function verifierCoherenceDonnees(donnees, CONSTANTS) {
  const erreurs = [];

  // Vérifier les ressources
  if (donnees.ressourcesDS.length === 0) {
    erreurs.push("Aucune ressource DS définie");
  }
  if (donnees.ressourcesTech.length === 0) {
    erreurs.push("Aucune ressource Tech définie");
  }

  // Vérifier les priorités
  if (donnees.prioritesOrdre.length === 0) {
    erreurs.push("Aucune priorité définie");
  }

  // Vérifier les projets
  if (donnees.projets.length === 0) {
    erreurs.push("Aucun projet à planifier");
  }

  // Vérifier la capacité
  const capaciteMinimaleDS = Math.min(...donnees.projets.map(p => p.dureeDESN));
  const capaciteMinimaleTech = Math.min(...donnees.projets.map(p => p.dureeDEQP));

  if (donnees.capaciteDS < capaciteMinimaleDS) {
    erreurs.push(`Capacité DS (${donnees.capaciteDS}h) insuffisante pour le plus petit projet (${capaciteMinimaleDS}h)`);
  }
  if (donnees.capaciteTech < capaciteMinimaleTech) {
    erreurs.push(`Capacité Tech (${donnees.capaciteTech}h) insuffisante pour le plus petit projet (${capaciteMinimaleTech}h)`);
  }

  return {
    valide: erreurs.length === 0,
    erreurs: erreurs
  };
}

function verifierCoherenceStatistiques(stats, debugStats) {
  Logger.info("Vérification de la cohérence des statistiques");
  Logger.info(`Stats normales - Projets: ${stats.global.nombreProjetsUniques}, Réseaux: ${stats.global.nombreReseauxTotal}`);
  Logger.info(`Debug stats - Projets: ${debugStats.projetsUniques}, Réseaux: ${debugStats.reseauxTotal}`);
  
  if (stats.global.nombreProjetsUniques !== debugStats.projetsUniques ||
      stats.global.nombreReseauxTotal !== debugStats.reseauxTotal ||
      stats.global.heuresDESNTotal !== debugStats.heuresDESN ||
      stats.global.heuresDEQPTotal !== debugStats.heuresDEQP) {
    Logger.warning("Incohérence détectée dans les statistiques!");
  }
}


function testerGenerationCedules() {
  try {
    Logger.info("=== Test de génération des cédules ===");
    
    // 1. Vérifier les feuilles
    Logger.info("1. Vérification des feuilles");
    const rapportFeuilles = verifierFeuillesNecessaires();
    Logger.info("Rapport des feuilles :", rapportFeuilles);
    
    // 2. Vérifier les paramètres
    Logger.info("2. Vérification des paramètres");
    const params = chargerParametres();
    Logger.info("Paramètres chargés :", params);
    
    // 3. Générer les cédules
    Logger.info("3. Génération des cédules");
    genererCedules();
    
    return "Test de génération des cédules terminé avec succès";
  } catch (e) {
    Logger.error("Erreur lors du test de génération des cédules", e);
    return `Erreur : ${e.message}`;
  }
}

function importerSuiviBIRIAvecConfirmation() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Importer données BIRI', 'Êtes-vous sûr de vouloir importer les données BIRI ?', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    importerSuiviBIRI();
    ui.alert('Import terminé', 'Les données BIRI ont été importées avec succès.', ui.ButtonSet.OK);
  }
}

function debugPlanification(cedule) {
  Logger.info("=== Détails de la planification ===");
  let totalHeuresDESN = 0;
  let totalHeuresDEQP = 0;
  let projetsUniques = new Set();
  let reseauxTotal = 0;

  cedule.forEach(projet => {
    Logger.info(`Projet: ${projet.id}`);
    Logger.info(`  Réseaux: ${projet.reseaux.join(", ")}`);
    Logger.info(`  DESN: ${projet.dureeDESN}h (${projet.dsAssigne}, ${DateManager.formatDate(projet.dateDebutDESN)} - ${DateManager.formatDate(projet.dateFinDESN)})`);
    Logger.info(`  DEQP: ${projet.dureeDEQP}h (${projet.techAssigne}, ${DateManager.formatDate(projet.dateDebutDEQP)} - ${DateManager.formatDate(projet.dateFinDEQP)})`);
    
    totalHeuresDESN += projet.dureeDESN;
    totalHeuresDEQP += projet.dureeDEQP;
    projetsUniques.add(projet.id);
    reseauxTotal += projet.reseaux.length;
  });

  Logger.info("=== Résumé ===");
  Logger.info(`Projets uniques: ${projetsUniques.size}`);
  Logger.info(`Réseaux total: ${reseauxTotal}`);
  Logger.info(`Total heures DESN: ${totalHeuresDESN}`);
  Logger.info(`Total heures DEQP: ${totalHeuresDEQP}`);
}

function recupererVacances(sheetVacances) {
  try {
    const dataVacances = sheetVacances.getDataRange().getValues();
    const vacances = {};
    
    // Ignorer la première ligne (en-têtes)
    dataVacances.slice(1).forEach(row => {
      const [ressource, dateVacances] = row;
      if (!ressource || !dateVacances) return;
      
      if (!vacances[ressource]) {
        vacances[ressource] = [];
      }
      
      // S'assurer que la date est un objet Date valide
      const date = new Date(dateVacances);
      if (!isNaN(date.getTime())) {
        vacances[ressource].push(date);
      }
    });
    
    return vacances;
  } catch (e) {
    Logger.error("Erreur lors de la récupération des vacances", e);
    throw e;
  }
}

function calculerChargeParMois(cedule) {
  try {
    // Déterminer la période globale
    const dateDebut = new Date(Math.min(...cedule.flatMap(p => [p.dateDebutDESN, p.dateDebutDEQP].filter(Boolean))));
    const dateFin = new Date(Math.max(...cedule.flatMap(p => [p.dateFinDESN, p.dateFinDEQP].filter(Boolean))))

    // Initialiser la structure pour stocker les charges mensuelles
    const chargeMensuelle = {};
    
    // Parcourir tous les mois entre dateDebut et dateFin
    let currentDate = new Date(dateDebut.getFullYear(), dateDebut.getMonth(), 1);
    const lastDate = new Date(dateFin.getFullYear(), dateFin.getMonth() + 1, 0);

    while (currentDate <= lastDate) {
      const moisKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      chargeMensuelle[moisKey] = {
        'DS': {
          heuresDisponibles: CONSTANTS.PLANNING.HEURES_PAR_MOIS_DS,
          heuresAllouees: 0,
          utilisation: 0,
          heuresTampon: 0
        },
        'Tech': {
          heuresDisponibles: CONSTANTS.PLANNING.HEURES_PAR_MOIS_TECH,
          heuresAllouees: 0,
          utilisation: 0,
          heuresTampon: 0
        }
      };

      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Calculer les heures allouées pour chaque projet
    cedule.forEach(projet => {
      if (projet.dateDebutDESN && projet.dateFinDESN) {
        const moisDebut = new Date(projet.dateDebutDESN.getFullYear(), projet.dateDebutDESN.getMonth(), 1);
        const moisFin = new Date(projet.dateFinDESN.getFullYear(), projet.dateFinDESN.getMonth() + 1, 0);
        
        let currentMonth = new Date(moisDebut);
        while (currentMonth <= moisFin) {
          const moisKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
          if (chargeMensuelle[moisKey]) {
            chargeMensuelle[moisKey]['DS'].heuresAllouees += projet.dureeDESN;
          }
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      }

      if (projet.dateDebutDEQP && projet.dateFinDEQP) {
        const moisDebut = new Date(projet.dateDebutDEQP.getFullYear(), projet.dateDebutDEQP.getMonth(), 1);
        const moisFin = new Date(projet.dateFinDEQP.getFullYear(), projet.dateFinDEQP.getMonth() + 1, 0);
        
        let currentMonth = new Date(moisDebut);
        while (currentMonth <= moisFin) {
          const moisKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
          if (chargeMensuelle[moisKey]) {
            chargeMensuelle[moisKey]['Tech'].heuresAllouees += projet.dureeDEQP;
          }
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      }
    });

    // Calculer les pourcentages d'utilisation et le tampon
    Object.values(chargeMensuelle).forEach(mois => {
      ['DS', 'Tech'].forEach(type => {
        const charge = mois[type];
        charge.utilisation = charge.heuresAllouees / charge.heuresDisponibles;
        charge.heuresTampon = charge.heuresAllouees * CONSTANTS.TEMPS.TAMPON;
      });
    });

    return chargeMensuelle;
  } catch (e) {
    Logger.error("Erreur lors du calcul de la charge par mois", e);
    throw e;
  }
}

