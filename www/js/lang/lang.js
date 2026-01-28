var lang = {};

function LangItem(IdItem)
{
	return '<i name="'+IdItem+'">'+lang[user.lang][IdItem]+'</i>';
}

function PARSE_BodyLanguage()
{
	$.datepicker.setDefaults($.datepicker.regional[user.lang]);
	for(var langitem in lang[user.lang])
	{	
		$('i').each(function(){
			if( $(this).attr("name") == (langitem + '') )
			{
				$(this).html(lang[user.lang][langitem]);
			}
			else
			{
				if( $(this).attr("name").search("CSDAY-") >= 0 )
				{
					$(this).html(dayTab[user.lang][$(this).attr("name").substr(6)]);
				}
			}
		});
	}
}

lang.de = {
	CS000001 : "Folgende",
	CS000002  : "Ich wähle einen Hund",
	CS000003 : "Ich füge einen Hund hinzu",
	CS000004 : "Details",
	CS000005 : "Heute",
	CS000006 : "Ansteigender Impuls",
	CS000007 : "Erkannt",
	CS000008 : "Gewarnt",
	CS000009 : "Bestraft",
	CS000010  : "Erkennung",
	CS000011 : "Gewarnt",
	CS000012 : "Bestrafung",
	CS000013 : "Bellaufzeichnung",
	CS000014 : "Erkennung",
	CS000015 : "Warnung",
	CS000016 : "Impuls",
	CS000017  : "Einstellungen",
	CS000018 : "Erkennungsstufe",
	CS000019 : "Ansteigender Impuls",
	CS000020 : "Nur Ton-Signal",
	CS000021 : "Schwacher Impuls",
	CS000022 : "Starker Impuls",
	CS000023 : "Bitte aktivieren Sie das Bluetooth Ihres Geräts",
	CS000024 : "Halsbandsuche läuft",
	CS000025 : "Halsband nicht erkannt",
	CS000026  : "Konsuliteren Sie das Handbuch, um das Gerät zu starten",
	CS000027  : "Geben Sie den Namen Ihres Haustiers ein",
	CS000028 : "Bitte geben Sie einen Namen ein",
	CS000029 : "Verbindung mit dem Halsband verloren",
	CS000030 : "Uhrzeit Ihres Halsbandes eingeben",
	CS000031 : "Keine Daten für den ausgewählten Tag",
	CS000032 : "Halsband entfernen ",
	CS000033 : "Entfernen",
	CS000034 : "Löschen",
	CS000035 : "Alle Daten",
	CS000036 : "wird gelöscht",
	CS000037 : "Trotzdem löschen"							// Bouton de confirmation définitive de la suppression
};

lang.en = {
	CS000001 : "Next",
	CS000002  : "I choose a dog",
	CS000003 : "I add a dog",
	CS000004 : "Details",
	CS000005 : "Today",
	CS000006 : "Progressive stimulation",
	CS000007 : "Detected",
	CS000008 : "Warned",
	CS000009 : "Corrected",
	CS000010  : "Detections",
	CS000011 : "Warned",
	CS000012 : "Corrections",
	CS000013 : "Barking history",
	CS000014 : "Detections",
	CS000015 : "Warning",
	CS000016 : "Static stimulation",
	CS000017  : "Settings",
	CS000018 : "Level of detection",
	CS000019 : "Progressive stimulation",
	CS000020 : "Beep sounds only",
	CS000021 : "Light stimulation",
	CS000022 : "Strong stimulation",
	CS000023 : "Please activate the Bluetooth of your device",
	CS000024 : "Collar search in progress",
	CS000025 : "Collar not detected",
	CS000026  : "Refer to the manual to start it",
	CS000027  : "Enter your pet's name",
	CS000028 : "Please enter a name",
	CS000029 : "Connection with the collar lost",
	CS000030 : "Update the clock of the collar",
	CS000031 : "No data for the selected day",
	CS000032 : "Delete the collar ",
	CS000033 : "Delete",
	CS000034 : "Cancel",
	CS000035 : "All data",
	CS000036 : "will be deleted",
	CS000037 : "Delete anyway"								// Bouton de confirmation définitive de la suppression
};

lang.es = {
	CS000001 : "Siguiente",
	CS000002  : "Elijo un perro",
	CS000003 : "Añado un perro",
	CS000004 : "Detalles",
	CS000005 : "Hoy",
	CS000006 : "Estimulación progresiva",
	CS000007 : "Detectados",
	CS000008 : "Avisados",
	CS000009 : "Sancionados",
	CS000010  : "Detección",
	CS000011 : "Avisos sonoros solos",
	CS000012 : "Sanción",
	CS000013 : "Registro de ladridos",
	CS000014 : "Detección",
	CS000015 : "Advertencia",
	CS000016 : "Estímulo",
	CS000017  : "Configuración",
	CS000018 : "Nivel de detección",
	CS000019 : "Estímulo progresivo",
	CS000020 : "Avisos sonoros solo",
	CS000021 : "Estímulo suave",
	CS000022 : "Estímulo fuerte",
	CS000023 : "Por favor, active el Bluetooth de su dispositivo",
	CS000024 : "Busquede del collar en curso",
	CS000025 : "Collar no detectado",
	CS000026  : "Consulte el manual para iniciarlo",
	CS000027  : "Introduice el nombre de su animal",
	CS000028 : "Por favor introduice un nombre",
	CS000029 : "Conexión con el collar perdida",
	CS000030 : "Actualizando la hora del collar",
	CS000031 : "Sin datos para el día seleccionado",
	CS000032 : "Suprime tu mascota ",
	CS000033 : "Suprimir",
	CS000034 : "Cancelar",
	CS000035 : "Todos los datos",
	CS000036 : "serán eliminados",
	CS000037 : "Cancelar de todos modos"										// Bouton de confirmation définitive de la suppression
};

