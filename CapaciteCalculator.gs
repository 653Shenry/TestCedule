/**
 * Classe de gestion de la capacité
 */
class CapaciteCalculator {
  constructor(capaciteTotale, constants) {
    this.capaciteTotale = capaciteTotale;
    this.utilisee = {};
    this.constants = constants;
  }

  verifierCapaciteMensuelle(ressource, dateDebut, dateFin, dureeHeures) {
    try {
      Logger.debug(`Vérification capacité pour ${ressource}`, {
        dateDebut: dateDebut,
        dateFin: dateFin,
        dureeHeures: dureeHeures,
        capaciteTotale: this.capaciteTotale
      });

      if (!dureeHeures || dureeHeures <= 0) {
        return {
          success: false,
          message: "Durée invalide",
          details: { dureeHeures: dureeHeures }
        };
      }

      if (!dateDebut) {
        return {
          success: false,
          message: "Date de début non définie",
          details: { dateDebut: dateDebut }
        };
      }

      const dateMaximale = new Date();
      dateMaximale.setMonth(dateMaximale.getMonth() + this.constants.PLANNING.MAX_MOIS);
      
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
        
        dateCourante.setMonth(dateCourante.getMonth() + 1);
        dateCourante.setDate(1);
      }

      const resultat = {
        success: heuresRestantes === 0,
        dateDebut: dateDebutTrouvee,
        repartitionMois: repartitionMois
      };

      Logger.debug(`Résultat vérification pour ${ressource}:`, resultat);
      
      return resultat;
    } catch (e) {
      Logger.error(`Erreur dans verifierCapaciteMensuelle pour ${ressource}`, e);
      return {
        success: false,
        message: e.message
      };
    }
  }

  peutAjouter(mois, heures) {
    const utilise = this.utilisee[mois] || 0;
    return (utilise + heures) <= this.capaciteTotale;
  }

  getCapaciteRestante(mois) {
    return this.capaciteTotale - (this.utilisee[mois] || 0);
  }

  ajouter(mois, heures) {
    if (!this.peutAjouter(mois, heures)) return false;
    this.utilisee[mois] = (this.utilisee[mois] || 0) + heures;
    return true;
  }
}
