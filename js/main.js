$(function() {
	//$('#home').css({'height': window.innerHeight});
	//$('#content').css({'height': window.innerHeight});
	//$('#grid').css({'height': window.innerHeight-$('header').css('height').substr(0, $('header').css('height').length-2)+'px'});

	$('#travel').on('click', function(){
		$('#home').animate({'margin-top': -window.innerHeight+'px'}, 500);
	});

	$('#main-articles').children().css({'margin-top': window.innerHeight+'px'});


	var i = 0;
	$('.grid').on('click', function(){
		$($('#main-articles').children()[i]).animate({'margin-top': '10px'}, 500);
		++i;
	});
});
