$(function() {
	/*----------------------------------------------------
				  1- BACKBONE DECLARATIONS
	----------------------------------------------------*/

	var Article = Backbone.Model.extend({

	});

	var Articles = Backbone.Collection.extend({
		model: Article,
		comparator: function(item){
			return item.get('pub_year')||item.get('decade');
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
        	"travel/:decade/:year": "travel"
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

	/*----------------------------------------------------
				  4- INTERFACE ADAPTATION
	----------------------------------------------------*/

	$('#layer2').css({'margin-top': -window.innerHeight+50+'px'});
	$('#interactive').css({'margin-top': -window.innerHeight+'px'});

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
	
	$('#cursor').draggable({axis: 'x', containment:'#timeline', handle: '#timeline, .timemarker',
		stop: function(event, ui){
			var nearestMarker = $($('#timeline .timemarker').get(0));
			var handleCenter = $('#cursor').width()/2;

			$('#timeline .timemarker').each(function(index, timemarker){
				var offset = nearestMarker.offset().left ; 
	            var dist = Math.abs(offset - ($('#cursor').offset().left + handleCenter));
   
	            var markerOffset = $(timemarker).offset().left;
	            var markerDist = Math.abs(markerOffset - ($('#cursor').offset().left + handleCenter));

	     		if(markerDist < dist){
	     			nearestMarker = $(timemarker);
	     		}
			});

			$('#cursor').animate({'left': nearestMarker.offset().left - handleCenter}, 200);
			$(location).attr('href',"#/travel/1870/1871");
		}
	});

/*	$('#timeline, .timemarker').on('click', function(event){
		$('#cursor').draggable( "option", "cursorAt", { left: event.offsetX -  $('#cursor').width()/2} );
	});*/

	var navigation = function(articlesList){
		var index = 0;
		var amount = 75;
		$('#layer1').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+amount+', t 10.0)'});
		$('#layer2').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+(amount+2893)+', t 10.0)'});


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

			d1Amount = Math.round((scroll1*scroll1*scroll1)/200);
		    $('#layer1').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d1Amount+', t 10.0)'});

		    d2Amount = Math.round((scroll2*scroll2*scroll2)/200);
		    $('#layer2').css({'-webkit-filter': 'custom(url(css/shaders/slices.vs) mix(url(css/shaders/slices.fs) normal source-atop), 100 1 border-box detached, amount '+d2Amount+', t 10.0)'});

		    if(d1Amount <= amount-2893){
		    	displayed1 = false;
		    	scroll1 = Math.pow(200*amount, (1/3));
		    }
		   	else if(d2Amount <= amount-2893){
		   		displayed2 = false;
		    	scroll2 = Math.pow(200*(amount+2893), (1/3));
		    }
		});
	};

	/*----------------------------------------------------
				  		3- APPLICATION
	----------------------------------------------------*/
	allArticles = new Articles();

	allArticles.fetch({url: "init.json"}).complete(function() {
    	allArticles.sort();
    	console.log(allArticles);
	});

    var app_router = new AppRouter;

    app_router.on('route:home', function() {
    	if($('#home').css('margin-top') === -window.innerHeight+'px')
    		$('#home').animate({'margin-top': '0px'}, 200);
    	if($('#layer1').css('display') !== 'none')
    	{
	    	$('#layer1').css({'display': 'none'});
			$('#layer2').css({'display': 'none'});
    	}
    });

    app_router.on('route:travel', function(decade, year){
    	navigation(allArticles);
    	$('#home').animate({'margin-top': -window.innerHeight+'px'}, 200);
    	
    	$('#layer1').css({'display': 'block'});
		$('#layer2').css({'display': 'block'});
    });

    Backbone.history.start();
});