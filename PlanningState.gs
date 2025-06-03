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
