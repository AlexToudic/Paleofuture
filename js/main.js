$(function() {
	/*----------------------------------------------------
				  1- INTERFACE ADAPTATION
	----------------------------------------------------*/

	$('#travel').on('click', function(){
		$('#home').animate({'margin-top': -window.innerHeight+'px'}, 500);
	});

	$('#article-details').css({'margin-top': -window.innerHeight+'px'});

	$('#content').on('click', function(){
		$('#article-details').addClass('flip');
		$('#content').addClass('flip');
	});

	$('#article-details').on('click', function(){
		$('#article-details').removeClass('flip');
		$('#content').removeClass('flip');
	});


	var Article = Backbone.Model.extend();

	var Articles = Backbone.Collection.extend({
		model: Article
	});


});
