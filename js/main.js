$(function() {
    var currentDecade = 0;//décennie parcourue
    var filtersDropped = false;
    var scroll = 0;
	var allArticles;
	var allBlocks;
	var way;
	var indexLink = 0;
	var indexFirst = 0;
	var indexToReach = -42;
	var timer;
	var change = 0;
	var smartUser = false;
	var linkUpdate = false;

	/*----------------------------------------------------
				  1- BACKBONE DECLARATIONS
	----------------------------------------------------*/

	var Article = Backbone.Model.extend({
		initialize: function(){
			this.set('cid', this.cid);
			this.set('year', parseInt(this.attributes.year, 10));
			this.set('decade', parseInt(this.attributes.decade, 10));

			//on fixe la vue de la navigation en fonction de si l'article a une image
			//ou seulement du texte
			if(this.get('image'))
				this.set('tinyView', new ArticleBlockPicView({'model': this}));
			else
				this.set('tinyView', new ArticleBlockTxtView({'model': this}));

			this.set('view', new ArticleView({'model': this}));
		}
	});

	var ArticleBlockTxtView = Backbone.View.extend({
	    initialize: function(){
	      	this.source = $("#article-text-template").html();
	      	this.template = Handlebars.compile(this.source);
	    },
	    render: function(el){
	    	$(el).append(this.template(this.model.toJSON()));
	    }
	});

	var ArticleBlockPicView = Backbone.View.extend({
	    initialize: function(){
	      	this.source = $("#article-picture-template").html();
	      	this.template = Handlebars.compile(this.source);
	    },
	    render: function(el){
	    	$(el).append(this.template(this.model.toJSON()));
	    }
	});

	var ArticleView = Backbone.View.extend({
		el: '#article-details',
	    initialize: function(){
	      	this.source = $("#article-template").html();
	      	this.template = Handlebars.compile(this.source);
	    },
	    render: function(){
	    	$(this.el).html(this.template(this.model.toJSON()));
	    }
	});

	var Block = Backbone.Collection.extend({
		model: Article,
		comparator: function(item){
			return item.get('year')||item.get('decade');
		},
		render: function(){
			$('#space').append('<div class="layer"></div>');
			this.each(function(a){
				a.get('tinyView').render($('.layer:last-child'));
			});
		}
	});

	/*----------------------------------------------------
				  		   PARTICULES
	----------------------------------------------------*/

	var ParticuleModel = Backbone.Model.extend({
		collapse: function(particule){
			particule.set({'x': particule.get('x')+this.radius+particule.radius, 'y': particule.get('y')+this.radius+particule.radius});
		}
	});

	var Particules = Backbone.Collection.extend({
		model:ParticuleModel,
		free: function(x, y, radius){
			return (this.find(function(particule){
				return Math.sqrt(((x - particule.get('x')) * (x - particule.get('x'))) + ((y - particule.get('y')) * (y - particule.get('y')))) <= (radius + particule.get('radius'));
			}))?false:true;
		}
	});

	var ParticulesView = Backbone.View.extend({
		initialize: function (options) {
			this.context = options.context;
			this.particules = options.particules;
			this.force = options.force;
			this.canvas = options.canvas;
		},
		render: function(){
			this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
			this.context.fillStyle = "#a44426";
			this.particules.each(function(particule){
				this.context.beginPath();
				this.context.arc(particule.get('x'), particule.get('y'), particule.get('radius'), 0 , 2 * Math.PI, false);
				this.context.fill();
			}, this);
			/*this.context.fillStyle = "#0000FF";
			this.context.beginPath();
			this.context.arc(this.force.get('x'), this.force.get('y'), this.force.get('range'), 0 , 2 * Math.PI, false);
			this.context.fill();*/
		}
	});

	var Force = Backbone.Model.extend({
		apply: function(particules){
			var force = this;

			particules.each(function(particule){
				if(Math.sqrt(((force.get('x') - particule.get('x')) * (force.get('x') - particule.get('x'))) + ((force.get('y') - particule.get('y')) * (force.get('y') - particule.get('y')))) <= (force.get('range') + particule.get('radius')))
				{
					var dx = (particule.get('x')>force.get('x'))?5:(-5);
					var dy = (particule.get('y')>force.get('y'))?5:(-5);

					particule.set({'x': particule.get('x')+dx, 'y': particule.get('y')+dy});
				}	
			});
		}
	});

	/*----------------------------------------------------
				  		ROUTAGE
	----------------------------------------------------*/

    var AppRouter = Backbone.Router.extend({
        routes: {
        	"": "home",
        	"travel/:decade": "changeDecade",//Mode voyage avec décennie uniquement
        	"travel/:decade/:block": "travel",//Mode voyage avec décennie et bloc articles
        	"article/:articleId": "article"//article seul
        }
    });

	/*----------------------------------------------------
				  		3- FUNCTIONS
	----------------------------------------------------*/

	/*----------------------------------------------------
				  	PARTICULES
	----------------------------------------------------*/

	var particulesInteraction = function(){
		var canvas = document.getElementById('particules');
		var ctx = canvas.getContext('2d');

		var particules = new Particules();

		for (var i = 0; i < 1000; ++i) {
			do {
				var x = 1 + Math.random()*(canvas.width-1);
				var y = 1 + Math.random()*(canvas.height-1);
				var radius = 5 + Math.random()*(50-5);
			}while(!particules.free(x, y, radius));

			var particule = new ParticuleModel({'x': x, 'y': y, 'radius': radius});
			particules.add(particule);
		}

		var force = new Force({'x': -500, 'y': -500, range:100});
		var view = new ParticulesView({'canvas': canvas, 'context': ctx, 'particules': particules, 'force': force});

		var scaleX = $('canvas').css('width').split('px', 1)[0]/canvas.width;
		var scaleY = $('canvas').css('height').split('px', 1)[0]/canvas.height;

		view.render();

		$('canvas').mousemove(function(e){
			force.set({'x': e.offsetX*1/scaleX, 'y': e.offsetY*1/scaleY});
		});

		setInterval(function() {
		    view.render();
		    force.apply(particules);
		}, 10);
	};

	//Génère la timeline visuelle
	var generateTimeline = function(){
		$('#time-rule').html('');
		
		for(var i = 0; i < allBlocks.length; ++i)
		{
			$('#time-rule').append('<a class="timemarker"></a>');
			$('a.timemarker').last().attr({'href': '#/travel/'+currentDecade+'/'+i});
		}

		$('a.timemarker').on('click', function(event){
				event.preventDefault();
				indexToReach = parseInt(event.target.hash.split('/', 4)[3], 10);
				goTo(event);
				linkUpdate = true;
				window.location = event.target.href;
			});

		$('a.timemarker').css({'margin': '0 0 0 '+(91/(allBlocks.length+1))+'%'});//équilibre les espaces entre les markers

		placeCursor();//On place le draggable maintenant qu'il a un endroit où se fixer
	};

	//Génère les groupes d'articles à afficher
	var generateBlocks = function(){
		var displayedArticles = allArticles.where({'decade': currentDecade});
		allBlocks = new Array();
		var heightCapacity = Math.floor((window.innerHeight - 80)/(500+20));

		var even = false;

    	for(var i = 0; i < displayedArticles.length; i += heightCapacity*2)
    	{
    		var newBlock = new Block();
    		var j = 0;

    		while(i+j < displayedArticles.length && j < heightCapacity*2)
    		{
    			newBlock.add(displayedArticles[i+j]);

    			if(j < 2)
    				newBlock.last().set('top', (window.innerHeight-(45+(250*heightCapacity*2)))/2);
    			else
    				newBlock.last().set('top', 20);

    			if(even)
    				newBlock.last().set('left', 0);
    			else if(i+j+1 < displayedArticles.length)
    				newBlock.last().set('left', (window.innerWidth-1100)/2);
    			else
    				newBlock.last().set('left', (window.innerWidth-580)/2);

    			++j;
    			even = !even;
    		}

    		allBlocks.push(newBlock);
    	}

		generateTimeline();
		initializeDisplay();

		if(indexFirst === -1)
		{
	    	indexFirst = indexLink = allBlocks.length-1;
	    	linkUpdate = true;

	    	window.location = '#/travel/'+currentDecade+'/'+indexLink;
	    }
	};

	var placeCursor = function(){
		var indexCursor;

		indexCursor = (indexToReach == -42)?indexLink:indexToReach;

		var position = $($('a.timemarker').get(indexCursor)).offset().left-$('#cursor').width()/2+1;
		$('#cursor').animate({'left': position+'px'}, 200);
	};

	//place les premières images
	var initializeDisplay = function(){
		lastLayer = 0;
		way = 0;

		$('#space').html('');
		_.each(allBlocks, function(b) {
			b.render();
		});

		_.each($('.layer'), function(item, index){
			$(item).css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+((indexLink-index)*2999)+', t 10.0)'});
		});
		
		$($('.layer').get(indexLink)).css({'display': 'block', 'z-index': 50});
		$($('.layer').get(indexLink+1)).css({'display': 'block', 'z-index': 40});
	};

	var previousWay = 1;
	var navigate = function(event, delta, deltaX, deltaY) {
		if(Math.abs(delta) > 10)
			delta = Math.round(delta/10);

		scroll -= delta;

		_.each($('.layer'), function(item, index){
			var amount = Math.round(((scroll+((indexFirst-index)*100))*(scroll+((indexFirst-index)*100))*(scroll+((indexFirst-index)*100)))/200);
			$(item).css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+amount+', t 10.0)', 'z-index': 40});
			
			if(Math.abs(amount) >= 4500)
			{

				$(item).css({'display': 'none'});

				if(amount > 0 && delta < 0 && index === allBlocks.length-1 && currentDecade < 1990)
				{
					window.location = '#/travel/'+(currentDecade+10);
				}

				if(amount < 0 && delta > 0 && index === 0 && currentDecade > 1870)
				{
					window.location = '#/travel/'+(currentDecade-10)+'/'+(-1);
				}
			}
			else
			{
				$(item).css({'display': 'block'} );
			}

			if(index != indexLink && amount === 0) {
				$(item).css({'z-index': 50});
				linkUpdate = true;
				indexLink = index;
				$('#space').unmousewheel();
				$('#space').mousewheel(navigate);
				window.location = '#/travel/'+currentDecade+'/'+index;
			}
		});
	};

	var goTo = function(event){

		timer = window.setInterval(function(){
			if(indexLink > indexToReach+1)
			{
				navigate(null, 4, null, null);
			}
			else if(indexLink < indexToReach)
			{
				navigate(null, -4, null, null);
			}
			else
			{
				indexToReach = -42;
				clearInterval(timer);
			}
		}, 0.2);
	};

	/*----------------------------------------------------
				  4- INTERFACE ADAPTATION
	----------------------------------------------------*/

	var adaptInterface = function() {
		$('#article-details').css({'margin-top': -(window.innerHeight-45)+'px'});
	};

	$('.layer').masonry({isFitWidth: true});

	/*----------------------------------------------------
				  		5- BEHAVIOURS
	----------------------------------------------------*/
	
	$('#cursor').draggable({axis: 'x', containment:'#time-rule', handle: '.timemarker',
		stop: function(event, ui){
			var nearestMarker = $($('#time-rule .timemarker').get(0));
			var handleCenter = $('#cursor').width()/2-1;

			$('#time-rule .timemarker').each(function(index, timemarker){
				var offset = nearestMarker.offset().left ; 
	            var dist = Math.abs(offset - ($('#cursor').offset().left + handleCenter));
   
	            var markerOffset = $(timemarker).offset().left;
	            var markerDist = Math.abs(markerOffset - ($('#cursor').offset().left + handleCenter));

	     		if(markerDist < dist){
	     			nearestMarker = $(timemarker);
	     		}
			});

			$('#cursor').animate({'left': nearestMarker.offset().left - handleCenter}, 200);
			indexToReach = parseInt(nearestMarker.attr('href').split('/', 4)[3], 10);
			goTo(null);
			linkUpdate = true;
			$(location).attr('href', nearestMarker.attr('href'));
		}
	});

	$('button[name="decade-up"]').on('click', function(){
		if(currentDecade < 1990)
			window.location = "#/travel/"+(currentDecade+10);
	});
	$('button[name="decade-down"]').on('click', function(){
		if(currentDecade > 1870)
			window.location = "#/travel/"+(currentDecade-10);	
	});

	$('#decade-content button').on('click', function(){
		if($('ul#decades').css('display') === 'none')
		{
			$('#decade-content button').addClass('down');
			$('ul#decades').css({'display': 'block'});
		}
		else
		{
			$('#decade-content button').removeClass('down');
			$('ul#decades').css({'display': 'none'});
		}

		if($('ul.filters').css('display') === 'block')
		{
			$('button[name="filters-menu"]').removeClass('down');
			$('ul.filters').css({'display': 'none'});
		}
	});

	$('a.decade').on('click', function(){
		$('button[name="decade-menu"]').removeClass('down');
		$('ul#decades').css({'display': 'none'});
	});

	$('input[name="filters"]').on('change', function(event){
		if($(event.target).parent().hasClass('selected'))
			$(event.target).parent().removeClass('selected');
		else
			$(event.target).parent().addClass('selected');
	});

	$('button[name="filters-menu"]').on('click', function(){

		if($('ul.filters').css('display') === 'none')
		{
			$('button[name="filters-menu"]').addClass('down');
			$('ul.filters').css({'display': 'block'});
		}
		else
		{
			$('button[name="filters-menu"]').removeClass('down');
			$('ul.filters').css({'display': 'none'});
		}

		if($('ul#decades').css('display') === 'block')
		{
			$('#decade-content button').removeClass('down');
			$('ul#decades').css({'display': 'none'});
		}
	});

	$('body').on('click', 'button[name="user-menu"]', function(){
		if($('ul#user-options').css('display') === 'none')
		{
			$('button[name="user-menu"]').addClass('down');
			$('ul#user-options').css({'display': 'block'});
		}
		else
		{
			$('button[name="user-menu"]').removeClass('down');
			$('ul#user-options').css({'display': 'none'});
		}
	});

	$('body').on('mouseenter', 'ul#user-options a.extras, ul#extras', function(){
		$('ul#user-options a.extras').addClass('hover');
		$('ul#extras').css({'display': 'block'});
	});

	$('body').on('mouseleave', 'ul#user-options a.extras, ul#extras', function(){
		$('ul#user-options a.extras').removeClass('hover');
		$('ul#extras').css({'display': 'none'});
	});

	$('body').on('click', 'ul#interactive-menu a', function(event){
		event.preventDefault();

		$('ul#interactive-menu a').removeClass('selected');

		switch($(this).attr('id'))
		{
			case 'game':
				$('#game-frame').css({'opacity': '1'});
				$('#image-frame').css({'opacity': '0'});
				$('#similar-frame').css({'opacity': '0'});
				break;
			case 'image':
				$('#game-frame').css({'opacity': '0'});
				$('#image-frame').css({'opacity': '1'});
				$('#similar-frame').css({'opacity': '0'});
				break;
			case 'similar':
				$('#game-frame').css({'opacity': '0'});
				$('#image-frame').css({'opacity': '0'});
				$('#similar-frame').css({'opacity': '1'});
				break;
		}

		$('ul#interactive-menu a#'+$(this).attr('id')).addClass('selected');
	});

	$('body').on('click', 'ul#interactive-menu a#back-in-time', function(event){
		if(currentDecade != 0)
			if(indexLink != 0)
				window.location = "#/travel/"+currentDecade+"/"+indexLink;
			else
				window.location = "#/travel/"+currentDecade;
		else
			window.location = "#/travel/1870";
	});

	$('#connect form').on('submit', function(event){
		event.preventDefault();

		window.location = "#/travel/1870";
	});

	var logoOpen = false;
	$('#logo-top, #logo-bottom').on('click', function(event){
		if(!logoOpen)
		{
			$('#connect').animate({'height': '171px'}, 200);
			$('#logo-bottom').animate({'top': '533px'}, 200);
		}
		else
		{
			$('#connect').animate({'height': '0px'}, 200);
			$('#logo-bottom').animate({'top': '362px'}, 200);
		}

		logoOpen = !logoOpen;
	});

	$('#space').mousewheel(function(){
		$('#tip-popup').css({'display': 'none'});
		$('#space').unmousewheel();
		$('#space').mousewheel(navigate);
	});

	/*----------------------------------------------------
				  		3- APPLICATION
	----------------------------------------------------*/

    var app_router = new AppRouter;

    app_router.on('route:home', function() {
    	scroll = 0;

    	$('#space').unmousewheel();
		$('#space').mousewheel(navigate);

    	$.firefly();
    	$('#article-details').html('');
    	
    	if($('#home').css('margin-top') === -window.innerHeight+'px')
    		$('#home').animate({'margin-top': '0px'}, 200);

    	$('#travel-screen').removeClass('flip');
    	$('#article-details').removeClass('flip');
    });

    app_router.on('route:changeDecade', function(decade){
    	scroll = 0;

		allBlocks = new Array();
		currentDecade = parseInt(decade, 10);
		indexLink = 0;

		$('#article-details').html('');
		$('#decade-content p').html(decade);

    	if(allArticles === undefined)
    	{
			allArticles = new Block();

			allArticles.fetch({url: "init.json"}).complete(function() {
		    	allArticles.sort();

		    	generateBlocks(allArticles);
		    	$('#space').unmousewheel();
				$('#space').mousewheel(navigate);
			});
    	}
    	else
    	{
	    	generateBlocks(allArticles);
	    	$('#space').unmousewheel();
			$('#space').mousewheel(navigate);
    	}

    	$('#home').animate({'margin-top': -window.innerHeight+'px'}, 200);

    	$('#travel-screen').removeClass('flip');
    	$('#article-details').removeClass('flip');
    });

    app_router.on('route:travel', function(decade, block){

    	if(!linkUpdate) {
			change = 0;
			scroll = 0;

			$('#space').unmousewheel();
			$('#space').mousewheel(navigate);

			if(indexToReach == -42)
	    		indexFirst = indexLink = parseInt(block, 10);

	    	$('#article-details').html('');

	    	if(parseInt(decade, 10) != currentDecade)
	    	{
	    		allBlocks = new Array();
				currentDecade = parseInt(decade, 10);
				amount = 75;

				$('#decade-content p').html(decade);

		    	if(allArticles === undefined)
		    	{
					allArticles = new Block();

					allArticles.fetch({url: "init.json"}).complete(function() {
				    	allArticles.sort();

				    	generateBlocks(allArticles);
					});
		    	}
		    	else
		    	{
			    	generateBlocks(allArticles);
		    	}
	    	}
	    	else
	    	{
	    		if(indexFirst === -1)
	    			indexFirst = indexLink = allBlocks.length-1;

	    		placeCursor();
			}

	    	$('#home').animate({'margin-top': -window.innerHeight+'px'}, 200);

	    	$('#travel-screen').removeClass('flip');
	    	$('#article-details').removeClass('flip');
		}
		else {
			placeCursor();
			linkUpdate = false;
		}
    });

    app_router.on('route:article', function(articleId){

    	$('#article-details').html('');

    	if(allArticles === undefined)
    	{
			allArticles = new Block();

			allArticles.fetch({url: "init.json"}).complete(function() {
				allArticles.sort();
		    	allArticles.getByCid(articleId).get('view').render();
		    	particulesInteraction();
			});
    	}
    	else
    	{
	    	allArticles.getByCid(articleId).get('view').render();
	    	particulesInteraction();
    	}

    	$('#home').animate({'margin-top': -window.innerHeight+'px'}, 200);

    	$('#article-details').addClass('flip');
		$('#travel-screen').addClass('flip');
		$('#tip-popup').css({'display': 'none'});
    });

	adaptInterface();
    Backbone.history.start();
});