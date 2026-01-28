/*!
 * variable globale contenant l'addresse mac du device à connecter
 */
if (idBLE === undefined) var idBLE = "";

/*!
 * variable globale permettant de vérifier à intervalle régulier si le BLE est
 * toujours actif
 */
var BLEIsAvailable_Timeout = null;

/*!
 * variable globale Fixant la durée de l'intervalle de vérification de
 * l'activation du module BLE
 */
var BLEIsAvailable_Duration = 5000;

/*!
 * variable globale permettant de connaître l'état de la connexion BLE
 */
var BLECurrentlyConnected = false;

/*!
 * fonction permettant de vérifier à intervalle régulier si le BLE est toujours
 * actif et si un connexion était en cours, vérifier si elle est toujours
 * active
 * \fn checkBLEStatus()
 */
checkBLEStatus = function() {
	ble.isEnabled(
		function() {
			// BLE actif
			if (BLECurrentlyConnected == true) {
				if (user.dogs.length == 1 &&
					user.dogs[selectedDog].id == "demo") {
					return;
				}
				ble.isConnected(
					user.dogs[selectedDog].id,
					function() {
						BLECurrentlyConnected = true;
					},
					function() {
						BLECurrentlyConnected = false;
						UpdateConnectionStatusIcon();
						UpdateBatteryIcon(-1);
						swal({
							html: LangItem("CS000029") + AddCloseIcoForSwal(),
							confirmButtonColor: "#ddd",
							onOpen: function() {
								// permet de désactiver le focus sur le bouton
								// activé automatiquement par la lib
								document.activeElement.blur();
								$(".swal2-confirm").css({
									// modification du style du bouton changé
									// dynamiquement par la lib
									color: "#000",
									"box-shadow": "0 2px 6px #ccc",
									background:
										"linear-gradient(#ffffff, " +
														"#fcfcfc 40%, " +
														"#f1f0f1 80%, #e6e6e6)",
									border: "1px solid #aaa",
									"border-radius": "5px"
								});
							},
							showConfirmButton: true
						});
						$(".param-overlay").css({
							display: "block"
						});
					}
				);
				UpdateParamStatus();
			}
			clearTimeout(BLEIsAvailable_Timeout);
			BLEIsAvailable_Timeout = setTimeout(
				checkBLEStatus,
				BLEIsAvailable_Duration
			);
		},
		function() {
			// BLE inactif
			clearTimeout(BLEIsAvailable_Timeout);
			swal({
				title: "",
				html: LangItem("CS000023"),
				confirmButtonColor: "#ddd",
				onOpen: function() {
					// permet de désactiver le focus sur le bouton activé
					// automatiquement par la lib
					document.activeElement.blur();
					$(".swal2-confirm").css({
						// modification du style du bouton changé dynamiquement
						// par la lib
						color: "#000",
						"box-shadow": "0 2px 6px #ccc",
						background:
							"linear-gradient(#ffffff, #fcfcfc 40%, " +
											"#f1f0f1 80%, #e6e6e6)",
						border: "1px solid #aaa",
						"border-radius": "5px"
					});
				},
				showConfirmButton: true
			}).then(function(result) {
				navigator.app.exitApp(); // on quitte l'appli
			});
		}
	);
};

/*!
 * permet d'initialiser le module BLE, gérer son activation et exécuter des
 * actions s'il est activé
 * \fn initBLE()
 * \param callback pointe une fonction à appeler si le module BLE est actif
 */
