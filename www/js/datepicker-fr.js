/* French initialisation for the jQuery UI date picker plugin. */
/* Written by Keith Wood (kbwood{at}iinet.com.au),
			  Stéphane Nahmani (sholby@sholby.net),
			  Stéphane Raimbault <stephane.raimbault@gmail.com> */
( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "../widgets/datepicker" ], factory );
	} else {

		// Browser globals
		factory( jQuery.datepicker );
	}
}( function( datepicker ) {

datepicker.regional.fr = {
    beforeShowDay: function(d) {
//        var availableDates = ["2020-01-05", "2020-01-10", "2020-01-14"];
        var dmy = (d.getMonth() + 1);
        if(d.getMonth() < 9)
            dmy = "0" + dmy;
        dmy += "-";

        if(d.getDate() < 10) dmy += "0";
            dmy+=d.getDate() + "-" + d.getFullYear();

//        console.log(dmy+' : '+($.inArray(dmy, availableDates)));

//        if ($.inArray(dmy, availableDates) != -1) {
            return [true, "#bark-day","Aboiements"];
//        } else{
//             return [false,"nobark-day","unAvailable"];
//        }
    },
    onChangeMonthYear: function(year, month, inst) {
        console.log(month + '/' + year);
    },
	closeText: "Fermer",
	prevText: "Précédent",
	nextText: "Suivant",
	currentText: "Aujourd'hui",
	monthNames: [ "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
		"Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ],
	monthNamesShort: [ "janv.", "févr.", "mars", "avr.", "mai", "juin",
		"juil.", "août", "sept.", "oct.", "nov.", "déc." ],
	dayNames: [ "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi" ],
	dayNamesShort: [ "dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam." ],
	dayNamesMin: [ "D","L","M","M","J","V","S" ],
	weekHeader: "Sem.",
	dateFormat: "dd/mm/yy",
	firstDay: 1,
	isRTL: false,
	showMonthAfterYear: false,
	yearSuffix: "" };
datepicker.setDefaults( datepicker.regional.fr );

return datepicker.regional.fr;

} ) );
