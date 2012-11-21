var CommentListView = Backbone.View.extend({
    
    events: {
    	'submit #comment-form': 'submit_comment',
      'focus #comment-input': 'typing',
    },
    
    is_active: true,
    
    render: function(){

        this.$el.html(this.template());
        
        var $comments = this.$el.find('.comment-list');
        
        this.collection.each(function(model){
        	$comments.append(new CommentView({model: model}).render().el);
        });
        
        return this;
    },

    typing: function(event){
      $("#comment-input").autosize();
    },
    
    submit_comment: function (ev) {
    	ev.preventDefault();
    	
    	if (this.is_active == true) {
    		this.is_active = false;
    	}else{
    		return;
    	}
    	
    	var comment = this.$el.find('textarea').val();
		if (jQuery.trim(comment) == '') return;
		
		this.$el.find('.submit-comment').attr('disabled','disabled');
		
		
		var comment = new Comment({
			object_type: this.options.object_type,
			object_id: this.options.object_id,
			comment: comment,
		});
		
		var self = this;
		comment.save({},{
			'success': function(model, response) {
				self.add_comment(model);
				self.$el.find('.submit-comment').removeAttr('disabled');
				localUser.attributes.profile.comment_count = localUser.get('profile').comment_count + 1;
				this.is_active = true;
			},
			'error': function(error) {
				// redirect to login
				onOffline();
				this.is_active = true;
			}
		});
    },
    
    add_comment: function (model) {
    	this.collection.add(model);
  		var $com_list = this.$el.find('.comment-list');
  		var new_comment = new CommentView({model: model});
  		new_comment.render();
  		new_comment.$el.hide();
  		$com_list.append(new_comment.el);
  		new_comment.$el.slideDown('normal');
  		if (this.options.callback) this.options.callback(model);
	}
    
});