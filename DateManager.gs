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

  static trouverProchainJourValide(date, ressource, vacances) {
  if (!date) {
    date = new Date();
  }
  
  let resultat = new Date(date);
  resultat.setHours(9, 0, 0, 0); // Initialiser à 9h du matin
  
  // Chercher le prochain jour valide
  while (!this.estJourValide(resultat, ressource, vacances)) {
    resultat.setDate(resultat.getDate() + 1);
  }
  
  return resultat;
  }

  // ... (autres méthodes de DateManager)
}
