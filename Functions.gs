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
    
    debugPlanification(cedule);
    
    if (cedule && cedule.length > 0) {
      const rapportGenerator = new RapportGenerator(SpreadsheetApp.getActiveSpreadsheet(), CONSTANTS);
      rapportGenerator.genererTousLesRapports(cedule);
      const chargeMensuelle = calculerChargeParMois(cedule);
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


function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Cedule BIRI')
      .addItem('Importer données BIRI', 'importerSuiviBIRIAvecConfirmation')
      .addSeparator()
      .addItem('Créer cédule', 'creerCeduleAvecConfirmation')
      .addToUi();
}


function initialiserConstantes() {
  const params = chargerParametres();
  
  const CONSTANTS = {
    HEURES_PAR_JOUR: params.general.HEURES_PAR_JOUR,
    JOURS_OUVRES_MOIS: params.general.JOURS_OUVRES_MOIS,
    POURCENTAGE_CAPACITE: params.general.POURCENTAGE_CAPACITE,
    TEMPS: {
      TAMPON: params.general.TAMPON
    },
    DELAI_MINIMUM_DESN_DEQP: params.delais.DELAI_MINIMUM_DESN_DEQP,
    DELAI_NISR: params.delais.DELAI_NISR,
    DUREES: params.durees,
    PLANNING: {
      MAX_MOIS: params.planning.MOIS_MAX,
      HEURES_PAR_MOIS_DS: params.capacites.DS.HEURES_EFFECTIVES,
      HEURES_PAR_MOIS_TECH: params.capacites.TECH.HEURES_EFFECTIVES,
      DELAI_ENTRE_PHASES: params.delais.DELAI_MINIMUM_DESN_DEQP
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
    }
  };

  // Vérification des valeurs critiques
  if (CONSTANTS.DUREES.DEQP.SIMPLE <= 0 || CONSTANTS.DUREES.DEQP.COMPLEXE <= 0 ||
      CONSTANTS.DUREES.DESN.SIMPLE <= 0 || CONSTANTS.DUREES.DESN.COMPLEXE <= 0) {
    Logger.error("Durées invalides", CONSTANTS.DUREES);
    throw new Error("Durées invalides. Vérifiez les valeurs dans l'onglet Paramètres.");
  }

  Logger.info("Constantes initialisées", CONSTANTS);
  return CONSTANTS;
}

function chargerParametres() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetParams = ss.getSheetByName("Paramètres");
  
  if (!sheetParams) {
    Logger.error("La feuille Paramètres n'existe pas.");
    throw new Error("La feuille Paramètres est manquante.");
  }

  function getNumericValue(range, defaultValue) {
    const value = range.getValue();
    return (typeof value === 'number' && !isNaN(value)) ? value : defaultValue;
  }

  const params = {
    general: {
      HEURES_PAR_JOUR: getNumericValue(sheetParams.getRange("B2"), 7.5),
      JOURS_OUVRES_MOIS: getNumericValue(sheetParams.getRange("B3"), 21),
      POURCENTAGE_CAPACITE: getNumericValue(sheetParams.getRange("B4"), 0.9),
      TAMPON: getNumericValue(sheetParams.getRange("B5"), 0.1)
    },
    delais: {
      DELAI_MINIMUM_DESN_DEQP: getNumericValue(sheetParams.getRange("B8"), 5),
      DELAI_NISR: getNumericValue(sheetParams.getRange("B9"), 110)
    },
    durees: {
      DESN: {
        SIMPLE: getNumericValue(sheetParams.getRange("B12"), 1),
        COMPLEXE: getNumericValue(sheetParams.getRange("C12"), 10)
      },
      DEQP: {
        SIMPLE: getNumericValue(sheetParams.getRange("B15"), 4),
        COMPLEXE: getNumericValue(sheetParams.getRange("C15"), 15)
      }
    },
    capacites: {
      DS: {
        HEURES_BASE: getNumericValue(sheetParams.getRange("B18"), 472.5),
        POURCENTAGE_DISPONIBLE: getNumericValue(sheetParams.getRange("C18"), 0.9),
        HEURES_EFFECTIVES: getNumericValue(sheetParams.getRange("D18"), 425.25)
      },
      TECH: {
        HEURES_BASE: getNumericValue(sheetParams.getRange("B19"), 630),
        POURCENTAGE_DISPONIBLE: getNumericValue(sheetParams.getRange("C19"), 0.9),
        HEURES_EFFECTIVES: getNumericValue(sheetParams.getRange("D19"), 567)
      }
    },
    planning: {
      MOIS_MAX: getNumericValue(sheetParams.getRange("B22"), 24)
    }
  };

  Logger.info("Paramètres chargés", params);
  return params;
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
    
    // Récupérer les données brutes
    const donneesBrutes = sheetSuiviBIRI.getDataRange().getValues().slice(1)
      .filter(row => row[0])
      .map(row => ({
        projet: row[0],
        reseau: Number(row[1]),
        sapHeaders: row[2],
        priorite: row[3],
        kickOffDAPP: row[5] ? new Date(row[5]) : null,
        technologie: row[6],
        dateRecue: row[7] ? new Date(row[7]) : null,
        dateNISR: row[8] ? new Date(row[8]) : null,
        directTechnicien: row[9] === "Oui"
      }));

    // Créer les projets avec logging
    const projets = donneesBrutes.map(data => {
      try {
        return new Projet(data, CONSTANTS);
      } catch (e) {
        Logger.error(`Erreur lors de la création du projet ${data.projet}`, e);
        return null;
      }
    }).filter(Boolean);

    // Calculer les capacités
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

