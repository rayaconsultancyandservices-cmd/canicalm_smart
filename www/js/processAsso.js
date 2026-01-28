/*!
 * variable globale Fixant la durée de l'intervalle de vérification de
 * l'activation du module BLE
 */
var AnimalAssociation_Duration = 30000;

/*!
 * variable globale décrivant l'état du scan BLE (actif, inactif)
 */
var scanning = false;

/*!
 * permet de démarrer le scan BLE pour l'association du collier
 * \fn associationSearchDeviceCanicalm
 */
associationSearchDeviceCanicalm = function() {
	//start scan
	scanning = true;
	associationTimingScan();
};

/*!
 * permet de gérer le fonctionnement du scan BLE. En effet pour les plateformes
 * Android 5.xx le scan doit être limité dans le temps. Il faut donc
 * l'interrompre régulièrement et le redémarrer
 * \fn associationTimingScan
 */
associationTimingScan = function() {
//  console.log("CYRIL asso timing");
	if (scanning) {
		//si le scan est toujours actif
//		console.log("CYRIL asso timing : stop");

		//arrêter le scan courant
		ble.stopScan();

		//reprendre le scan après 100ms de pause
		setTimeout(function() {
//			console.log("CYRIL asso timing : start");
			ble.startScan(
				[],
				associationCheckFoundDeviceCanicalm,
				associationStartBLEScanFailed
			);

			//interrompre le scan après 2 secondes
			setTimeout(associationTimingScan, 2000);
		}, 100);
	}
};

/*!
 * permet de gérer un échec lors du démarrage d'un scan BLE
 * \fn associationStartBLEScanFailed
 */
associationStartBLEScanFailed = function() {
	//stopscan if still running
	ble.stopScan();

	//restartscan after few second
	setTimeout(associationTimingScan, 5000);
};

/*
 * vérifie si le periphérique bluetooth est un CANICALM
 */
deviceIsCanicalm = function(device) {
	if (device.name === "CANICALM-SMART") {
		return true;
	} else {
		if (device.advertising !== undefined &&
			device.advertising.kCBAdvDataLocalName !== undefined &&
			device.advertising.kCBAdvDataLocalName === "CANICALM-SMART") {
			return true;
		} else {
			return false;
		}
	}
};

/*!
 * permet de vérifier les périphériques BLE trouvés lors du scan.
 * \fn associationCheckFoundDeviceCanicalm
 * \param les propriétés du périphériques
 */
associationCheckFoundDeviceCanicalm = function(device) {
	console.log("device info: ", JSON.stringify(device));
	if (deviceIsCanicalm(device)) {
		//si le nom de device est celui de canical-smart
		console.log("canicalm device found");
		if (SearchForDeviceAlreadyAssociated(device.id) == false) {
			//si le collier n'est pas déjà associé, le faire
			console.log("no associate device found");
			//find it!!!!

			//arrêt du scan
			scanning = false;
			ble.stopScan();
			clearTimeout(AnimalAssociation_Timeout);

			//creation des données du nouvel animal associé au collier
			//avec une demande de saisi de nom pour l'utilisateur
			swal({
				html: LangItem("CS000027") + AddCloseIcoForSwal(),
				input: "text",
				showCancelButton: false,
				onOpen: function() {
					$(".swal2-confirm").css({
						// modification du style du bouton changé dynamiquement
						// par la lib
						color: "#000",
						"box-shadow": "0 2px 6px #ccc",
						background: "linear-gradient(#ffffff, #fcfcfc 40%," +
													"#f1f0f1 80%, #e6e6e6)",
						border: "1px solid #aaa",
						"border-radius": "5px"
					});
					$(".swal2-input").keypress(function(event) {
						if (event.which == 13) {
							console.log("event 13");
							event.preventDefault();
							document.activeElement.blur();
							$(".swal2-confirm").click();
						}
					});
				},
				preConfirm: function(name) {
					console.log("preConfirm name:", JSON.stringify(name));
					return new Promise(function(resolve, reject) {
						if (name == "") {
							swal.showValidationError(LangItem("CS000028"));
							reject();
						} else {
							resolve(name);
						}
					});
				}
			})
			.then(function(result) {
				console.log("result:", JSON.stringify(result));
				//enregistrement du nouveau couple animal/collier avec des
				// données vierges
				if (result.value) {
					var dog = {
						name: result.value,
						batt: 20,
						id: device.id,
						detectionLevel: 60,
						schedule : {
							monday      : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
										   0,0,0,0,0,0],
							tuesday     : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
										   0,0,0,0,0,0],
							wednesday   : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
										   0,0,0,0,0,0],
							thursday    : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
										   0,0,0,0,0,0],
							friday      : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
										   0,0,0,0,0,0],
							saturday    : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
										   0,0,0,0,0,0],
							sunday      : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
										   0,0,0,0,0,0],
						}
					};
					user.dogs.push(dog);
					saveDataToStorage("user", user);
					console.log(user.dogs);
					selectedDog = -1;
					removeDemoDog();
					setTimeout(function() {
						DogSelection(user.dogs.length - 1);
					}, 2000);
//					DogSelection(user.dogs.length - 1);
				}
			})
			.catch(function(err) {
				console.log("error:", error);
			});
		} else {
			console.log("device al-ready associated");
		}
	} else {
		console.log(device.name, "not a canicalm device");
	}
};
