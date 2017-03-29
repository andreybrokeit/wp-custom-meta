/* Manipulating DOM                     ___
                    .-'   `'.
                   /         \
                   |         ;
                   |         |           ___.--,
          _.._     |0) ~ (0) |    _.---'`__.-( (_.
   __.--'`_.. '.__.\    '--. \_.-' ,.--'`     `""`
  ( ,.--'`   ',__ /./;   ;, '.__.'`    __
  _`) )  .---.__.' / |   |\   \__..--""  """--.,_
 `---' .'.''-._.-'`_./  /\ '.  \ _.-~~~````~~~-._`-.__.'
       | |  .' _.-' |  |  \  \  '.               `~---`
        \ \/ .'     \  \   '. '-._)
         \/ /        \  \    `=.__`~-.
         / /\         `) )    / / `"".`\
   , _.-'.'\ \        / /    ( (     / /
    `--~`   ) )    .-'.'      '.'.  | (
           (/`    ( (`          ) )  '-;
            `      '-;         (-'
*/
jQuery(function($) {
	dynamic_content_manager = {};

	dynamic_content_manager.update_local_index = function() {
		var count = ($('.fieldset-block:not(.fieldset-block-dummy)').length)*1;
		var index = $('.fieldset-block-dummy').first().data('clone-siblings')*1;

		if (index > count) {
			index += 1;
		} else {
			index = count + 1;
		}
		$('.fieldset-block-dummy').data('clone-siblings', index);
	}

	dynamic_content_manager.clone_dummy_form_element = function($dummy_obj) {
		if (!$dummy_obj) return;
		var $container = $('#poc-module-wrapper');

		var new_index = $('#poc-module-wrapper li').size();

		var $new_obj = $dummy_obj.clone();

		$container.append(
			$('<li>').addClass('ui-state-default')
			.append($new_obj
				.attr('class', '')
				.addClass('poc-fieldset-block')
				.addClass('collapsible')
				.html(function(i, oldHTML) { // replace indexes
					return oldHTML.replace(/dummy/g, new_index);
				})
			)
		);

		dynamic_content_manager.setup_collapsible_block($new_obj.find('legend'));

		// initiate removable button
		if ($new_obj.find('.dcm-remove-button').length > 0) {
			dynamic_content_manager.update_remove_buttons($new_obj);
		}

		// Setup MediaImage blocks
		var $new_media_image_box = $new_obj.find(".meta-image-selector");
		if ($new_media_image_box.length > 0) {
			$new_media_image_box.each(function(){
				dynamic_content_manager.setup_meta_image($(this));
			});
		}

	}
	dynamic_content_manager.update_remove_buttons = function($block) {
		if ($block) {
			var $remove_buttons = $block.find('.dcm-remove-button');
		} else {
			var $remove_buttons = $('.dcm-remove-button');
		}

		if ($remove_buttons.length > 0) {
			$remove_buttons.each(function(){
				$(this)
					.off('click')
					.on('click', function(e){
						e.preventDefault();
						$(this).closest('li').remove();
						$(this).off('click');
						dynamic_content_manager.update_sortable_index();
					})
					.show();
			});
		}
	}

	dynamic_content_manager.init_clone_buttons = function() {

		// clone form items links
		var $clone_buttons = $('.dcm-clone-button');
		if ($clone_buttons.length > 0) {
			$clone_buttons.each(function(){
				$(this).on('click', function(e){
					e.preventDefault();

					// get type to clone
					$clone_type = $(this).parent().children('select').find(":selected").val();
					var clone_dummy_selector = $(this).data('clone-target');
					clone_dummy_selector = clone_dummy_selector + '-' + $clone_type;

					if (clone_dummy_selector) {
						var $clone_object = $('.'+clone_dummy_selector);
						dynamic_content_manager.clone_dummy_form_element($clone_object);
						dynamic_content_manager.update_sortable_index();
					}
				});
			});
			dynamic_content_manager.update_remove_buttons();
		}
	}

	dynamic_content_manager.setup_meta_image = function($obj) {

		// for sanity, always has class of "meta-image-selector"
		if (!$obj.hasClass('meta-image-selector')) return;

		// assume no links or containers exist and create them

		$image = $obj.children('img.meta-image-preview');
		if ($image.length < 1) {
			var $image = $('<img>')
				.addClass('meta-image-preview')
				.attr('src', '');
			$obj.append($image);
		}
		$image.attr('src') ? $image.show() : $image.hide();

		$link = $obj.children('a.meta-image-button');
		if ($link.length > 0) {
			$link.remove(); // remove the old link, if its somehow there
		}
		var $add_link = $('<a>')
			.attr('href', '#')
			.addClass('meta-image-add-button')
			.text('Choose image')
			.on('click', function(e){
				e.preventDefault();

				var $that = $(this);

				// Sets up the media library frame
				file_frame  = wp.media({
					frame: 'select',
					state: 'mystate',
					library: {type: 'image'},
					multiple: false
				});

				file_frame.states.add([
					new wp.media.controller.Library({
						id: 'mystate',
						title: 'Choose image',
						priority: 20,
						toolbar: 'select',
						filterable: 'uploaded',
						library: wp.media.query(file_frame.options.library),
						multiple: file_frame.options.multiple ? 'reset' : false,
						editable: true,
						displayUserSettings: false,
						displaySettings: true,
						allowLocalEdits: true
					})
				]);

				// Runs when an image is selected.
				file_frame.on('select', function(){
					// Grabs the attachment selection and creates a JSON representation of the model.
					var media_attachment = file_frame.state().get('selection').first().toJSON();

					var image_size = 'thumbnail';
					var media_url = '';
					var $id_block = $that.siblings('.meta-image-id');
					var $del_link = $that.siblings('.meta-image-delete-button');
					var $thumbnail = $that.siblings('.meta-image-preview');

					if ($id_block.data('preview-image-size')) {
						image_size = $id_block.data('preview-image-size');
					}

					if ( media_attachment.sizes[image_size] ) {
						media_url = media_attachment.sizes[image_size].url
					} else {
						media_url = media_attachment.sizes['full'].url
					}

					$thumbnail.attr('src', media_url); // Update the thumbnail source
					$thumbnail.is(':hidden') && $thumbnail.show(); // Show the thumbnail if it is hidden
					$del_link.is(':hidden') && $del_link.show(); // Show the thumbnail delete button if it is hidden
					$id_block.val(media_attachment.id); // set ID
				});
				file_frame.open();
			});
		$obj.append($add_link);

		var $del_link = $('<a>')
			.attr('href', '#')
			.addClass('meta-image-delete-button')
			.text('Remove Image')
			.on('click', function(e){
				e.preventDefault();

				var $that = $(this);
				$that.hide();

				$that.siblings('.meta-image-id').val('');
				$that.siblings('.meta-image-preview').attr('src', '').hide();
			});
		$obj.append($del_link);
		$image.attr('src') ? $del_link.show() : $del_link.hide();

	};

	// Setup and update image blocks
	var $meta_images = $('.meta-image-selector');
	if ($meta_images.length > 0) {
		$meta_images.each(function(){
			dynamic_content_manager.setup_meta_image($(this));
		});
	}


	dynamic_content_manager.setup_dummy_removal_on_submit = function() {
		$('form').on('submit', function(e){
			e.preventDefault();
			$('form .poc-fieldset-block-dummy').remove();
			$('form')
				.off('submit')
				.submit();
		});
	};

	dynamic_content_manager.update_sortable_index = function($block) {

		if (typeof $block == 'undefined') {
			$block = $('.poc-sortable-blocks');
		}
		if ($block.length < 1) return;

		var count = 0;
		$block.find('.item-index').each(function(){
			$(this).attr('value', count);
			count++;
		});
	}

	dynamic_content_manager.setup_collapsible_block = function($obj) {
		if (!$obj) return;

		// bind for collapsible clicks
		$obj.bind('click', function(e){
			var $collapsible_content = $(this).parent().children('.content-item-wrapper');

			$collapsible_content.slideToggle('fast');
			$(this).parent().toggleClass('state-off');
		});
	};

	// *********************************************************** //
	// Init things: set up buttons, remove dummy clones, etc
	dynamic_content_manager.init_clone_buttons();
	dynamic_content_manager.setup_dummy_removal_on_submit();

	var $sortable_blocks = $('.poc-sortable-blocks');console.log($sortable_blocks);
	if ($sortable_blocks.length > 0) {
		$sortable_blocks.sortable({
			axis: 'y',
			handle: '.sortable-block',
			placeholder: 'poc-draggable-placeholder',
			update: function (event, ui) {
				dynamic_content_manager.update_sortable_index();
			}
		});
	}

	// collapsible clicks for fieldset
	var $collapsible_fieldset = $('fieldset.collapsible legend');
	if ($collapsible_fieldset.length > 0) {
		$collapsible_fieldset.each(function(){
			dynamic_content_manager.setup_collapsible_block($(this));
		});
	}// only for fieldset block present

	// *********************************************************** //
});