initBLE = function(callback) {
	ble.isEnabled(
		function() {
			// BLE actif
			if (callback !== undefined) callback();
		},
		function() {
			if (device.platform == "Android") {
				// si on est sous Android
				ble.enable(
					// on demande l'activation matériel du BLE
					function() {
						// on relance la fonction pour passer démarrer le scan
						// si le BLE a été activé par l'utilisateur
						initBLE(callback);
					},
					function() {
						// on quitte l'appli si l'utilisateur a refusé
						navigator.app.exitApp();
					}
				);
			} else if (device.platform == "iOS") {
				// si on est sous iOS on affiche un message pour demander
				// l'activation
				swal({
					title: "",
					html: LangItem("CS000023"),
					confirmButtonColor: "#ddd",
					onOpen: function() {
						// permet de désactiver le focus sur le bouton activé
						// automatiquement par la lib
						document.activeElement.blur();
						$(".swal2-confirm").css({
							// modification du style du bouton changé
							// dynamiquement par la lib
							color: "#000",
							"box-shadow": "0 2px 6px #ccc",
							background:
								"linear-gradient(#ffffff, #fcfcfc 40%, " +
												"#f1f0f1 80%, #e6e6e6)",
							border: "1px solid #aaa",
							"border-radius": "5px"
						});
					},
					showConfirmButton: true
				}).then(function(result) {
					// on quitte l'appli
					navigator.app.exitApp();
				});
			}
		}
	);
};

/*!
 * permet d'initialiser la connection au périphérique BLE de l'animal
 * sélectionner
 * \fn initBLEConnection()
 * \param callback pointe une fonction à appeler si le périphérique BLE est déjà
 *				   connecté
 */
initBLEConnection = function(callback) {
	UpdateConnectionStatusIcon();
	// récupération de l'addresse mac du périphérique à connecter
	idBLE = user.dogs[selectedDog].id;

	ble.isEnabled(
		function() {
			// BLE actif
			ble.isConnected(
				idBLE,
				function() {
					// périphérique BLE déjà connecté
					// => initialisation des notifications BLE
					dataNotificationStartBLE();
					if (callback !== undefined) callback();
				},
				// périphérique BLE non connecté => démarrage du process de
				// connection (commence par la recherche du périphérique c-a-d
				// le scan)
				startBLEScan
			);
		},
		function() {
			// BLE inactif
			// => activation du BLE avec initBLEConnection en paramètre de initBLE
			initBLE(initBLEConnection);
		}
	);
};

/*!
 * variable globale permettant de savoir si le scan BLE est actif
 */
var scanning = false;

/*!
 * permet de démarrer le scan BLE
 * \fn startBLEScan()
 */
startBLEScan = function() {
	//connectRunning = false;

	scanning = true;
	//start scan
	bleTimingScan();
};

/*!
 * permet de gérer le scan BLE. Sous Android 5.x le scan continue est source de
 * bug. Cette fonction va donc scanner pendant 2 secondes puis s'interrompre
 * 100 ms avant de reprendre tant que scanning est actif.
 */
bleTimingScan = function() {
	console.log("CYRIL asso timing");
	// si on scan pour le device c'est que l'aboiement n'est plus actif, on
	// réinitialise donc la variable
	aboiementRunning = false;

	if (scanning) {
		// scan BLE actif
//		console.log("CYRIL asso timing : stop");

		// arrêt du scan actif
		ble.stopScan();

		setTimeout(function() {
			// timeout de 100 ms avant démarrage du scan
//			console.log("CYRIL asso timing : start");
			// démarrage du scan
			ble.startScan([], checkFoundDevice, startBLEScanFailed);

			// timeout pour l'arrêt du scan au bout de 2 secondes (ceci se fait
			// en réexécutant cette fonction
			setTimeout(bleTimingScan, 2000);
		}, 100);
	}
};

/*!
 * permet de gérer un échec lors du scan BLE. Cette fonction redémarre le scan
 * en cas d'erreur
 */
startBLEScanFailed = function() {
	console.log("scan start");

	//stopscan if still running
	//ble.stopScan();

	//restart scan after few second
	// timeout de 100 ms avant le redémarrage du scan BLE
	setTimeout(startBLEScan, 100);
};

/*!
 * permet de contrôler le périphérique BLE qui a été scanné. Cette fonction
 * vérifie que le périphérique scanné est celui recherché. Si c'est le cas, elle
 * établit la connection BLE
 * \fn checkFoundDevice()
 * \param device est un objet contenant les informations du périphérique scanné
 */
