/*
 * code javascript qui s'occupe de la gestions des données se trouvant sous
 * différentes forme :
 *		- variable globale (en mémoire)
 *		- stokage non volatile de l'appareil.
 *		- base de données SQL.
 *
 * La variable globale concernée par ce code est avant tout l'objet "user" dont
 * la structure de données est la suivantes :
 *
 * user : Object [
 *		lang : string
 *		dogs : Array of Object [
 *			name: string
 *			batt: integer
 *			id: string
 *			detectionLevel: integer
 *			mode: integer
 *			schedule : Object [
 *				monday : Array of boolean[24]
 *				tuesday : Array of boolean[24]
 *				wednesday : Array of boolean[24]
 *				thursday : Array of boolean[24]
 *				friday : Array of boolean[24]
 *				saturday : Array of boolean[24]
 *				sunday : Array of boolean[24]
 *			]
 *		]
 * ]
 *
 * Le stockage non volatile de l'appareil consiste à stocker et recharger
 * l'objet globale "user" sous la clé de stockage "user".
 */

var storage = window.localStorage;

var DataToSave = [];
var DataToDisplay = [];
var currentTimestampUsed = 0;
var availableDates = [];
var availableCounts = [];

var db = null;

/*!
 * variable permettant de vérifier à intervalle régulier si une lecture de
 * fichier doit être faite
 */
var GetData_Timeout = null;

/*!
 * variable fixant la durée de l'intervalle de vérification d'un besoin de
 * lecture de fichier
 */
var GetData_Duration = 3000;

/*!
 * variable permettant de vérifier à intervalle régulier si une écriture de
 * fichier doit être faite
 */
var SetData_Timeout = null;

/*!
 * variable fixant la durée de l'intervalle de vérification d'un besoin
 * d'écriture de fichier
 */
var SetData_Duration = 3000;

var user = null;

var selectedDog = -1;

var clusterSchedule = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

/*!
 * sauvegarde une donnée dans les données de stockage de l'appareil pour sa
 * récupération au prochain lancement de l'application.
 * \fn saveDataToStorage(key, toStore)
 * \param string key     La clé de stockage de la donnée.
 * \param object toStore Le contenu de la donnée à stocker.
 */
function saveDataToStorage(key, toStore) {
	storage.setItem(key, JSON.stringify(toStore));
}

/*!
 * récupère une donnée depuis les données de stockage de l'appareil pour
 * repartir avec son contenu précédement stocké grâce à saveDataToStorage.
 * \fn saveDataToStorage(key)
 * \param string key La clé de stockage de la donnée.
 * \return object	 Le contenu de la donnée recupérée.
 */
function getDataFromStorage(key) {
	return JSON.parse(storage.getItem(key));
}

/*!
 * sauvegarde les données de l'utilisateur dans les données de stockage de
 * l'appareil pour leur récupération au prochain lancement de l'application.
 * \fn SaveUserData()
 */
function SaveUserData() {
	saveDataToStorage("user", user);
}

/*!
 * charge les données de l'utilisateur et/ou initialise ces données si
 * l'utilisateur n'en a pas encore.
 * \fn loadUserProperties()
 * \return boolean true si l'utilisateur possédait bien des données, false si
 *				   on a dû les initialiser.
 */
function loadUserProperties() {
	user = getDataFromStorage("user");

	if (user == null) {
		user = {
			lang: "fr",
			dogs: []
		};

		saveDataToStorage("user", user);
		return false;
	}
	return true;
}

/*!
 * permet de récupérer la valeur du timestamp pour minuit du jour passé en
 * paramètre, si le paramètre n'est pas donné, le retour correspond au jour en
 * cours
 * \fn GetMidnightTimestamp(timestamp)
 * \param integer  timestamp Le timestamp dont on veut le valeur pour minuit.
 * \return integer retourne le timestamp pour minuit du jour s'il est passé en
 *				   paramètre ou du jour même le cas échéant.
 */
