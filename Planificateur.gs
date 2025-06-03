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
    
    this.capaciteDS = new CapaciteCalculator(this.constants.PLANNING.HEURES_PAR_MOIS_DS, constants);
    this.capaciteTech = new CapaciteCalculator(this.constants.PLANNING.HEURES_PAR_MOIS_TECH, constants);
  }

  planifierProjet(projet) {
    Logger.info(`Début planification: ${projet.toString()}`);
    
    try {
      let dateDebutCible = null;
      if (projet.kickOffDAPP) {
        dateDebutCible = new Date(projet.kickOffDAPP);
        dateDebutCible.setDate(dateDebutCible.getDate() - this.constants.DELAI_NISR);
      } else if (projet.dateNISR) {
        dateDebutCible = new Date(projet.dateNISR);
        dateDebutCible.setDate(dateDebutCible.getDate() - this.constants.DELAI_NISR);
      }

      if (!dateDebutCible) {
        dateDebutCible = new Date();
        Logger.info(`Projet ${projet.id} sans dates, planifié à partir d'aujourd'hui`);
      }

      if (projet.directTechnicien) {
        const resultat = this.planifierTacheTechnicien(projet, dateDebutCible);
        if (!resultat) {
          Logger.info(`Projet ${projet.id} non planifié: Échec de la planification technicien direct`);
        }
        return resultat;
      }

      const resultat = this.planifierTacheComplete(projet, dateDebutCible);
      if (!resultat) {
        Logger.info(`Projet ${projet.id} non planifié: Échec de la planification complète`);
      }
      return resultat;

    } catch (e) {
      Logger.error(`Erreur planification ${projet.id}`, e);
      return null;
    }
  }

  planifierTacheComplete(projet, dateDebutCible) {
    try {
      const dsChoisi = this.choisirRessourceMoinsChargee(
        this.ressourcesDS, 
        this.planningState.dernieresDates.DS
      );

      const techChoisi = this.choisirRessourceMoinsChargee(
        this.ressourcesTech,
        this.planningState.dernieresDates.Tech
      );

      Logger.debug(`Planification de ${projet.id}:`, {
        dateDebutCible: dateDebutCible,
        dureeDESN: projet.dureeDESN,
        dureeDEQP: projet.dureeDEQP,
        dsChoisi: dsChoisi,
        techChoisi: techChoisi
      });

      let dateDebutDESN, dateFinDESN, dateDebutDEQP, dateFinDEQP;
      const dateActuelle = new Date();

      dateDebutDESN = DateManager.trouverProchainJourValide(
        Math.max(dateActuelle, dateDebutCible || dateActuelle, this.planningState.dernieresDates.DS[dsChoisi] || dateActuelle),
        dsChoisi,
        this.vacances
      );

      const verificationCapacite = this.verifierCapacitePlanificationNormale(
        projet,
        dsChoisi,
        techChoisi,
        dateDebutDESN
      );

      if (!verificationCapacite.success) {
        Logger.info(`Projet ${projet.id}: Capacité insuffisante`, verificationCapacite.raison);
        return null;
      }

      dateFinDESN = DateManager.ajouterHeuresOuvrables(
        dateDebutDESN,
        projet.dureeDESN,
        dsChoisi,
        this.vacances,
        this.constants
      );

      dateDebutDEQP = DateManager.ajouterHeuresOuvrables(
        dateFinDESN,
        this.constants.DELAI_MINIMUM_DESN_DEQP * this.constants.HEURES_PAR_JOUR,
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
    } catch (error) {
      Logger.error(`Erreur lors de la planification du projet ${projet.id}`, error);
      return null;
    }
  }

  verifierCapacitePlanificationNormale(projet, dsChoisi, techChoisi, dateDebut) {
    try {
      Logger.debug(`Vérification capacité pour projet ${projet.id}:`, {
        dsChoisi: dsChoisi,
        techChoisi: techChoisi,
        dateDebut: dateDebut,
        dureeDESN: projet.dureeDESN,
        dureeDEQP: projet.dureeDEQP
      });

      if (!projet.dureeDESN || !projet.dureeDEQP) {
        return {
          success: false,
          raison: {
            DS: !projet.dureeDESN ? 'Durée DESN non définie' : 'OK',
            Tech: !projet.dureeDEQP ? 'Durée DEQP non définie' : 'OK',
            heuresRequises: {
              DS: projet.dureeDESN,
              Tech: projet.dureeDEQP
            }
          }
        };
      }

      const capaciteDS = this.capaciteDS.verifierCapaciteMensuelle(
        dsChoisi,
        dateDebut,
        null,
        projet.dureeDESN
      );

      const capaciteTech = this.capaciteTech.verifierCapaciteMensuelle(
        techChoisi,
        dateDebut,
        null,
        projet.dureeDEQP
      );

      Logger.debug(`Résultat vérification capacité pour ${projet.id}:`, {
        capaciteDS: capaciteDS,
        capaciteTech: capaciteTech
      });

      if (!capaciteDS.success || !capaciteTech.success) {
        return {
          success: false,
          raison: {
            DS: capaciteDS.success ? 'OK' : 'Capacité insuffisante',
            Tech: capaciteTech.success ? 'OK' : 'Capacité insuffisante',
            heuresRequises: {
              DS: projet.dureeDESN,
              Tech: projet.dureeDEQP
            }
          }
        };
      }

      return { success: true };
    } catch (e) {
      Logger.error(`Erreur dans verifierCapacitePlanificationNormale pour ${projet.id}`, e);
      return { success: false, raison: e.message };
    }
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
}
