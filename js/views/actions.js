var ActionsView = Backbone.View.extend({
    
    initialize: function () {
        
        this.user_model = this.options.user_model;
        this.model.bind("reset", this.reset_event, this);
        //console.log("selected mode: " + this.options.selected_mode);
        this.selected_mode = this.options.selected_mode;
        this.items_per_page = 15;
        this.page = 0;
        this.render_mode = 'new';
        this.user_follows_actions = true;
        _.bindAll(this);
    },

    events: {
        'click .load-more-results': 'loadMoreResults'
    },

    render: function () {
        this.$el.html(this.template());
        return this;
    },
    
    params_to_default: function() {
    	this.user_follows_actions = true;
    	this.requery_done = false;
    },
    
    search_models: function(){
        
        $("#action_list", this.$el).addClass('hide');
        
        this.params = {
            limit: this.items_per_page,
            offset: this.page * this.items_per_page,
            published: 1,
            //page : this.page
            //following_user: this.user_model.get('id');
        };
        
        var get_location_first = false;

         if(this.options.search_term !== undefined && this.options.search_term !== '-'){
            //console.log("search term: " + this.options.search_term); 
            this.params.q = this.options.search_term;  
        }

        if(this.options.category_filter !== undefined && this.options.category_filter !== '-'){
            //console.log("catefgory filter: " + this.options.category_filter);
            this.params.category_id = this.options.category_filter;
        }
        if(this.model.meta
                && this.model.total_count
                && this.params.limit + this.params.offset >= this.model.meta.total_count){
                    return;
                }
     	
        switch(this.selected_mode){

            case 'my_actions':
            	if (this.user_follows_actions) {
                	this.params.following_user = this.user_model.get('id');
                }else{
                	this.params.order_by = 'distance';
                	get_location_first = true;
                }
                break;

    	    case 'own_actions':
                this.params.user_id = this.user_model.get('id');
                break;

            case 'featured_actions':
                this.params.featured = 1;
                break;
   
            case 'all_actions':
                //console.log("all actions selected");
                break;                
        }
        
        if(this.options.order_by !== undefined && this.options.order_by !== '-'){
            //console.log("order by: " + this.options.category_filter);
            this.params.order_by = this.options.order_by;
            
            switch(this.options.order_by){
            	
            	case 'distance':
            		get_location_first = true;
            		break;
            		
            	case 'featured':
            		this.params.order_by = '-item_count';
            		break;
            		
            	case 'created':
            		break;
            	
            	default:
            		break;
            }
        }
        
        console.log("ACTION FETCH PARAMS: "+JSON.stringify(this.params)+",  SELECTED_MODE: "+this.selected_mode+",  USER_FOLLOWS_ACTIONS: "+this.user_follows_actions);
        
        if(get_location_first){
        	navigator.geolocation.getCurrentPosition(this.location_success, this.location_err);
        }else{
        	this.fetch_models();
        }
    },

    location_success: function(position){
        this.params.lat = position.coords.latitude;
        this.params.lng = position.coords.longitude;
        //this.params.order_by = 'distance';
        this.fetch_models();
    },

    location_err: function(error){
        alert("location not available");
        //falling back to created
        this.params.order_by = 'created';
        
    },

    loadMoreResults: function(ev) {
    	ev.preventDefault();
    	this.page++;
    	this.render_mode = 'append';
    	this.search_models();
    },
    
    fetch_models: function(){
        //console.log("action params: " + JSON.stringify(this.params));         
    	var self = this;
        this.model.fetch({
            data: self.params,
            success: function(mdl, response){
                //console.log('action models fetched');
            },
            error: function() {
            	onOffline();
            }
        });
    	
    },

    reset_event: function(){
        this.render_page();
    },
    
    no_results_msg: '<div class="no-results">[ No se encontraron resultados. Inténtalo nuevamente con otros valores. ]</div>',

    render_page: function(){
    	
    	var $list = $("#action_list", this.$el);
    	var $list_title = $('#actions-list-title', this.$el);
    	var $list_intro = $('#actions-list-intro', this.$el);
    	
    	if (this.render_mode == 'new') {
    		$list.empty();
    	}else{
    		this.render_mode = 'new';
    		$list.append('<hr class="action_separator">');
    	}
    	
    	if (this.model.size() > 0) {
    		
    		if (!this.user_follows_actions) {
    			$list_title.html('Inciativas cercanas a tu zona').removeClass('hide');
    			$list_intro.removeClass('hide');
    		}else{
    			$list_title.addClass('hide');
    			$list_intro.addClass('hide');
    		}
    		
	        this.model.each(function(item, index,list){  
	            //console.log("action item: " + JSON.stringify(item));
	            var action = {model: item.toJSON()};
	            $list.append(new ActionItemView(action).render().el);
	            if(index < list.length - 1){
	                $list.append('<hr class="action_separator">');
	            }
	        }, this);
	    }else{
	    	if (this.selected_mode == 'my_actions') {
	    		this.user_follows_actions = false;
	    		if (!this.requery_done) {
	    			this.search_models();
	    			this.requery_done = true;	
	    		}else{
	    			this.requery_done = undefined;
	    			$list.html(this.no_results_msg);
	    		}
	    	}else{
	    		$list.html(this.no_results_msg);
	    	}
	    }
	    $list.removeClass('hide');
                
        var add_pager = false;

        //if (this.model.meta.total_count > this.model.meta.limit + this.model.meta.offset) {
        //console.log("HAS NEXT: " + JSON.stringify(this.model.meta));
        if(this.model.meta.next){
            add_pager = true; 
        }
        
        var $pager_button = this.$el.find('.item-pager');
        
        if (add_pager) {
        	$pager_button.removeClass('hide');
        }else{
            $pager_button.addClass('hide');
        }
        this.scroll_refresh(); 
    }
});