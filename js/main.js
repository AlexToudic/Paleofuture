$(function() {
    var currentDecade = 0;//décennie parcourue
    var filtersDropped = false;
	var amount = 75;
    var scroll1 = Math.pow(200*amount, (1/3));
	var scroll2 = Math.pow(200*(amount+2000), (1/3));
	var d1Amount = amount;
	var d2Amount = amount-2999;
	var lastLayer;
	var lastUpLayer;
	var allArticles;
	var allBlocks;
	var way;
	var indexBlock = 0;
	var indexDisplay = 0;
	var indexToReach = -42;
	var timer;

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
		render: function(el){
			$(el).html('');
			this.each(function(a){
				a.get('tinyView').render(el);
				$(el+'>*:last').css({'margin': a.get('top')+'px 20px 0 '+a.get('left')+'px'});
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
			this.context.fillStyle = "#000000";
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
	};

	var placeCursor = function(){
		var indexCursor;

		indexCursor = (indexToReach == -42)?indexBlock:indexToReach;

		var position = $($('a.timemarker').get(indexCursor)).offset().left-$('#cursor').width()/2+1;
		$('#cursor').animate({'left': position+'px'}, 200);
	};

	//place les premières images
	var initializeDisplay = function(){
		lastLayer = 0;
		way = 0;

		if(!indexBlock%2) {
			frontLayer = '#layer1';
    		backLayer = '#layer2';
		}
		else {
			frontLayer = '#layer2';
    		backLayer = '#layer1';
		}

		$(frontLayer).css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+amount+', t 10.0)'});
		$(backLayer).css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+(amount-2999)+', t 10.0)'});

		if(indexBlock < allBlocks.length)
		{
			indexDisplay = indexBlock;

			allBlocks[indexDisplay].render(frontLayer);
			++indexDisplay;

			if(indexDisplay < allBlocks.length)
			{
				allBlocks[indexDisplay].render(backLayer);
				++indexDisplay;
			}
		}

		lastLayer = 1;
	};

	var previousWay = 1;
	var change = 0;
	var navigate = function(event, delta, deltaX, deltaY) {
		console.log(allBlocks.length);

		if(change != 0 && currentDecade+change >= 1870 && currentDecade+change <= 1990){
			window.location = "#/travel/"+(currentDecade+change);
			change = 0;
		}
		else if(change != 0)
		{
			window.location = "#";
		}

		change = 0;

		var reverse = false;

		//Evite les sauts dans le scroll
		if(Math.abs(delta) > 10)
			delta = Math.round(delta/10);

		if(delta > 0)
			way = -1;
		else if(delta < 0)
			way = 1;

		if(way != previousWay)
		{
			reverse = true;
			previousWay = way;
			indexDisplay = indexBlock;
		}

		scroll1 += delta;
		scroll2 += delta;

		d1Amount = Math.round((scroll1*scroll1*scroll1)/200);
	    $('#layer1').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d1Amount+', t 10.0)'});

	    d2Amount = Math.round((scroll2*scroll2*scroll2)/200);
	    $('#layer2').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d2Amount+', t 10.0)'});

	    //Joue entre les layers pour les passer en avant plan
	    if(Math.abs(d1Amount) < Math.abs(d2Amount) && frontLayer != '#layer1')
	    {
	    	frontLayer = '#layer1';
	    	backLayer = '#layer2';

	    	$(frontLayer).css({'z-index': 100});
	    	$(backLayer).css({'z-index': 50});
	    }
	  	else if(Math.abs(d1Amount) > Math.abs(d2Amount) && frontLayer != '#layer2')
	    {
	    	frontLayer = '#layer2';
	    	backLayer = '#layer1';

	    	$(frontLayer).css({'z-index': 100});
	    	$(backLayer).css({'z-index': 50});
	    }

	    //Quand un des layers est en fond on doit charger l'article suivant s'il existe
	   	if(lastUpLayer != 1 && (d1Amount <= amount-3000 || d1Amount >= -(amount-3000))) {
	   		lastUpLayer = 1;

	    	if(way > 0 && indexDisplay < allBlocks.length)
	    	{
	    		allBlocks[indexDisplay].render('#layer1');
	    		++indexDisplay;
	    	}
	    	else if(way < 0 && indexDisplay >= 0)
	    	{
	    		allBlocks[indexDisplay].render('#layer1');
	    		--indexDisplay;
	    	}
	    	else
	    	{
	    		$('#layer1').html('');
	    	}

	    	d1Amount = -d1Amount;
		    scroll1 = -scroll1;
	    }


	   	if(lastUpLayer != 2 && (d2Amount <= amount-3000 || d2Amount >= -(amount-3000))) {
	   		lastUpLayer = 2;
	   		
	    	if(way > 0 && indexDisplay < allBlocks.length)
	    	{
	    		allBlocks[indexDisplay].render('#layer2');
	    		++indexDisplay;
	    	}
	    	else if(way < 0 && indexDisplay >= 0)
	    	{
	    		allBlocks[indexDisplay].render('#layer2');
	    		--indexDisplay;
	    	}
	    	else
	    	{
	    		$('#layer2').html('');
	    	}

	    	d2Amount = -d2Amount;
		    scroll2 = -scroll2;
	    }

	    //quand un bloc se forme, on change le lien
	    if(d1Amount === 0 && (lastLayer != 1 || reverse))
	    {
	    	lastLayer = 1;
	    	indexBlock += way;

	    	if(indexToReach == -42)
	   			window.location = "#/travel/"+currentDecade+"/"+indexBlock;

	   		d1Amount = -d1Amount;
		    scroll1 = -scroll1;
	    }
	   
	   	if(d2Amount === 0 && (lastLayer != 2 || reverse))
	    {
	    	lastLayer = 2;
	    	indexBlock += way;

	    	if(indexToReach == -42)
	   			window.location = "#/travel/"+currentDecade+"/"+indexBlock;

	   		d2Amount = -d2Amount;
		    scroll2 = -scroll2;
	    }

	    if(indexBlock >= allBlocks.length-1)
	    {
	    	change = +10;
	    }
	    if(indexBlock < 0)
	    {	
	    	change = -10;
	    }
	};

	var goTo = function(event){

		timer = window.setInterval(function(){
			if(indexBlock > indexToReach+1)
			{
				navigate(null, 4, null, null);
			}
			else if(indexBlock < indexToReach)
			{
				navigate(null, -4, null, null);
			}
			else
			{
				indexToReach = -42;
				clearInterval(timer);
			}
		}, 5);
	};

	/*----------------------------------------------------
				  4- INTERFACE ADAPTATION
	----------------------------------------------------*/

	var adaptInterface = function() {
		//$('#layer2').css({'margin-top': -window.innerHeight+80+'px'});
		$('#article-details').css({'margin-top': -(window.innerHeight-45)+'px'});
	};

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
			console.log(nearestMarker.attr('href'));
			indexToReach = parseInt(nearestMarker.attr('href').split('/', 4)[3], 10);
			goTo(null);
			$(location).attr('href', nearestMarker.attr('href'));
		}
	});

	$('button[name="decade-up"]').on('click', function(){
		if(currentDecade+10 <= 1990)
			window.location = "#/travel/"+(currentDecade+10);
	});
	$('button[name="decade-down"]').on('click', function(){
		if(currentDecade-10 >= 1870)
			window.location = "#/travel/"+(currentDecade-10);	
	});

	$('#decade-content button').on('click', function(){
		if($('ul#decades').css('display') === 'none')
			$('ul#decades').css({'display': 'block'});
		else
			$('ul#decades').css({'display': 'none'});
	});

	$('a.decade').on('click', function(){
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
			$('ul.filters').css({'display': 'block'});
		else
			$('ul.filters').css({'display': 'none'});
	});

	$('body').on('click', 'button[name="user-menu"]', function(){
		if($('ul#user-options').css('display') === 'none')
			$('ul#user-options').css({'display': 'block'});
		else
			$('ul#user-options').css({'display': 'none'});
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
				$('#game-frame').css({'display': 'block'});
				$('#image-frame').css({'display': 'none'});
				$('#similar-frame').css({'display': 'none'});
				break;
			case 'image':
				$('#game-frame').css({'display': 'none'});
				$('#image-frame').css({'display': 'block'});
				$('#similar-frame').css({'display': 'none'});
				break;
			case 'similar':
				$('#game-frame').css({'display': 'none'});
				$('#image-frame').css({'display': 'none'});
				$('#similar-frame').css({'display': 'block'});
				break;
		}

		$('ul#interactive-menu a#'+$(this).attr('id')).addClass('selected');
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

	$('#space').mousewheel(navigate);

	/*----------------------------------------------------
				  		3- APPLICATION
	----------------------------------------------------*/

    var app_router = new AppRouter;

    app_router.on('route:home', function() {
    	//$.firefly();
    	$('#article-details').html('');
    	
    	if($('#home').css('margin-top') === -window.innerHeight+'px')
    		$('#home').animate({'margin-top': '0px'}, 200);
    	if($('#layer1').css('display') !== 'none')
    	{
	    	$('#layer1').css({'display': 'none'});
			$('#layer2').css({'display': 'none'});
    	}

    	$('#travel-screen').removeClass('flip');
    	$('#article-details').removeClass('flip');
    });

    app_router.on('route:changeDecade', function(decade){
		allBlocks = new Array();
		currentDecade = parseInt(decade, 10);
		indexBlock = 0;
		indexDisplay = 0;
		amount = 75;

		$('#article-details').html('');
		$('#decade-content p').html(decade);

    	if(allArticles === undefined)
    	{
			allArticles = new Block();

			allArticles.fetch({url: "init.json"}).complete(function() {
		    	allArticles.sort();

		    	console.log(allArticles);

		    	generateBlocks(allArticles);
			});
    	}
    	else
    	{
	    	generateBlocks(allArticles);
    	}

    	$('#home').animate({'margin-top': -window.innerHeight+'px'}, 200);

    	$('#travel-screen').removeClass('flip');
    	$('#article-details').removeClass('flip');
    	
    	$('#layer1').css({'display': 'block'});
		$('#layer2').css({'display': 'block'});
    });

    app_router.on('route:travel', function(decade, block){
    	if(indexToReach == -42)
    		indexBlock = parseInt(block, 10);

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
    		placeCursor();
		}

    	$('#home').animate({'margin-top': -window.innerHeight+'px'}, 200);

    	$('#travel-screen').removeClass('flip');
    	$('#article-details').removeClass('flip');
    	
    	$('#layer1').css({'display': 'block'});
		$('#layer2').css({'display': 'block'});
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
		$('#layer1').css({'display': 'none'});
		$('#layer2').css({'display': 'none'});
    });

	adaptInterface();
    Backbone.history.start();
});