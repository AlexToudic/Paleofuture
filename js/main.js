$(function() {
	//$('#home').css({'height': window.innerHeight});
	//$('#content').css({'height': window.innerHeight});
	//$('#grid').css({'height': window.innerHeight-$('header').css('height').substr(0, $('header').css('height').length-2)+'px'});

	$('#travel').on('click', function(){
		$('#home').animate({'margin-top': -window.innerHeight+'px'}, 1000);
	});
});
