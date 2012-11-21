$(function() {
	/*----------------------------------------------------
				  1- INTERFACE ADAPTATION
	----------------------------------------------------*/

	$('#travel').on('click', function(){
		$('#home').animate({'margin-top': -window.innerHeight+'px'}, 500);
	});

	$('#layer2').css({'margin-top': -window.innerHeight+50+'px'});

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
	$('#layer2').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+amount+', t 10.0)'});
	//$('#grid').css({'-webkit-transform': 'scale(1)'});

	$('#layer1').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+(amount+2893)+', t 10.0)'});


	var scroll1 = Math.pow(200*amount, (1/3));
	var scroll2 = Math.pow(200*(amount+2893), (1/3));

	$('#space').mousewheel(function(event, delta, deltaX, deltaY) {
		if(delta > 0)
		{
			scroll1 += 1.0;
			scroll2 += 1.0;	
		}
		if(delta < 0)
		{
			scroll1 -= 1.0;
			scroll2 -= 1.0;
		}

		d1Amount = parseInt((scroll1*scroll1*scroll1)/200, 10);
	    $('#layer2').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d1Amount+', t 10.0)'});

	    d2Amount = parseInt((scroll2*scroll2*scroll2)/200, 10);
	    $('#layer1').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d2Amount+', t 10.0)'});
		//$('#grid').css({'-webkit-transform': 'scale('+0.2*dAmount+')'});
	});

    Backbone.history.start();
});