checkFoundDevice = function(device) {
	console.log("scan result " + device.id);

	if (device.id == idBLE && BLECurrentlyConnected == false) {
		// périphérique recherché OK, et la connection BLE n'est pas déjà active
		// En effet la callback checkFoundDEvice peut être appelé plusieurs fois
		// et tout les appels seront exécutés.
		//fin du scan
		scanning = false;

		//arret du scan actif
		ble.stopScan();

		// initialisation de la variable global pour la synchronisation de
		// l'heure du peripherique
		// -> valeur à faux pour que le contrôle est lieu
		timeUpdated = false;

		console.log("---Device found");

		//établissement de la connection
		// --> si OK => initialisation des notifications BLE
		// --> si erreur => reprise du scan
		ble.connect(
			device.id,
			dataNotificationStartBLE,
			startBLEScan
		);
	}
};

/*!
 * permet d'activer les notifications BLE du periphérique
 * \fn dataNotificationStartBLE
 * \param device est un objet contenant les informations du périphérique connecté
 */
dataNotificationStartBLE = function(device) {
	// connection établie => variable d'état à OK
	BLECurrentlyConnected = true;

	// déclencher l'animation de communication du BLE et adapté l'affichage à
	// l'état de la connection
	UpdateConnectionStatusIcon();

	//avant tout vérifier que la connection est bien établi
	ble.isConnected(
		device.id,
		function() {
			//peripherique BLE connecté

			setTimeout(function() {
				// timeout d'une seconde pour laisser le temps au module BLE de
				// finir les échanges avec :
				// - le peripherique
				// - la couche android/ios
				console.log("START 2A2B");

				//activation des notifications pour synchroniser l'heure
				dataStartNotifHeure();

				//activation des notifications pour la batterie
				console.log("START 2A19");
				dataStartNotifBatt();

				//activation des notifications pour le mode de sanction
				console.log("START 01-00");
				dataStartNotifMode();

				//activation des notifications pour la sensibilité
				console.log("START 01-01");
				dataStartNotifSens();

				//activation des notifications pour la programmation plage 1
				console.log("START 01-02");
				dataStartNotifProg1();

				//activation des notifications pour la programmation plage 2
				console.log("START 01-03");
				dataStartNotifProg2();
			}, 1000);
		},
		function() {
			// peripherique BLE déconnecté
			// l'appel à disconnecte permet de purger et réinitialiser la
			// connection BLE pour ce périphérique
			ble.disconnect(device.id);
		}
	);
};

/*!
 * permet d'activer les notifications du service de date/heure. Ceci est utilisé
 * pour actualiser l'heure du périphérique si l'écart est supérieur à 5 secondes
 * \fn dataStartNotifHeure
 */
dataStartNotifHeure = function() {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//enregistrement des notifications auprès du service 2A2B
	// -> si OK =>	 dataNotificationEventBLE_time est passé en callback pour la
	//				  réception des notifications
	// -> si échec => relance du démarrage des notifications après 1 seconde
	//				  d'attente
	ble.startNotification(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"2A2B",
		dataNotificationEventBLE_time,
		function(failure) {
			console.log("startnotif heure failed " + JSON.stringify(failure));
			setTimeout(dataStartNotifHeure, 1000);
		}
	);
};

/*!
 * permet d'activer les notifications du service de batterie. Ceci est utilisé
 * pour actualiser le niveau de batterie du périphérique
 * \fn dataStartNotifBatt
 */
dataStartNotifBatt = function() {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//enregistrement des notifications au près du service 2A19
	// -> si OK =>	  dataNotificationEventBLE_battery est passé en callback
	//				  pour la réception des notifications
	// -> si échec => relance du démarrage des notifications après 1 seconde
	//				  d'attente
	ble.startNotification(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"2A19",
		dataNotificationEventBLE_battery,
		function(failure) {
			console.log("startnotif batt failed " + JSON.stringify(failure));
			setTimeout(dataStartNotifBatt, 1000);
		}
	);
};

/*!
 * permet d'activer les notifications du service de mode. Ceci est utilisé pour
 * actualiser le mode de sanction du périphérique
 * \fn dataStartNotifMode
 */