function pretraiterProjets(projets) {
  try {
    Logger.info("Début du prétraitement des projets");
    const projetsGroupes = {};
    let totalProjets = 0;
    let projetsInvalides = 0;
    let projetsNA = 0;
    
    // Compter tous les projets
    projets.forEach(projet => {
      if (!projet.id) {
        projetsInvalides++;
        return;
      }
      if (projet.id === "#N/A") {
        projetsNA++;
        return;
      }

      totalProjets++;
      if (!projetsGroupes[projet.id]) {
        projetsGroupes[projet.id] = {
          ...projet,
          reseaux: [...projet.reseaux]
        };
      } else {
        // Fusionner les réseaux uniques
        const reseauxUniques = new Set([
          ...projetsGroupes[projet.id].reseaux,
          ...projet.reseaux
        ]);
        projetsGroupes[projet.id].reseaux = Array.from(reseauxUniques);
        
        // Mettre à jour les dates si nécessaire
        if (projet.dateNISR && (!projetsGroupes[projet.id].dateNISR || projet.dateNISR < projetsGroupes[projet.id].dateNISR)) {
          projetsGroupes[projet.id].dateNISR = projet.dateNISR;
        }
        if (projet.kickOffDAPP && (!projetsGroupes[projet.id].kickOffDAPP || projet.kickOffDAPP < projetsGroupes[projet.id].kickOffDAPP)) {
          projetsGroupes[projet.id].kickOffDAPP = projet.kickOffDAPP;
        }
      }
    });

    const projetsTraites = Object.values(projetsGroupes);
    
    Logger.info(`Prétraitement terminé:`, {
      projetsTotaux: totalProjets,
      projetsUniques: projetsTraites.length,
      projetsInvalides: projetsInvalides,
      projetsNA: projetsNA,
      reseauxTotal: projetsTraites.reduce((total, p) => total + p.reseaux.length, 0)
    });

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
      
      Logger.info(`Priorité ${priorite}: ${projetsParPriorite[priorite].length} projets`);
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

function debugPlanification(cedule) {
  Logger.info("=== Détails de la planification ===");
  let totalHeuresDESN = 0;
  let totalHeuresDEQP = 0;
  let projetsUniques = new Set();
  let reseauxTotal = 0;

  if (!cedule || cedule.length === 0) {
    Logger.info("Aucun projet dans la cédule");
    return;
  }

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
