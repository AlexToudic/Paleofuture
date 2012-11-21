$(function() {
	/*----------------------------------------------------
				  1- INTERFACE ADAPTATION
	----------------------------------------------------*/

	$('#travel').on('click', function(){
		$('#home').animate({'margin-top': -window.innerHeight+'px'}, 500);
	});

	$('#layer2').css({'margin-top': -window.innerHeight+50+'px'});
	$('#interactive').css({'margin-top': -window.innerHeight+'px'});

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
			console.log(e);
			force.set({'x': e.clientX*1/scaleX, 'y': e.clientY*1/scaleY});
		});

		setInterval(function() {
		    view.render();
		    force.apply(particules);
		}, 10);
	};

    Backbone.history.start();
    particulesInteraction();
});