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

	/*----------------------------------------------------
				  2- BACKBONE DECLARATIONS
	----------------------------------------------------*/

	var Article = Backbone.Model.extend();

	var Articles = Backbone.Collection.extend({
		model: Article
	});

	var ArticlesBlock = Backbone.Model.extend({
		articles: new Articles
	});

	var ArticlesBlocks = Backbone.Collection.extend({
		model: ArticlesBlock
	});

    var AppRouter = Backbone.Router.extend({
        routes: {
            "*actions": "defaultRoute" // matches http://example.com/#anything-here
        }
    });
    // Initiate the router
    var app_router = new AppRouter;

    app_router.on('route:defaultRoute', function(actions) {
    })

	/*----------------------------------------------------
				  		3- APPLICATION
	----------------------------------------------------*/
	allArticles = new ArticlesBlock();

	allArticles.fetch({ url: "init.json" }).complete(function() {
    	console.log(allArticles);
	});

	var amount = 75;
	var tempDelta = 0;
	var scroll = 0;
	$('#space').mousewheel(function(event, delta, deltaX, deltaY) {
		++scroll;
		if(scroll%5===0)
		{
			if(tempDelta < delta)
				tempDelta += 1;
			if(tempDelta > delta)
				tempDelta -= 1;

			amount += tempDelta;
		    $('#grid').css({'-webkit-filter': 'custom(url(css/shaders/detached_tiles.vs) mix(url(css/shaders/detached_tiles.fs) normal source-atop), 400 1 border-box detached, amount '+parseInt(amount, 10)+', t 10.0)'});
		}
	});

    Backbone.history.start();
});
