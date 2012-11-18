$(function() {
	/*----------------------------------------------------
				  1- INTERFACE ADAPTATION
	----------------------------------------------------*/

	$('#travel').on('click', function(){
		$('#home').animate({'margin-top': -window.innerHeight+'px'}, 500);
	});
	$('#grid').css({'height' : window.innerHeight-50+'px'});

	$('#article-details').css({'margin-top': -window.innerHeight+'px'});

	$('#content').on('click', function(){
		$('#article-details').addClass('flip');
		$('#content').addClass('flip');
	});

	$('#article-details').on('click', function(){
		$('#article-details').removeClass('flip');
		$('#content').removeClass('flip');
	});
});
