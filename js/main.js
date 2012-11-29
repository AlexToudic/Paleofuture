$(function() {
    var currentDecade = 0;
    var currentBlock = -1;
    var navigate;
    var timer;

	/*----------------------------------------------------
				  1- BACKBONE DECLARATIONS
	----------------------------------------------------*/

	var id = 0;
	var Article = Backbone.Model.extend({
		initialize: function(){
			this.set('articleId', id++);
			this.set('year', parseInt(this.attributes.year, 10));
			this.set('decade', parseInt(this.attributes.decade, 10));
			if(this.get('image'))
				this.set('view', new ArticleBlockPicView({'model': this}));
			else
				this.set('view', new ArticleBlockTxtView({'model': this}));
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

	var blockId = 0;
	var Block = Backbone.Collection.extend({
		model: Article,
		initialize: function () {
			this.id = blockId++;
		},
		comparator: function(item){
			return item.get('year')||item.get('decade');
		},
		render: function(el){
			$(el).html('');
			this.each(function(a){
				a.get('view').render(el);
				$(el+'>*:last').css({'top': Math.random()*window.innerHeight+'px', 'left': Math.random()*window.innerWidth+'px'});
			});
		}
	});

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

    var AppRouter = Backbone.Router.extend({
        routes: {
        	"": "home",
        	"travel/:decade": "travel",
        	"travel/:decade/:block": "travel"
        }
    });

	/*----------------------------------------------------
				  		3- FUNCTIONS
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

		var force = new Force({'x': 500, 'y': 500, range:100});
		var view = new ParticulesView({'canvas': canvas, 'context': ctx, 'particules': particules, 'force': force});

		var scaleX = $('canvas').css('width').split('px', 1)[0]/canvas.width;
		var scaleY = $('canvas').css('height').split('px', 1)[0]/canvas.height;

		view.render();

		$('canvas').mousemove(function(e){
			force.set({'x': e.clientX*1/scaleX, 'y': e.clientY*1/scaleY});
		});

		setInterval(function() {
		    view.render();
		    force.apply(particules);
		}, 10);
	};

	var generateTimeline = function(decade){

		for(var i = 0; i < 10; ++i)
		{
			$('a.timemarker:nth-child('+(i+1)+')').attr({'href': '#/travel/'+decade+'/'+i});
		}
	};

	var navigateTo = function(articlesList, block){
		if(block > currentBlock)
		{
			timer = setInterval(function(){
				navigate(null, 1, null, null);
			}, 0.5);
		}
		else
		{
			timer = setInterval(function(){
				navigate(null, -1, null, null);
			}, 0.5);
		}
	}

	/*----------------------------------------------------
				  4- INTERFACE ADAPTATION
	----------------------------------------------------*/

	var adaptInterface = function() {
		$('#layer2').css({'margin-top': -window.innerHeight+80+'px'});
		$('#interactive').css({'margin-top': -window.innerHeight+'px'});
	}

	/*----------------------------------------------------
				  		5- BEHAVIOURS
	----------------------------------------------------*/

/*	$('#content').on('click', function(){
		$('#article-details').addClass('flip');
		$('#content').addClass('flip');
		$('#layer1').css({'display': 'none'});
		$('#layer2').css({'display': 'none'});
	});

	$('#article-details').on('click', function(){
		$('#article-details').removeClass('flip');
		$('#content').removeClass('flip');
		$('#layer1').css({'display': 'block'});
		$('#layer2').css({'display': 'block'});
	});*/

/*	$(window).resize(function(){
		console.log('resize');
		adaptInterface();
	});*/
	
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
			$(location).attr('href', nearestMarker.attr('href'));
		}
	});

	$('#quick-decade button[name="decade-up"]').on('click', function(){
		window.location = "#/travel/"+(currentDecade+10);
	});
	$('#quick-decade button[name="decade-down"]').on('click', function(){
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

	$('input[name="filters"]').on('click', function(event){
		if($(event.target).parent().css('text-decoration') === 'none')
			$(event.target).parent().css({'text-decoration': 'line-through'});
		else
			$(event.target).parent().css({'text-decoration': 'none'});
	});

/*	$('#timeline, .timemarker').on('click', function(event){
		$('#cursor').draggable( "option", "cursorAt", { left: event.offsetX -  $('#cursor').width()/2} );
	});*/

	var navigation = function(blocksList){
		var amount = 75;

		var frontLayer = $('#layer1');
		var backLayer = $('#layer2');

		$('#layer1').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+amount+', t 10.0)'});
		$('#layer2').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+(amount+2999)+', t 10.0)'});


		var scroll1 = Math.pow(200*amount, (1/3));
		var scroll2 = Math.pow(200*(amount+2000), (1/3));

		var previousWay = 0;
		var way = 0;
		var reverse1 = false;
		var reverse2 = false;

		var frontLayer = $('#layer1');
		var backLayer = $('#layer2');

		blocksList[0].render('#layer1');
		blocksList[1].render('#layer2');

		var index = 2;

		var upLayer1 = false;
		var upLayer2 = false;

		navigate = function(event, delta, deltaX, deltaY) {
			console.log(currentBlock, blocksList.length);

			if(delta > 0 || (delta === 0 && way < 0))
			{
				way = -1;
				scroll1 += 1.0;
				scroll2 += 1.0;	
			}
			else
			{
				way = 1;
				scroll1 -= 1.0;
				scroll2 -= 1.0;
			}

			// if(previousWay === 0)
			// 	previousWay = newWay;
			// else if(previousWay !== newWay)
			// {
			// 	previousWay = newWay;
			// 	reverse1 = true;
			// 	reverse2 = true;
			// }


			d1Amount = Math.round((scroll1*scroll1*scroll1)/200);
		    $('#layer1').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d1Amount+', t 10.0)'});

		    d2Amount = Math.round((scroll2*scroll2*scroll2)/200);
		    $('#layer2').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d2Amount+', t 10.0)'});

		    if(d1Amount === 0 && !upLayer1)
		    {
		    	upLayer1 = true;
		    	window.location = "#/travel/"+currentDecade+"/"+(currentBlock+1);
		    }
		    else if(d1Amount !== 0 && upLayer1)
		    {
		    	upLayer1 = false;
		    }

		    if(d2Amount === 0 && !upLayer2)
		    {
		    	upLayer2 = true;
		    	window.location = "#/travel/"+currentDecade+"/"+(currentBlock+1);
		    }
		    else if(d2Amount !== 0 && upLayer2)
		    {
		    	upLayer2 = false;
		    }

		    if(Math.abs(d1Amount) < Math.abs(d2Amount) && frontLayer !== $('#layer1'))
		    {
		    	frontLayer = $('#layer1');
		    	backLayer = $('#layer2');

		    	frontLayer.css({'z-index': 100});
		    	backLayer.css({'z-index': 50});
		    }

		  	else if(Math.abs(d1Amount) > Math.abs(d2Amount) && frontLayer !== $('#layer2'))
		    {
		    	frontLayer = $('#layer2');
		    	backLayer = $('#layer1');

		    	frontLayer.css({'z-index': 100});
		    	backLayer.css({'z-index': 50});
		    }

		    if(d1Amount <= amount-3000 || d1Amount >= -(amount-3000)){
		    	if(currentBlock === 0)
					window.location = "#/travel/"+(currentDecade-10)+"/"+"last";
				else if(currentBlock === blocksList.length)
					window.location = "#/travel/"+(currentDecade+10);

		    	d1Amount = -d1Amount;
		    	scroll1 = -scroll1;
		    	
		    	if(delta < 0)
		    	{
					blocksList[index++].render('#layer1');
				}
				else
				{
					blocksList[index--].render('#layer1');
				}
		    }
		   	
		   	if(d2Amount <= amount-3000 || d2Amount >= -(amount-3000)){
		   		if(currentBlock === 0)
				window.location = "#/travel/"+(currentDecade-10);
				else if(currentBlock === blocksList.length)
					window.location = "#/travel/"+(currentDecade+10);

		   		d2Amount = -d2Amount;
		    	scroll2 = -scroll2;
		    	
		    	if(delta < 0)
		    	{
					blocksList[index++].render('#layer2');
				}
				else
				{
					blocksList[index--].render('#layer2');
				}
		    }
		}

		$('#space').mousewheel(navigate);
	};

	$('button[name="user-menu"]').on('click', function(){
		if($('ul#user-options').css('display') === 'none')
			$('ul#user-options').css({'display': 'block'});
		else
			$('ul#user-options').css({'display': 'none'});
	});

	$('ul#user-options a.extras, ul#extras').on('mouseenter', function(){
		$('ul#user-options a.extras').addClass('hover');
		$('ul#extras').css({'display': 'block'});
	});

	$('ul#user-options a.extras, ul#extras').on('mouseleave', function(){
		$('ul#user-options a.extras').removeClass('hover');
		$('ul#extras').css({'display': 'none'});
	});

	/*----------------------------------------------------
				  		3- APPLICATION
	----------------------------------------------------*/

    var app_router = new AppRouter;

    app_router.on('route:home', function() {
		clearInterval(timer);

    	if($('#home').css('margin-top') === -window.innerHeight+'px')
    		$('#home').animate({'margin-top': '0px'}, 200);
    	if($('#layer1').css('display') !== 'none')
    	{
	    	$('#layer1').css({'display': 'none'});
			$('#layer2').css({'display': 'none'});
    	}
    });

    app_router.on('route:travel', function(decade, block){
    	clearInterval(timer);

    	var allBlocks = new Array;

    	var articlesList;

    	if(!block)
    	{
    		block = 0;
    	}

    	if(parseInt(decade, 10) !== currentDecade)
    	{
    		$('#space').unmousewheel();
    		currentDecade = parseInt(decade, 10);
    		$('#decade-content p').html(decade);

	    	if(allArticles === undefined)
	    	{
				var allArticles = new Block();

				allArticles.fetch({url: "init.json"}).complete(function() {
			    	allArticles.sort();

			    	var displayedArticles = allArticles.where({'decade': currentDecade});

			    	for(var i = 0; i < 2; ++i)
			    	{
			    		var newBlock = new Block();

			    		for(var j = 5*i; j < 5*i+5; ++j)
			    			newBlock.add(displayedArticles[j]);

			    		allBlocks.push(newBlock);
			    	}

			    	navigation(allBlocks);
				});
	    	}
	    	else
	    	{
		 		var displayedArticles = allArticles.where({'decade': currentDecade});

		    	for(var i = 0; i < 2; ++i)
		    	{
		    		var newBlock = new Block();

		    		for(var j = 5*i; j < 5*i+5; ++j)
		    			newBlock.add(displayedArticles[j]);

		    		allBlocks.push(newBlock);
		    	}

		    	navigation(allBlocks);
	    	}

    		generateTimeline(decade);
    	}

    	if(parseInt(block, 10) !== currentBlock)
    	{
    		// if(currentBlock != -1)
    		// 	navigateTo(articlesList, block);

    		currentBlock = parseInt(block, 10);
    		var position = $($('a.timemarker').get(block)).offset().left-$('#cursor').width()/2+1;
    		$('#cursor').animate({'left': position+'px'}, 200);
    	}

    	$('#home').animate({'margin-top': -window.innerHeight+'px'}, 200);
    	
    	$('#layer1').css({'display': 'block'});
		$('#layer2').css({'display': 'block'});
    });

	adaptInterface();
    Backbone.history.start();
});