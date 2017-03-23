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

	(function() {
		var count = ($('.fieldset-block:not(.fieldset-block-dummy)').length)*1;
		var index = $('.fieldset-block-dummy').first().data('clone-siblings')*1;

		if (index > count) {
			index += 1;
		} else {
			index = count + 1;
		}
		$('.fieldset-block-dummy').data('clone-siblings', index);
	})();

	dynamic_content_manager.clone_dummy_form_element = function($dummy_obj) {
		if (!$dummy_obj) return;

		var $container = $dummy_obj.parent();
		var new_index = $dummy_obj.data('clone-siblings')*1 + 1;
		$dummy_obj.data('clone-siblings', new_index);

		var $new_obj = $dummy_obj.clone();
		$new_obj
			.removeClass('cbs-fieldset-block-dummy')
			.addClass('cbs-fieldset-just-added')
			.addClass('modular-content-block')
			.html(function(i, oldHTML) { // replace indexes
				return oldHTML.replace(/_DUMMY_INDEX_/g, new_index);
			})
			.html(function(i, oldHTML) { // replace names
				return oldHTML.replace(/_DUMMY_NAME_/g, new_index);
			})
			.insertBefore($container.children('.cbs-fieldset-block-dummy'));

		// setup collapsible item
		if ($new_obj.children('fieldset').children('legend').length > 0) {
			cbs_admin.setup_collapsible_block($new_obj.children('fieldset').children('legend'));
		}

		// initiate removable button
		if ($new_obj.find('.cbs-removing-button').length > 0) {
			cbs_admin.update_remove_buttons($new_obj);
		}

		// setup showhide
		var $new_showhide_selects = $new_obj.find(".cbs-theme-form-select select.showhide-row");
		if ($new_showhide_selects.length > 0) {
			$new_showhide_selects.each(function(){
				cbs_admin.setup_select_showhide($(this));
				cbs_admin.update_select_showhide($(this));
			});
		}

		// Setup Checkbox
		var $new_showhide_checkbox = $new_obj.find(".cbs-theme-form-checkbox input[type='checkbox'].showhide-row");
		if ($new_showhide_checkbox.length > 0) {
			$new_showhide_checkbox.each(function(){
				cbs_admin.setup_checkbox_showhide($(this));
				cbs_admin.update_checkbox_showhide($(this));
			});
		}

		// Setup Select Multiple items with Select2
		var $new_select2_box = $new_obj.find("select[multiple='multiple'].cbs-select2");
		if ($new_select2_box.length > 0) {
			$new_select2_box.each(function(){
				$(this)
					.addClass('cbs-category-dropdown')
					.select2({
						placeholder: 'Select Category',
						allowClear: true
					});
			});
		}

		// Setup MediaImage blocks
		var $new_media_image_box = $new_obj.find(".meta-image-selector");
		if ($new_media_image_box.length > 0) {
			$new_media_image_box.each(function(){
				cbs_admin.setup_meta_image($(this));
			});
		}

	}
	dynamic_content_manager.update_remove_buttons = function($block) {
		if ($block) {
			var $remove_buttons = $block.find('.cbs-removing-button');
		} else {
			var $remove_buttons = $('.modular-content-block .cbs-removing-button');
		}

		if ($remove_buttons.length > 0) {
			$remove_buttons.each(function(){
				$(this)
					.off('click')
					.on('click', function(e){
						e.preventDefault();
						$(this).closest('.modular-content-block').remove();
						$(this).off('click');
						dynamic_content_manager.update_sortable_index();
					})
					.show();
			});
		}
	}




	var image_selector = {};

	image_selector.setup_meta_image = function($obj) {

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
			image_selector.setup_meta_image($(this));
		});
	}
});
