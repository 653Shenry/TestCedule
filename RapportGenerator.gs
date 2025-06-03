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

    if (data.length > 0) {
      sheet.getRange(2, 6, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.NOMBRE);
      sheet.getRange(2, 10, data.length, 1).setNumberFormat(this.CONSTANTS.FORMATS.NOMBRE);
    }
  }

  genererCeduleDS(cedule) {
    // ... (code similaire à genererCedulePrincipale, adapté pour DS)
  }

  genererCeduleTech(cedule) {
    // ... (code similaire à genererCedulePrincipale, adapté pour Tech)
  }

  genererRapportCharge(cedule) {
    // ... (code pour générer le rapport de charge)
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
    // ... (code pour écrire et formater les données dans la feuille)
  }

  formaterTableau(sheet, numColumns, numRows) {
    // ... (code pour formater le tableau)
  }
}