function GetMidnightTimestamp(timestamp) {
	var _date = null;

	if (timestamp === undefined) {
		_date = new Date();
	} else {
		_date = new Date(timestamp);
	}
	_date.setHours(0);
	_date.setMinutes(0);
	_date.setSeconds(0);
	_date.setMilliseconds(0);
	return Date.UTC(
		_date.getFullYear(),
		_date.getMonth(),
		_date.getDate(),
		_date.getHours(),
		_date.getMinutes(),
		_date.getSeconds(),
		_date.getMilliseconds()
	);
}

/*!
 * modifie une chaine de caractère pour la rendre compatible avec un nom de
 * table utilisé pour le stockage des données d'un collier.
 * \fn EscapeDirName(dirName)
 * \param string  La chaine de caractères à rendre compatible avec un nom de
 *				  table.
 * \return string Lachaine de carctères modifiée pour être compatible avec un
 *				  nom de table.
 */
function EscapeDirName(dirName) {
	return dirName.replace(/[:]/g, "");
}

/*!
 * affichage de la boite de dialogue de confirmation de la suppression du chien
 * selectionné. Si confirmation, suppresion du chien de la base de données.
 * \fn RemoveData()
 */
function RemoveData() {
	swal({
		html: LangItem("CS000032") + "<b>" + user.dogs[selectedDog].name +
			  "</b>?" + AddCloseIcoForSwal(),
		confirmButtonColor: "#ddd",
		confirmButtonText: LangItem("CS000033"),
		onOpen: function() {
			// permet de désactiver le focus sur le bouton activé
			// automatiquement par la lib
			document.activeElement.blur();
			$(".swal2-confirm").css({
				// modification du style du bouton changé dynamiquement par la
				// lib
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
		if (result.value) {
			swal({
				html: LangItem("CS000035") + "<b>" +
					  user.dogs[selectedDog].name + "</b>" +
					  LangItem("CS000036") + AddCloseIcoForSwal(),
				confirmButtonColor: "#ddd",
				confirmButtonText: LangItem("CS000037"),
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
				if (result.value) {
					DeleteTableFromDB(function() {
						if (BLECurrentlyConnected == true) {
							clearTimeout(BLEIsAvailable_Timeout);
							BLECurrentlyConnected = false;
							ble.disconnect(
								user.dogs[selectedDog].id,
								function() {
									user.dogs.splice(selectedDog, 1);
									// enregistrement du changement dans le
									// cache de l'application
									saveDataToStorage("user", user);
									LoadPage("index");
								},
								function() {
									user.dogs.splice(selectedDog, 1);
									// enregistrement du changement dans le
									// cache de l'application
									saveDataToStorage("user", user);
									LoadPage("index");
								}
							);
						} else {
							user.dogs.splice(selectedDog, 1);
							// enregistrement du changement dans le cache de
							// l'application
							saveDataToStorage("user", user);
							LoadPage("index");
						}
					});
				}
			});
		}
	});
}

/*!
 * affichage de la boite de dialogue pour renomer le chien selectionné. Si
 * validation, sauvegarde dans la base de données
 * \fn RenameCurrentAnimal()
 */
function RenameCurrentAnimal() {
	swal({
		html: LangItem("CS000027") + AddCloseIcoForSwal(),
		input: "text",
		inputValue: user.dogs[selectedDog].name,
		showCancelButton: false,
		onOpen: function() {
			$(".swal2-confirm").css({
				// modification du style du bouton changé dynamiquement par la
				// lib
				color: "#000",
				"box-shadow": "0 2px 6px #ccc",
				background:
					"linear-gradient(#ffffff, #fcfcfc 40%, #f1f0f1 80%, " +
									"#e6e6e6)",
				border: "1px solid #aaa",
				"border-radius": "5px"
			});
			$(".swal2-input").keypress(function(event) {
				if (event.which == 13) {
					event.preventDefault();
					document.activeElement.blur();
					$(".swal2-confirm").click();
				}
			});
		},
		preConfirm: function(name) {
			return new Promise(function(resolve, reject) {
				if (name == "") {
					swal.showValidationError(LangItem("CS000028"));
					reject();
				} else resolve();
			});
		}
	}).then(function(result) {
		if (result.value) {
			user.dogs[selectedDog].name = result.value;
			saveDataToStorage("user", user);
			LoadPage("param");
		}
	});
}

/*!
 * recheche si un Canicalm Smart à déjà été associé.
 * \fn SearchForDeviceAlreadyAssociated(deviceId)
 * \param string   deviceId L'identifiant du canicalm smart recherché.
 * \return boolean true si le canicalm demandé à déjà été associé.
 */
function SearchForDeviceAlreadyAssociated(deviceId) {
	var found = false;
	for (var i = 0; i < user.dogs.length; i++) {
		if (user.dogs[i].id == deviceId) {
			found = true;
			break;
		}
	}
	return found;
}

/*!
 * compare deux objets pour pouvoir les trier à partir de leur timestamp.
 * \fn SortHistoryData(a, b)
 * \param object a Le premier objet à comparer.
 * \param object b Le second objet à comparer.
 * \return integer -1, 0 ou 1 selon que le timestamp de l'objet a est plus
 *				   petit, égale ou plus grand que celui de l'objet b.
 */
function SortHistoryData(a, b) {
	if (a.timestamp < b.timestamp) return -1;
	if (a.timestamp > b.timestamp) return 1;
	return 0;
}

/*!
 * ouvre la base de données.
 * \fn OpenDB()
 * \return object La base de données qui vient d'être ouverte.
 */
function OpenDB() {
	//console.log("OpenDB pour " + device.platform);
	if (device.platform == "Android") {
		// si on est sous Android
		return window.sqlitePlugin.openDatabase({
			name: "CanicalmSmart.db",
			/*androidDatabaseImplementation : 2,
			androidLockWorkaround: 1, */
			iosDatabaseLocation: "default"
		});
	} else if (device.platform == "iOS") {
		// si on est sous iOS on affiche un message pour demander l'activation
		return window.sqlitePlugin.openDatabase({
			name: "CanicalmSmart.db",
			location: 2,
			createFromLocation: 1
		});
	} else if (device.platform == "browser") {
		// si on est sous browser
		return window.sqlitePlugin.openDatabase({
			name: "CanicalmSmart.db",
			location: "default"
		});
	} else {
		console.log("OpenDB non géré pour " + device.platform);
		return null;
	}
}

/*!
 * initialise la base de données.
 * \fn InitDB()
 */
function InitDB() {
	//console.log("InitDB");
	if (app.isInitialized == true) {
		db = OpenDB();
		InitDemo();
	} else setTimeout(InitDB, 100);
}

function aboiementsDemo() {
	function addHiver() {
//		console.log("Heure hiver : 30/10/2022");
		// passage heure d'hiver
		var min1 = Date.UTC(2022, 9, 29, 23, 0, 0);
		for (var i = 0 ; i < 240 ; i++) {
//			console.log((new Date(min1 + i * 60 * 1000)));
			demoInsertDataIntoDB(
				(new Date(min1 + i * 60 * 1000)).getTime(),
				((i % 3) + 1)
			);
		}
	}
	setTimeout(addHiver, 0);

	function addEte() {
		console.log("Heure été : 26/03/2023");
		// passage heure d'été
		var min2 = Date.UTC(2023, 2, 26, 0, 0, 0);
		for (var j = 0 ; j < 120 ; j++) {
//			console.log((new Date(min2 + j * 60 * 1000)));
			demoInsertDataIntoDB(
				(new Date(min2 + j * 60 * 1000)).getTime(),
				((j % 3) + 1)
			);
		}
	}
	setTimeout(addEte, 0);
}

/*!
 * rajoute un chien de démo si aucun chien n'a encore été ajouté par
 * l'utilisateur.
 * \fn InitDemo()
 */
function InitDemo() {
	console.log("InitDemo");
	hasDemoDogRegister().then(function(is_registered) {
		console.log("InitDemo => " + is_registered);
		if (!is_registered) {
			if (user.dogs.length > 0) {
				console.log("déjà un chien") ;
				if (user.dogs.length > 1) {
					removeDemoDog();
				}
				return;
			}
			demoCreateAndCheckTableIntoDB()
				.then(function() {
					aboiementsDemo();

					console.log("aboiement 4 mois (env.) en arrière");
					var date1 = new Date();
					var timeZone1 =date1.getTimezoneOffset();
					var date2 = new Date(Date.now() - 120 * 24 * 3600 * 1000);
					var timeZone2 = date2.getTimezoneOffset();

					return demoInsertDataIntoDB(
										date2.getTime() +
										(timeZone2 - timeZone1) * 60 * 1000,
										1);
				})
				.then(function() {
					console.log("ajout chien démo");
					addDemoDogToUser();
					console.log(notFirstUse);
					if (notFirstUse) {
						renderDogList();
					}
				})
				.catch(function(err) {
					console.log("Error couldn't add Demo Data into DB");
				});
			} else if (user.dogs.length > 1) {
				// we have a demo dog plus a real dog ?
				removeDemoDog();
			}
	});
}

/*!
 * suppression du chien de démo.
 * \fn removeDemoDog()
 */
function removeDemoDog() {
	console.log("removeDemoDog");
	db.executeSql(
		"DROP TABLE IF EXISTS table_demo;",
		[],
		function(res) {
			console.log("success dropping table_demo");

			var dogs_without_demo = user.dogs.filter(function(dog) {
				return dog.id != "demo";
			});
			user.dogs = dogs_without_demo;
			renderDogList();
			saveDataToStorage("user", user);
		},
		function(error) {
			console.log("Error while dropping table demo:", error);
		}
	);
}

/*!
 * vérifie si un chien de démo existe
 * \fn hasDemoDogRegister()
 * \return promise qui signalera si le chien de démo à été trouvé ou pas.
 */
function hasDemoDogRegister() {
	console.log("hasDemoDogRegister");
	return new Promise(function(resolve, reject) {
		var query = "SELECT * FROM table_demo";
		db.executeSql(
			query,
			[],
			function(res) {
//				var len = res.rows.length;
//				console.log("hasDemoDogRegister => true " + len);
				resolve(true);
			},
			function(err) {
//				console.log("hasDemoDogRegister => " + err.message);
				resolve(false);
			}
		);
	});
}

/*!
 * creation de la table du chien de demo
 * \fn demoCreateAndCheckTableIntoDB()
 * \return promise qui signalera si la table a été crée ou pas.
 */
function demoCreateAndCheckTableIntoDB() {
	//console.log("demoCreateAndCheckTableIntoDB");
	return new Promise(function(resolve, reject) {
		var query =
			"CREATE TABLE IF NOT EXISTS table_demo (" +
				"id integer primary key, event_timestamp integer, " +
				"event_penalization integer, " +
				"unique(event_timestamp, event_penalization) " +
			"ON CONFLICT IGNORE)";
		db.executeSql(
			query,
			[],
			function(res) {
//				var len = res.rows.length;
//				console.log("demoCreateAndCheckTableIntoDB => true " + len);
				resolve(true);
			},
			function(err) {
//				console.log("demoCreateAndCheckTableIntoDB => " +
//							err.message);
				reject(err);
			}
		);
	});
}

/*!
 * ajout une donnée d'aboiement de démonstration dans la table du chien démo
 * \fn demoInsertDataIntoDB()
 * \param ts	   Le timestamp qui donne la date et heure de l'aboiement
 * \param type	   Le type de réponse donnée à cet aboiement (1 à 3).
 * \return promise qui signalera si l'ajout s'est effectué correctement.
 */
function demoInsertDataIntoDB(ts, type) {
	//console.log("demoInsertDataIntoDB");
	return new Promise(function(resolve, reject) {
		var bark_hour = ts;
		var bark_type = type;
		var db_query =
			"INSERT INTO table_demo (event_timestamp, event_penalization) " +
			"VALUES (?,?)";
		db.executeSql(
			db_query,
			[bark_hour, bark_type],
			function(res) {
//				var len = res.rows.length;
//				console.log("demoInsertDataIntoDB => true " + len);
				resolve(true);
			},
			function(error) {
//				console.log("demoInsertDataIntoDB => " + rerr.message);
				resolve(false);
			}
		);
	});
}

/*!
 * ajout d'un chien de démo au données de l'utilisateur
 * \fn addDemoDogToUser()
 */
function addDemoDogToUser() {
	if (SearchForDeviceAlreadyAssociated("demo"))
	{
		console.log("déjà un chien de démo en cache");
		return;
	}
	var dog = {
		name: "Demo🐶",
		batt: 20,
		id: "demo",
		detectionLevel: 60,
		mode: 2,
		schedule : {
			monday		: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			tuesday		: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			wednesday	: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			thursday	: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			friday		: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			saturday	: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			sunday		: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		}
	};
	user.dogs.push(dog);
	saveDataToStorage("user", user);
}

/*!
 * créer la table de données pour un nouveau chien.
 * \fn CreateAndCheckTableIntoDB()
 */
function CreateAndCheckTableIntoDB() {
	var tableName =
			"table_" + EscapeDirName(user.dogs[selectedDog].id.toString());
	var db_query =
		'CREATE TABLE IF NOT EXISTS "' + tableName + '" (' +
				'id integer primary key, event_timestamp integer, ' +
				'event_penalization integer, ' +
				'unique(event_timestamp, event_penalization) ' +
		'ON CONFLICT IGNORE)';
	db.executeSql(
		db_query,
		[],
		function() {
			console.log("DB : table created.");
		},
		function(error) {
			console.log("DB : Error occurred while creating the table.");
		}
	);
}

/*!
 * ajout ds données dans la table du chien selectionné.
 * \fn InsertDataIntoDB(event)
 * \param object event l'événement d'aboiement à ajouter au chien
 */
function InsertDataIntoDB(event) {
	var tableName =
			"table_" + EscapeDirName(user.dogs[selectedDog].id.toString());
	var db_query =
		'INSERT INTO "' + tableName + '" (' +
				'event_timestamp, event_penalization' +
		') VALUES (?,?)';
	db.executeSql(
		db_query,
		[event.timestamp, event.sanction],
		function() {
			console.log("DB : data inserted");
		},
		function(error) {
			console.log("DB : Error insert data");
		}
	);
}

//
/*!
 * renvoie les données du chien actuellement sélectionné pour un jour précis.
 * \fn GetDayDataFromDB(timestamp, callback)
 * \param object timestamp  le timestamp contenant une heure quelconque dans le
 *							jour souhaité
 * \param function callback La function à appeler quand les donnée seront
 *							disponibles.
 */
function GetDayDataFromDB(timestamp, callback) {
	// ici passer le timestamp du jour concerné à minuit UTC en millisecondes
	timestamp = GetMidnightTimestamp(timestamp);
	var tableName =
		"table_" + EscapeDirName(user.dogs[selectedDog].id.toString());
	// retourne le décalage du client en minutes par rapport à l'heure UTC, à
	// partir de l'UTC => GMT+1 retourne -60
	var timeZone = new Date().getTimezoneOffset();
	// on enlève le timeZone en millisecondes
	var minTime = timestamp + timeZone * 60 * 1000;
	// on ajoute 1 jour en millisecondes
	var maxTime = minTime + 24 * 3600 * 1000;

	var db_query =
		'SELECT * FROM "' +
			tableName +
		'" WHERE event_timestamp >= ' + minTime + " AND " +
				"event_timestamp < " + maxTime;

	db.executeSql(
		db_query,
		[],
		function(results) {
			var data = [];
			// initialisation des 24 tranches d'heure
			for (var i = 0 ; i < 24 ; i++) {
				data.push({
					event: [],
					total: [0, 0, 0]
				});
			}

			var len = results.rows.length;
			var event = null;
			var hour = 0;

			for (var i = 0 ; i < len ; i++) {
				event = {
					timestamp: results.rows.item(i).event_timestamp,
					sanction: results.rows.item(i).event_penalization
				};
				hour = new Date(event.timestamp).getHours();

				// on pousse la donnée dans sa plage horaire correspondante, du
				//  jour correspondant
				data[hour].event.push(event);

				// incrément du type de sanction
				switch (event.sanction) {
					// détectés
					case 1:
						data[hour].total[0]++;
						break;

					// avertis
					case 2:
						data[hour].total[1]++;
						break;

					// sanctionnés
					case 3:
						data[hour].total[2]++;
						break;

					default:
						break;
				}
			}

			if (callback !== undefined) {
				if (callback.length == 1) {
					// callback d'origine qui n'a besoin que des aboiements
					// trouvés
					callback(data);
				} else {
					// callback spécifique pour le calendrier qui veut savoir
					// pour quel jour on a demandé même si réponse vide
					callback(data, timestamp);
				}
			}
		},
		function(error) {
			console.log("db error: ", JSON.stringify(error));
			console.log("sql query causing error:", db_query);
			alert("DB : error getting data");
		}
	);
}

function DeleteTableFromDB(callback) {
	var tableName =
	"table_" + EscapeDirName(user.dogs[selectedDog].id.toString());
	var db_query = 'DROP TABLE IF EXISTS "' + tableName + '"';
	db.executeSql(
		db_query,
		[],
		function(result) {
			console.log("Table deleted successfully.");
			if (callback !== undefined) {
				callback();
			}
		},
		function(error) {
			alert("Error occurred while droping the table.");
		}
	);
}

// renvois la date du dernier évenement reçu pour le chien actuellement
// sélectionné
function GetLastDateFromDB(callback) {
	var tableName =
		"table_" + EscapeDirName(user.dogs[selectedDog].id.toString());
	var db_query =
		'SELECT event_timestamp FROM "' +
		tableName +
		'" ORDER BY event_timestamp DESC LIMIT 1';

	db.executeSql(
		db_query,
		[],
		function(result) {
			if (callback !== undefined) {
				if (result.rows.length > 0)
					callback(new Date(result.rows.item(0).event_timestamp));
				else callback(null);
			}
		},
		function(error) {
			if (callback !== undefined) callback(null);
		}
	);
}

// met à jours les tables des jours avec aboiements et des nombres totals
// d'aboiements pour les jours autour de la date souhaitée.
function udpdateAvailableDatesArround(timestamp) {
	d = new Date(timestamp);
	var max = new Date(d);
	max.setMonth(max.getMonth() + 2);
	if (max > Date.now()) max = new Date(d);

	var min = new Date(d);
	min.setMonth(min.getMonth() - 2);
	var nbDates = 0;


//	console.log(" entre " + min + " et " + max);

	while (min <= max) {
		nbDates++;
		dayTimestamp = min.getTime();
//		console.log(min + " => " + dayTimestamp);
		GetDayDataFromDB(
			dayTimestamp,
			function(data, req_ts) {
				actDay = new Date(req_ts);
				var day = actDay.getDate() + "/";
				if (actDay.getDate() < 10) day = "0" + day;
				if(actDay.getMonth() < 9) day += "0";
				day += (actDay.getMonth() + 1) + "/" + actDay.getFullYear();
//				console.log("callback : " + data.length + " pour " + day);
				var tot = 0 ;
				dayData = data;
				for (var i= 0 ; i < dayData.length ; i++) {
//					console.log(i + " : " + dayData[i].total);
					tot += dayData[i].total[0];
					tot += dayData[i].total[1];
					tot += dayData[i].total[2];
				}
				var p =availableDates.indexOf(day);
				if ((tot != 0) && (p == -1 || availableCounts[p] != tot))
				{
					console.log(day + "=>" + tot);
					if (p != -1) {
						availableDates.splice(p, 1);
						availableCounts.splice(p, 1);
					}
					availableDates.push(day);
					availableCounts.push(tot);
					$('#datepicker').datepicker( "refresh" );
				}
				nbDates--;
			}
		);

		min.setDate(min.getDate() + 1);
	}

	function showPrevNext() {
		if (nbDates == 0) {
			console.log("showPrevNext:");
			$(".ui-datepicker-prev").css({
				display: "block"
			});
			$(".ui-datepicker-next").css({
				display: "block"
			});
		} else setTimeout(showPrevNext, 200);
	}

	setTimeout(showPrevNext, 200);
}

/*!
 * Génére un aboiement détecté de démo pour le jour en cours (séléctionnable via
 * le calendrier) à l'heure actuelle. L'aboiement généré ne tient pas compte ni
 * du mode de sanction, ni de la programmation journalière pour le chien.
 * \fn demoDetected()
 * \return promise qui signalera si l'ajout s'est effectué correctement et
 *				   mettra alors à jour l'affichage en conséquence.
 */
function demoDetected() {
	if (user.dogs.length > 1 || user.dogs[selectedDog].id != "demo") {
		return;
	}
	var d = new Date(currentTimestampUsed);
	console.log(d);
	var n = new Date();
	console.log(n);
	d.setHours(n.getHours());
	d.setMinutes(n.getMinutes());
	d.setSeconds(n.getSeconds());
	console.log(d);

	return demoInsertDataIntoDB(d.getTime(), 1)
				.then(function() {
					GetDayDataFromDB(
						d.getTime(),
						function(data) {
							DataToDisplay = data;
							InitGauges();
							UpdateGaugesForTimestamp();
							udpdateAvailableDatesArround(d) ;
						}
					);
				});
}

/*!
 * Génére un aboiement averti de démo pour le jour en cours (séléctionnable via
 * le calendrier) à l'heure actuelle. L'aboiement généré ne tient pas compte ni
 * du mode de sanction, ni de la programmation journalière pour le chien.
 * \fn demoWarned()
 * \return promise qui signalera si l'ajout s'est effectué correctement et
 *				   mettra alors à jour l'affichage en conséquence.
 */
function demoWarned() {
	if (user.dogs.length > 1 || user.dogs[selectedDog].id != "demo") {
		return;
	}
	var d = new Date(currentTimestampUsed);
	var n = new Date();
	d.setHours(n.getHours());
	d.setMinutes(n.getMinutes());
	d.setSeconds(n.getSeconds());
	return demoInsertDataIntoDB(d.getTime(), 2)
				.then(function() {
					GetDayDataFromDB(
						d.getTime(),
						function(data) {
							DataToDisplay = data;
							InitGauges();
							UpdateGaugesForTimestamp();
							udpdateAvailableDatesArround(d) ;
						}
					);
				});
}

/*!
 * Génére un aboiement sanctionné de démo pour le jour en cours (séléctionnable
 * via le calendrier) à l'heure actuelle. L'aboiement généré ne tient pas compte
 * ni du mode de sanction, ni de la programmation journalière pour le chien.
 * \fn demoPenalized()
 * \return promise qui signalera si l'ajout s'est effectué correctement et
 *				   mettra alors à jour l'affichage en conséquence.
 */
function demoPenalized() {
	if (user.dogs.length > 1 || user.dogs[selectedDog].id != "demo") {
		return;
	}
	var d = new Date(currentTimestampUsed);
	var n = new Date();
	d.setHours(n.getHours());
	d.setMinutes(n.getMinutes());
	d.setSeconds(n.getSeconds());
	return demoInsertDataIntoDB(d.getTime(), 3)
				.then(function() {
					GetDayDataFromDB(
						d.getTime(),
						function(data) {
							DataToDisplay = data;
							InitGauges();
							UpdateGaugesForTimestamp();
							udpdateAvailableDatesArround(d) ;
						}
					);
				});
}

var maxSanctions = 0;
var timeoutSanctions = null;

/*!
 * Remet à zéro le nombre d'aboiement consécutifs sanctionnés pour le simulation
 *  de la protection à 5 sanctons.
 * \fn clearMaxSanctions()
 */
function clearMaxSanctions() {
	maxSanctions = 0;
}

/*!
 * Génére un aboiement de démo pour le jour en cours (séléctionnable via le
 * calendrier) à l'heure actuelle. L'aboiement généré tient compte du mode de
 * sanction et de la programmation journalière pour le chien. Il simule aussi la
 * protection qui limite le nombre de sanction à 5.
 * \fn demoBark()
 * \return promise qui signalera si l'ajout s'est effectué correctement et
 *				   mettra alors à jour l'affichage en conséquence.
 */
function demoBark() {
	if (user.dogs.length > 1 || user.dogs[selectedDog].id != "demo") {
		return;
	}
	var d = new Date(currentTimestampUsed);
	var n = new Date();
	d.setHours(n.getHours());
	d.setMinutes(n.getMinutes());
	d.setSeconds(n.getSeconds());

	var schedule;
	switch (d.getDay()) {
		case 0:
			schedule = user.dogs[selectedDog].schedule.sunday;
			break;

		case 1:
			schedule = user.dogs[selectedDog].schedule.monday;
			break;

		case 2:
			schedule = user.dogs[selectedDog].schedule.tuesday;
			break;

		case 3:
			schedule = user.dogs[selectedDog].schedule.wednesday;
			break;

		case 4:
			schedule = user.dogs[selectedDog].schedule.thursday;
			break;

		case 5:
			schedule = user.dogs[selectedDog].schedule.friday;
			break;

		case 6:
			schedule = user.dogs[selectedDog].schedule.saturday;
			break;

		default:
			schedule = [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0];
	}
	console.log("schedule : " + schedule);
	console.log("UTC : " + d.getUTCHours() + "h" + d.getUTCMinutes());
	console.log("Enable : " + schedule[d.getUTCHours()]);

	var type = 0;
	if (schedule[d.getUTCHours()] == 0) {
		type = 1;
	} else {
		maxSanctions++;
		if (timeoutSanctions != null) {
			clearTimeout(timeoutSanctions);
		}
		if (maxSanctions > 5) {
			type = 1;
			timeoutSanctions = setTimeout(clearMaxSanctions, 15000);
		} else if (user.dogs[selectedDog].mode == 1 || maxSanctions == 1) {
			type = 2;
			timeoutSanctions = setTimeout(clearMaxSanctions, 5000);
		} else {
			type = 3;
			timeoutSanctions = setTimeout(clearMaxSanctions, 5000);
		}
	}

	return demoInsertDataIntoDB(d.getTime(), type)
				.then(function() {
					GetDayDataFromDB(
						d.getTime(),
						function(data) {
							DataToDisplay = data;
							InitGauges();
							UpdateGaugesForTimestamp();
							udpdateAvailableDatesArround(d) ;
						}
					);
				});
}

/*!
 * Permet d'utiliser le bouton "patte de chien" de la barre d'état (en bas) pour
 * simuler une connexion/déconnexion du chien de démonstration. N'a aucun effet
 * sur les véritables colliers.
 * \fn demoConnect()
 */
function demoConnect() {
	if (user.dogs.length > 1 || user.dogs[selectedDog].id != "demo") {
		return;
	}
	console.log("demoConnect");
	BLECurrentlyConnected = !BLECurrentlyConnected;
	UpdateConnectionStatusIcon();
	if (BLECurrentlyConnected) {
		UpdateBatteryIcon(user.dogs[selectedDog].batt);
		$(".param-overlay").css({
			display: "none"
		});
	} else {
		UpdateBatteryIcon(-1);
		$(".param-overlay").css({
			display: "block"
		});
	}
}