dataStartNotifMode = function() {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//enregistrement des notifications au près du service ...0000
	// -> si OK =>	  dataNotificationEventBLE_mode est passé en callback pour
	//				  la réception des notifications
	// -> si échec => relance du démarrage des notifications après 1 seconde
	//				  d'attente
	ble.startNotification(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000000",
		dataNotificationEventBLE_mode,
		function(failure) {
			console.log("startnotif mode failed " + JSON.stringify(failure));
			setTimeout(dataStartNotifMode, 1000);
		}
	);
};

/*!
 * permet d'activer les notifications du service de sensibilité. Ceci est
 * utilisé pour actualiser la sensibilité d'aboiement du périphérique
 * \fn dataStartNotifSens
 */
dataStartNotifSens = function() {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//enregistrement des notifications au près du service ...0001
	// -> si OK =>	  dataNotificationEventBLE_sensibility est passé en callback
	//				  pour la réception des notifications
	// -> si échec => relance du démarrage des notifications après 1 seconde
	//				  d'attente
	ble.startNotification(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000001",
		dataNotificationEventBLE_sensibility,
		function(failure) {
			console.log("startnotif sensibility failed " +
													JSON.stringify(failure));
			setTimeout(dataStartNotifSens, 1000);
		}
	);
};

/*!
 * permet d'activer les notifications du service de programmation plage 1. Ceci
 * est utilisé pour actualiser la programmation plage 1 du périphérique
 * \fn dataStartNotifProg1
 */
dataStartNotifProg1 = function() {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//enregistrement des notifications au près du service ...0002
	// -> si OK =>	  dataNotificationEventBLE_prog1 est passé en callback pour
	//				  la réception des notifications
	// -> si échec => relance du démarrage des notifications après 1 seconde
	//				  d'attente
	ble.startNotification(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000002",
		dataNotificationEventBLE_prog1,
		function(failure) {
			console.log("startnotif prog1 failed " + JSON.stringify(failure));
			setTimeout(dataStartNotifProg1, 1000);
		}
	);
};

/*!
 * permet d'activer les notifications du service de programmation plage 2. Ceci
 * est utilisé pour actualiser la programmation plage 2 du périphérique
 * \fn dataStartNotifProg2
 */
dataStartNotifProg2 = function() {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//enregistrement des notifications au près du service ...0003
	// -> si OK =>	  dataNotificationEventBLE_prog2 est passé en callback pour
	//				  la réception des notifications
	// -> si échec => relance du démarrage des notifications après 1 seconde
	//				  d'attente
	ble.startNotification(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000003",
		dataNotificationEventBLE_prog2,
		function(failure) {
			console.log("startnotif prog2 failed " + JSON.stringify(failure));
			setTimeout(dataStartNotifProg2, 1000);
		}
	);
};

/*!
 * variable global pour s'assurer que l'enregistrement au notification
 * d'aboiement ne se fait qu'une seule fois.
 */
var aboiementRunning = false;

/*!
 * permet d'activer les notifications d'aboiement. La première opération de
 * cette fonction est de configurer l'heure de départ des notifications, puis
 * d'activer la récpetion des notifications
 * \fn dataStartNotifAboiement
 * \param date est un objet de type date qui contient la date à partir de
 * 			   laquelle les notifications d'aboiements sont générées.
 */
