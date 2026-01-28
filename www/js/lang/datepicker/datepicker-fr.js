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
		n = new Date;
		var today = n.getDate() + "/";
		if (n.getDate() < 10) today = "0" + today;
		if(n.getMonth() < 9) today += "0";
		today += (n.getMonth() + 1) + "/" + n.getFullYear();
		var day = d.getDate() + "/";
		if (d.getDate() < 10) day = "0" + day;
		if (d.getMonth() < 9) day += "0";
		day += (d.getMonth() + 1) + "/" + d.getFullYear();

//		console.log(availableDates);
		f = $.inArray(day, availableDates);
//		console.log(day + "=> " + f);

		if (f != -1) {
			var text = " Aboiement";
			var nb =  availableCounts[f];
			if (nb > 1) {
				text += "s"
			}
			if (day == today)
			{
				return [true, "", nb + text];
			} else {
				return [true, "ui-state-highlight", nb + text];
			}
		} else{
			return [false,"","Pas d'aboiement"];
		}
	},
    onChangeMonthYear: function(year, month, inst) {
        function hidePrevNext() {
            $(".ui-datepicker-prev").css({
                display: "none"
            });
            $(".ui-datepicker-next").css({
                display: "none"
            });
        }
        setTimeout(hidePrevNext, 200);
        d = new Date(year, month, 15);
		udpdateAvailableDatesArround(d) ;
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