lang.it = {
	CS000001 : "Seguente",
	CS000002  : "Scelgo un cane",
	CS000003 : "Aggiungo un cane",
	CS000004 : "Dettagli",
	CS000005 : "Oggi",
	CS000006 : "Stimolazione progressiva",
	CS000007 : "Rilevato",
	CS000008 : "Avvertito",
	CS000009 : "Sanzionato",
	CS000010  : "Rilevazioni",
	CS000011 : "Avvertito",
	CS000012 : "Sanzioni",
	CS000013 : "Registro dell'abbaio",
	CS000014 : "Rilevazioni",
	CS000015 : "Avvertimento",
	CS000016 : "Stimolazione",
	CS000017  : "Configurazione",
	CS000018 : "Livello di rilevamento",
	CS000019 : "Stimolazione progressiva",
	CS000020 : "Solo avvertimenti sonori",
	CS000021 : "Stimolazione debole",
	CS000022 : "Stimulazione forte",
	CS000023 : "Si prega di attivare il Bluetooth del dispositivo",
	CS000024 : "Ricerca del collare in corso",
	CS000025 : "Collare non rilevato",
	CS000026  : "Fare riferimento al manuale per attivarlo",
	CS000027  : "Inserisci il nome del tuo animale domestico",
	CS000028 : "Per favore, inserisci un nome",
	CS000029 : "Connessione con il collare perso",
	CS000030 : "Aggiorna l'ora del tuo Canicalm Smart",
	CS000031 : "Nessun dato per il giorno selezionato",
	CS000032 : "Rimuovere il collare ",
	CS000033 : "Pulsante di conferma rimozione collare",
	CS000034 : "Annullare",
	CS000035 : "Tutti i dati",
	CS000036 : "Sarà cancellato",
	CS000037 : "Elimina comunque"										// Bouton de confirmation définitive de la suppression
};

lang.fr = {
	CS000001 : 'Suivant',
	CS000002 : 'Je choisis un chien',
	CS000003 : 'J\'ajoute un chien',
	CS000004 : 'Détails',
	CS000005 : 'Aujourd\'hui',
	CS000006 : 'Stimulation progressive',
	CS000007 : 'Détectés',
	CS000008 : 'Avertis',
	CS000009 : 'Sanctionnés',
	CS000010 : 'Détections',
	CS000011 : 'Avertis',
	CS000012 : 'Sanctions',
	CS000013 : 'Journal des aboiements',
	CS000014 : 'Détection',
	CS000015 : 'Avertissement',
	CS000016 : 'Stimulation',
	CS000017 : 'Paramètres',
	CS000018 : 'Niveau de détection',
	CS000019 : 'Stimulation Progressive',
	CS000020 : 'Bips seuls',
	CS000021 : 'Stimulation faible',
	CS000022 : 'Stimulation forte',
	CS000023 : "Merci d'activer le bluetooth de votre appareil.",
	CS000024 : "Recherche de <b>Canicalm Smart</b> en cours.",
	CS000025 : "<b>Canicalm Smart</b> non détecté.",
	CS000026 : "Reportez-vous à la notice pour le démarrer.",
	CS000027 : "Entrez le nom de votre animal.",
	CS000028 : "Merci d'entrer un nom.",
	CS000029 : "Connexion avec votre <b>Canicalm Smart</b> perdue.",
	CS000030 : "Actualisation de l'heure de votre <b>Canicalm Smart</b>.",
	CS000031 : "Aucune donnée pour le jour sélectionné.",
	CS000032 : "Supprimer votre animal ",									// Question lors de la suppression
	CS000033 : "Supprimer",													// Bouton de confirmation de la suppression
	CS000034 : "Annuler",
	CS000035 : "Toutes les données de ",
	CS000036 : " seront supprimées.",
	CS000037 : "Supprimer quand même"										// Bouton de confirmation définitive de la suppression

};



var dayTab = {
	de : {
			monday		: "Montag",
			tuesday		: "Dienstag",
			wednesday	: "Mittwoch",
			thursday	: "Donnerstag",
			friday		: "Freitag",
			saturday	: "Samstag",
			sunday		: "Sonntag"
		},
	en : {
			monday		: "Monday",
			tuesday		: "Tuesday",
			wednesday	: "Wednesday",
			thursday	: "Thursday",
			friday		: "Friday",
			saturday	: "Saturday",
			sunday		: "Sunday"
		},
	it : {
			monday		: "Lunedì",
			tuesday		: "Martedì",
			wednesday	: "Mercoledì",
			thursday	: "Giovedì",
			friday		: "Venerdì",
			saturday	: "Sabato",
			sunday		: "Domenica"
		},
	es : {
			monday		: "Lunes",
			tuesday		: "Martes",
			wednesday	: "Miercoles",
			thursday	: "Jueves",
			friday		: "Viernes",
			saturday	: "Sabado",
			sunday		: "Domingo"
		},
	fr : {
			monday		: "Lundi",
			tuesday		: "Mardi",
			wednesday	: "Mercredi",
			thursday	: "Jeudi",
			friday		: "Vendredi",
			saturday	: "Samedi",
			sunday		: "Dimanche"
		}
};

var langTab = {
	de : "Deutsch",
	en : "English",
	it : "Italiano",
	es : "Español",
	fr : "Français"
};