dataStartNotifAboiement = function(date) {
	// déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	// si le processus d'enregistrement des aboiements est déjà commencé :
	// rien faire
	if (aboiementRunning) return;

	// changement de la variable d'état des notifcations d'aboiements
	aboiementRunning = true;

	console.log("notif aboiement ");

	// conversion de la date en timestamp FAT32
	data = new Uint8Array(4);

	var currentDate;
	if (date != null) currentDate = date;
	else {
		currentDate = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	}

	var sec = currentDate.getUTCSeconds();
	var min = currentDate.getUTCMinutes();
	var hr = currentDate.getUTCHours();
	var d = currentDate.getUTCDate();
	var m = currentDate.getUTCMonth();
	var y = currentDate.getUTCFullYear();

	var timestamp =
		((sec & 0x1f) >> 1) +
		((min & 0x3f) << 5) +
		((hr & 0x1f) << 11) +
		((d & 0x1f) << 16) +
		(((m + 1) & 0xf) << 21) +
		(((y - 1980) & 0x7f) << 25);

	data[0] = (timestamp & 0xff000000) >> 24;
	data[1] = (timestamp & 0x00ff0000) >> 16;
	data[2] = (timestamp & 0x0000ff00) >> 8;
	data[3] = timestamp & 0x000000ff;

	//Ecriture de la date sur le service 0005
	setTimeout(function() {
		ble.write(
			idBLE,
			"4E756D27-4178-6573-0000-000000000000",
			"4E756D27-4178-6573-0001-000000000005",
			data.buffer,
			function() {
				console.log("CYRIL write 00005 ok : " + data[3] + " " +
							data[2] + " " + data[1] + " " + data[0]);
				//en cas de succès enregistrement des notifications
				setTimeout(function() {
					ble.startNotification(
						idBLE,
						"4E756D27-4178-6573-0000-000000000000",
						"4E756D27-4178-6573-0001-000000000004",
						dataNotificationEventBLE,
						function(failure) {
							//en cas d'erreur, on recommence le processus
							console.log("startnotif aboie failed " +
													JSON.stringify(failure));
							aboiementRunning = false;
							setTimeout(function() {
								GetLastDateFromDB(dataStartNotifAboiement);
							}, 1000);
						}
					);
				}, 10000);
			},
			function() {
				//en cas d'erreur, on recommence le processus
				aboiementRunning = false;
				console.log("CYRIL write 00005 failed");
				GetLastDateFromDB(dataStartNotifAboiement);
			}
		);
	}, 10000);
};

/*!
 * variable globale permettant de savoir si la vérification de la mise à jour de
 * l'heure a déjà été faite
 */
var timeUpdated = false;

/*!
 * interprète les notifications du service 2A2B. Cette fonction contrôle si
 * l'heure a déjà mise jour. Dans le cas négatif, elle vérifie la dérive de
 * l'heure reçu et met à jour si supérieur à 15 secondes. Une fois l'heure à
 * jour, cette fonction déclenche le processus d'enregistrement des
 * notifications d'aboiements.
 */
