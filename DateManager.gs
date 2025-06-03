/**
 * Classe de gestion des dates
 */
class DateManager {
  static get JOURS_SEMAINE() {
    return ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  }
  
static formatDate(date) {
    if (!date) return '';
    
    const jour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = date.getFullYear();
    
    return `${jour}/${mois}/${annee}`;
  }

 static ajouterHeuresOuvrables(date, heures) {
    let resultat = new Date(date);
    let heuresAjoutees = 0;
    while (heuresAjoutees < heures) {
      resultat.setTime(resultat.getTime() + 60 * 60 * 1000); // Ajoute 1 heure
      if (this.estJourOuvrable(resultat) && this.estHeureOuvrable(resultat)) {
        heuresAjoutees++;
      }
    }
    return resultat;
  }

  static estJourOuvrable(date) {
    const jour = date.getDay();
    return jour >= 1 && jour <= 5; // Du lundi (1) au vendredi (5)
  }

  static estHeureOuvrable(date) {
    const heure = date.getHours();
    return heure >= 9 && heure < 17; // De 9h à 17h
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