dataNotificationEventBLE_time = function(data) {
	console.log("notif 2A2B " + data);

	//si l'heure est déjà à jour => stopper les notifications de ce service
	if (timeUpdated) {
		ble.stopNotification(
			idBLE,
			"4E756D27-4178-6573-0000-000000000000",
			"2A2B",
			function() {
				//register to notification
				//dataStartNotifAboiement();
				GetLastDateFromDB(dataStartNotifAboiement);
				console.log("stopnotif 2A2B ok");
			},
			function() {
				console.log("stopnotif 2A2B failed");
			}
		);
		return;
	}
	//sinon contrôler l'heure et mettre à jour

	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();
	data = new Uint8Array(data);

	//conversion du timestamp FAT32 reçu en objet date
	var year = (data[1] << 8) + data[0]; //[LSO MSO]
	var month = data[2] - 1;
	var day = data[3];
	var hour = data[4];
	var minute = data[5];
	var second = data[6];
	var dow = data[7];
	var frac = data[8];
	var adj = data[9];

	var deviceDate = new Date(Date.UTC(year, month, day, hour, minute, second));
	var currentDate = Date.now();

	console.log("date check " + deviceDate.getTime() + " " + currentDate);

	//comparaison de la date reçue et de la date actuelle
	if (Math.abs(currentDate - deviceDate.getTime()) > 15 * 1000) {
		// écart supérieur à 15 secondes
		//conversion de la date courante en timestamp FAT32
		currentDate = new Date();
		// LSO : Year on 2 byte in little endian
		data[1] = (currentDate.getUTCFullYear() & 0xff00) >> 8;
		// MSO
		data[0] = currentDate.getUTCFullYear() & 0xff;
		data[2] = currentDate.getUTCMonth() + 1;
		data[3] = currentDate.getUTCDate();
		data[4] = currentDate.getUTCHours();
		data[5] = currentDate.getUTCMinutes();
		data[6] = currentDate.getUTCSeconds();
		data[7] = currentDate.getUTCDay();
		data[8] = 0;
		data[9] = 0;

		//écriture du service 2A2B avec la nouvelle date pour mise à jour
		ble.write(
			idBLE,
			"4E756D27-4178-6573-0000-000000000000",
			"2A2B",
			data.buffer,
			function() {
				console.log("CYRIL write 2A2B ok");

				if (!timeUpdated) {
					swal({
						html: LangItem("CS000030") + AddCloseIcoForSwal(),
						confirmButtonColor: "#ddd",
						onOpen: function() {
							// permet de désactiver le focus sur le bouton
							// activé automatiquement par la lib
							document.activeElement.blur();
							$(".swal2-confirm").css({
								// modification du style du bouton changé
								//  dynamiquement par la lib
								color: "#000",
								"box-shadow": "0 2px 6px #ccc",
								background:
									"linear-gradient(#ffffff, #fcfcfc 40%, " +
													"#f1f0f1 80%, #e6e6e6)",
								border: "1px solid #aaa",
								"border-radius": "5px"
							});
						},
						showConfirmButton: true
					}).then(function(result) {
						// on ferme la popup
						swal.close();
					});
				}

				// Mise à jour de l'heure finalisée : stopper la notification
				// sur 2A2B
				ble.stopNotification(
					idBLE,
					"4E756D27-4178-6573-0000-000000000000",
					"2A2B",
					function() {
						// Sur un succès démarrer les notifications d'aboiements
						GetLastDateFromDB(dataStartNotifAboiement);
						console.log("CYRIL stopnotif 2A2B ok");
					},
					function() {
						console.log("CYRIL stopnotif 2A2B failed");
					}
				);
			},
			function() {
				console.log("CYRIL write 2A2B failed");
				timeUpdating = false;
			}
		);

		//déclenchement des animations pour la communication BLE
		UpdateConnectionStatusIcon();
	} else {
		//date à l'heure

		timeUpdated = true;

		ble.stopNotification(
			idBLE,
			"4E756D27-4178-6573-0000-000000000000",
			"2A2B",
			function() {
				//Sur un succès démarrer les notifications d'aboiements
				GetLastDateFromDB(dataStartNotifAboiement);
				console.log("stopnotif 2A2B ok");
			},
			function() {
				//en cas d'erreur nouvel essai à la prochaine notification
				console.log("stopnotif 2A2B failed");
			}
		);
	}
};

/*!
 * interprète les notifications du service 2A19. Cette fonction enregistre le
 * niveau de batterie dans les données de l'animal (unité en %).
 * \fn dataNotificationEventBLE_Battery
 * \param data contient les données reçues
 */
dataNotificationEventBLE_battery = function(data) {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//lecture de la donnée
	var batt = new Uint8Array(data);
	//mise à jour des données de l'animal
	user.dogs[selectedDog].batt = batt[0];
	//mise à jour de l'IHM
	UpdateBatteryIcon(user.dogs[selectedDog].batt);
	//sauvegarde des nouvelles données
	SaveUserData();

	console.log("notif 2A19 " + batt[0]);
};

/*!
 * interprète les notifications du service ...0000. Cette fonction enregistre le
 * mode configuré dans les données de l'animal.
 * \fn dataNotificationEventBLE_mode
 * \param data contient les données reçues
 */
dataNotificationEventBLE_mode = function(data) {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();
	//lecture de la donnée
	var mode = new Uint8Array(data);
	//mise à jour des données de l'animal
	user.dogs[selectedDog].mode = mode[0];
	//sauvegarde des nouvelles données
	SaveUserData();

	console.log("notif 4E756D27-4178-6573-0001-000000000000 " + data);
};

/*!
 * interprète les notifications du service ...0001. Cette fonction enregistre la
 * sensibilité configurée dans les données de l'animal.
 * \fn dataNotificationEventBLE_sensibility
 * \param data contient les données reçues
 */
dataNotificationEventBLE_sensibility = function(data) {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();
	//lecture de la donnée
	var detectionLevel = new Uint8Array(data);
	//mise à jour des données de l'animal
	user.dogs[selectedDog].detectionLevel = detectionLevel[0];
	//sauvegarde des nouvelles données
	SaveUserData();

	console.log("notif 4E756D27-4178-6573-0001-000000000001 " + data);
};

/*!
 * interprète les notifications du service ...0002. Cette fonction enregistre la
 * programmation plage 1 configuré dans les données de l'animal.
 * \fn dataNotificationEventBLE_prog1
 * \param data contient les données reçues
 */
dataNotificationEventBLE_prog1 = function(data) {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();
	//lecture de la donnée
	data = new Uint32Array(data);

	//mise à jour des données de l'animal
	for (var i = 23; i >= 0; i--) {
		//lundi
		user.dogs[selectedDog].schedule.monday[i] =
												data[0] & (1 << i) ? 1 : 0;

		//mardi
		user.dogs[selectedDog].schedule.tuesday[i] =
												data[1] & (1 << i) ? 1 : 0;

		//mercredi
		user.dogs[selectedDog].schedule.wednesday[i] =
												data[2] & (1 << i) ? 1 : 0;

		//jeudi
		user.dogs[selectedDog].schedule.thursday[i] =
												data[3] & (1 << i) ? 1 : 0;
	}
	//sauvegarde des nouvelles données
	SaveUserData();

	console.log("notif 4E756D27-4178-6573-0001-000000000002 " + data);
};

/*!
 * interprète les notifications du service ...0003. Cette fonction enregistre la
 * programmation plage 2 configuré dans les données de l'animal.
 * \fn dataNotificationEventBLE_prog2
 * \param data contient les données reçues
 */
dataNotificationEventBLE_prog2 = function(data) {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();
	//lecture de la donnée
	data = new Uint32Array(data);

	//mise à jour des données de l'animal
	for (var i = 23; i >= 0; i--) {
		//vendredi
		user.dogs[selectedDog].schedule.friday[i] =
												data[0] & (1 << i) ? 1 : 0;

		//samedi
		user.dogs[selectedDog].schedule.saturday[i] =
												data[1] & (1 << i) ? 1 : 0;

		//dimanche
		user.dogs[selectedDog].schedule.sunday[i] =
												data[2] & (1 << i) ? 1 : 0;
	}
	//sauvegarde des nouvelles données
	SaveUserData();

	console.log("notif 4E756D27-4178-6573-0001-000000000003 " + data);
};

/*!
 * bufferise les notifications du service ...0004. Cette fonction permet de
 * rendre très rapidement la main au système pour la gestion des notifications.
 * Leur traitement est effectué quand le système à le temps.
 * \fn dataNotificationEventBLE
 * \param data contient les données reçues
 */
dataNotificationEventBLE = function(data) {
	setTimeout(function() {
		addEventToLog(data);
	}, 0);
};

/*!
 * interprète les notifications du service ...0004. Cette fonction enregistre
 * les aboiements dans les données de l'animal.
 * \fn addEventToLog
 * \param data contient les données reçues
 */
addEventToLog = function(data) {
	//déclenchement des animations pour la communication BLE
	UpdateConnectionStatusIcon();

	//lecture de la donnée
	data = new Uint8Array(data);

	// conversion du timestamp FAT32 en date
	// FAT32 timestamp reçu en UTC
	var timestamp = (data[1] << 24) + (data[2] << 16) + (data[3] << 8) +
					data[4];
	var sec = (timestamp & 0x1f) << 1;
	var min = (timestamp & 0x7e0) >> 5;
	var hr = (timestamp & 0xf800) >> 11;
	var d = (timestamp & 0x1f0000) >> 16;
	var m = (timestamp & 0x1e00000) >> 21;
	var y = (timestamp & 0xfe000000) >> 25;
	//lecture du type de sanction
	var sanction = data[0];

	// timestamp converti en objet date MAIS avec le time zone du mobile
	var date = new Date(Date.UTC(y + 1980, m - 1, d, hr, min, sec));
	timestamp = date.getTime();

	// injection dans la bdd (c-a-d stockage dans la table des aboiements
	// spécifique à l'animal sélectionné))
	InsertDataIntoDB({
		// ajout de l'évènement
		timestamp: timestamp,
		sanction: sanction
	});

	console.log("notif 4E756D27-4178-6573-0001-000000000004 " + data);
};

/*!
 * permet d'écrire via le BLE la nouvelle configuration du mode de sanction.
 * \fn sendDataConfig_mode_BLE
 */
sendDataConfig_mode_BLE = function() {
	console.log("Save mode");

	//mode
	var data = new Uint8Array(1);
	data[0] = user.dogs[selectedDog].mode;
	ble.write(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000000",
		data.buffer
	);
	UpdateConnectionStatusIcon();
};

/*!
 * permet d'écrire via le BLE la nouvelle configuration de sensibilité.
 * \fn sendDataConfig_sensibilite_BLE
 */
sendDataConfig_sensibilite_BLE = function() {
	console.log("Save sensibility");

	//sensibilité
	data = new Uint8Array(1);
	data[0] = user.dogs[selectedDog].detectionLevel;
	ble.write(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000001",
		data.buffer
	);
	UpdateConnectionStatusIcon();
};

/*!
 * permet d'écrire via le BLE l nouvelle configuration de la programmation
 * plage 1
 * \fn sendDataConfig_prog1_BLE
 */
sendDataConfig_program1_BLE = function() {
	console.log("Save program 1");

	//program1
	data = new Uint32Array(4);
	for (var i = 0; i < 4; i++) {
		data[i] = 0;
	}
	for (var i = 0; i < 24; i++) {
		//lundi
		data[0] |= user.dogs[selectedDog].schedule.monday[i] << i;

		//mardi
		data[1] |= user.dogs[selectedDog].schedule.tuesday[i] << i;

		//mercredi
		data[2] |= user.dogs[selectedDog].schedule.wednesday[i] << i;

		//jeudi
		data[3] |= user.dogs[selectedDog].schedule.thursday[i] << i;
	}
//	console.log("JLAF -> " + data);
	ble.write(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000002",
		data.buffer
	);
	UpdateConnectionStatusIcon();
};

/*!
 * permet d'écrire via le BLE l nouvelle configuration de la programmation
 * plage 2
 * \fn sendDataConfig_prog2_BLE
 */
sendDataConfig_program2_BLE = function() {
	console.log("Save program 2");

	//program2
	data = new Uint32Array(3);
	for (var i = 0; i < 3; i++) {
		data[i] = 0;
	}
	for (var i = 0; i < 24; i++) {
		//vendredi
		data[0] |= user.dogs[selectedDog].schedule.friday[i] << i;

		//samedi
		data[1] |= user.dogs[selectedDog].schedule.saturday[i] << i;

		//dimanche
		data[2] |= user.dogs[selectedDog].schedule.sunday[i] << i;
	}
//	console.log("JLAF -> " + data);
	ble.write(
		idBLE,
		"4E756D27-4178-6573-0000-000000000000",
		"4E756D27-4178-6573-0001-000000000003",
		data.buffer
	);
	UpdateConnectionStatusIcon();
};

/*!
 * permet d'atteindre que les fonctionalités cordova soient initialisées avant
 * utilisation du BLE
 * \fn BLEisWaitingAppInit
 */
BLEisWaitingAppInit = function() {
	if (!app.isInitialized) setTimeout(BLEisWaitingAppInit, 200);
	else
		initBLE(function() {
			BLEIsAvailable_Timeout = setTimeout(
				checkBLEStatus,
				BLEIsAvailable_Duration
			);
		});
};
