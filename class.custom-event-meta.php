<?php
/**
 * Proof of Concept
 * Class to add custom meta boxes to WP pages
 */

class Custom_Event_Meta {
	const META_KEY    = 'poc-meta-key';
	const SET_KEY     = 'poc-meta-set';
	const NONCE_NAME  = 'secure-nonce';
	const NONCE_VALUE = 'n0nc3';

	/**
	 * Holds the singleton instance of this class
	 */
	static $instance = false;

	/**
	 * Module types
	 */
	static $supported_module_type = array();

	/**
	 * Entry point into the singleton class
	 * @static
	 * @return object $instance of the obejct Custom_Event_Meta
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new Custom_Event_Meta;
		}

		return self::$instance;
	}

	/**
	 * Constructor.  Initializes WordPress hooks
	 */
	private function __construct() {
		if (is_admin()) {
			add_action('add_meta_boxes', array($this, 'add_meta_boxes'), 10, 2);
			add_action('save_post', array($this, 'save_post'));
			// Load Scripts and Styles
			add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
		}
		add_action('rest_api_init', function() {
			register_rest_field('page',
				self::META_KEY,
				array(
					'get_callback' => array($this, 'get_meta_api')
				)
			);
		});

		self::$supported_module_type = array(
			'featured_artist' => array('title' =>'Featured Artist', 'method' => 'fa_module'),
			'videos' => array('title' =>'Videos', 'method' => 'video_module'),
			'news' => array('title' =>'News', 'method' => 'news_module')
		);
	}


	/**
	 * Method to add custome meta box to WP post
	 */
	public function add_meta_boxes() {
		add_meta_box('poc-meta', 'Custom Event Meta', array($this, 'metabox'), 'page');
	}

	/**
	 * Method to enqueue scripts and styles
	 */
	public function admin_enqueue_scripts() {
		wp_enqueue_style( 'load-fa', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css' );
		wp_enqueue_style('poc-meta-css', plugins_url('css/poc-meta.css', __FILE__), array(), '03152017');
		wp_enqueue_script('poc-meta-js', plugins_url('js/poc-meta.js', __FILE__), array('jquery'), '03152017');
		wp_enqueue_script('jquery-ui-accordion');
		wp_enqueue_script('jquery-ui-core');
	}

	/**
	 * Method to render Featured Artists Module
	 * @param array $data - stored values for the module
	 * @param int $index - numeric index of the module
	 * @return string $result - HTML for the module
	 */
	public function fa_module($index, $data) {
		$result = '';
		$default_element_num = 3;
		if (empty($data)) return $result;

		ob_start();
		?>
		<table class="poc-meta-table">
			<tbody>
				<tr>
					<td colspan="2">
						<?php
							$key = 'module_title';
							$name = self::SET_KEY . '[' . $key . ']';
							$value = (!empty($data[$key])) ? $data[$key] : '';
						?>
						<input type="text" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>" class="poc-input-full-field" placeholder="Module Title">
					</td>
				</tr>
				<tr>
					<td colspan="2">
						<?php
							$key = 'more_link';
							$name = self::SET_KEY . '[' . $key . ']';
							$value = (!empty($data[$key])) ? $data[$key] : '';
						?>
						<input type="text" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>" class="poc-input-full-field" placeholder="More Link">
					</td>
				</tr>
				<?php 
					$images_count = count($data['element_image']);
					$title_count = count($data['element_title']);
					$link_count = count($data['element_link']);
					$element_count = max($default_element_num, $title_count, $link_count, $images_count);
				?>
				<?php for ($i = 0; $i < $element_count; $i++) : ?>
					<tr>
						<td class="label-td">
							<label for="">Image <?php echo $i + 1;?></label>
						</td>
						<td>
							<?php
								$image_src = '';
								$image_id = '';
								$key = 'element_image';
								$name = self::SET_KEY . '[' . $key . '][' . $i .']';
								$value = (!empty($data[$key][$i])) ? $data[$key][$i] : '';
								if (!empty($value)) {
									$image_atts = wp_get_attachment_image_src($value, 'thumbnail');
									if (!empty($image_atts) && !empty($image_atts[0])) {
										$image_src = $image_atts[0];
										$image_id = $value;
									}
								}
							?>
							<div class="meta-image-selector">
								<?php if (!empty($image_src)) : ?>
									<img src="<?php echo esc_url($image_src); ?>" class="meta-image-preview" />
								<?php endif; ?>

								<input type="hidden" class="meta-image-id" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($image_id); ?>" data-preview-image-size="<?php echo esc_attr('thumbnail'); ?>" />
							</div>
						</td>
					</tr>
					<tr>
						<td class="label-td">
							<label for="">Title <?php echo $i+1;?></label>
						</td>
						<td>
							<?php
								$key = 'element_title';
								$name = self::SET_KEY . '[' . $key . '][' . $i .']';
								$value = (!empty($data[$key][$i])) ? $data[$key][$i] : '';
							?>
							<input type="text" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>" class="poc-input-full-field" placeholder="Element Title">
						</td>
					</tr>
					<tr>
						<td class="label-td">
							<label for="">Link <?php echo $i+1;?></label>
						</td>
						<td>
							<?php
								$key = 'element_link';
								$name = self::SET_KEY . '[' . $key . '][' . $i .']';
								$value = (!empty($data[$key][$i])) ? $data[$key][$i] : '';
							?>
							<input type="text" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>" class="poc-input-full-field" placeholder="Element Link">
						</td>
					</tr>
				<?php endfor; ?>
			</tbody>
		</table>
		<?php
		$result = ob_get_contents();
		ob_end_clean();

		return $result;
	}

	/**
	 * Draws meta box on the page
	 * @param object $post - object type WP_Post
	 */
	public function metabox($post) { 
		$meta = self::get_meta($post->ID);var_dump($meta);
		/*
			Meta structure:
			[modules]
				[types] ($supported_module_type values)
					[module] (1,2,3 indexes)
						[module data] (custom form data)
		*/
		$meta = array('modules' => array(
			'featured_artist' => array(
				0 => array(
					'module_title' => 'Features Artists',
					'more_link' => 'http://google.com',
					'element_image' => array("7","5","6"),
					'element_title' => array('Bob','Paul','Chris','Garry','Pete'),
					'element_link' => array('http://google.com','http://google.com','http://google.com')
				),
				1 => array(
					'module_title' => 'Features Artists',
					'more_link' => 'http://google.com',
					'element_image' => array("7","5","6"),
					'element_title' => array('Bob','Paul','Chris'),
					'element_link' => array('http://google.com','http://google.com','http://google.com')
				)
			)
		));

		
		$modules = $meta['modules'];
//var_dump($modules);
		?>

		<div class="clone-button">
			<select>
				<?php foreach (self::$supported_module_type as $value => $config): ?>
					<option value="<?php echo esc_attr($value); ?>"><?php echo esc_html($config['title']); ?></option>
				<?php endforeach; ?>
			</select>
			<a href="#" class="page-title-action" data-clone-callback="dcm_update_index" data-clone-target="#smart-banner-widget-table .fieldset-block-dummy.banner-widget-link-dummy">Add Module</a>
		</div>
		<?php foreach ($modules as $module_type => $module_data): //var_dump($module_type, '<br><br>',self::$supported_module_type);?>
			<?php if (!array_key_exists($module_type, self::$supported_module_type)) continue; ?>
			<?php foreach ($module_data as $module_index => $data): var_dump($module_data); ?>
				<fieldset class="poc-fieldset-block">
					<legend><?php echo esc_html(self::$supported_module_type[$module_type]['title']); ?> Module:</legend>
					<?php
						$method = self::$supported_module_type[$module_type]['method'];
						echo self::$method($module_index, $data);
					?>
					
				</fieldset>
			<?php endforeach; //end of module loop ?>
		<?php endforeach; // end of module type loop ?>
		<?php
		wp_nonce_field(self::NONCE_VALUE, self::NONCE_NAME);
	}

	/**
	 * Fetch meta data for the post for a specific hash key
	 * @param int $post_id - ID of the post
	 * @return array $meta - post meta
	 */
	public function get_meta($post_id) {
		$post_id = (empty($post_id) || intval($post_id) < 1) ? get_the_ID() : intval($post_id);

		if (empty($post_id) || intval($post_id) < 1) return array();

		return get_post_meta($post_id, self::META_KEY, true);
	}

	/**
	 * Fetch meta data for the post API response
	 * @param object $object - WP_Object post object
	 * @param string $field_name - name of the meta to fetch
	 * @return object $request - request object, who cares
	 */
	public function get_meta_api($object, $field_name, $request) {
		return get_post_meta($object['id'], $field_name);
	}

	/**
	 * Process and save all the meta
	 * @param int $post_id - ID of the Post/Page
	 * @return int $post_id - ID of the Post/Page
	 */
	public function save_post($post_id) {
		if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) return $post_id;
		if (empty($_REQUEST[self::NONCE_NAME]) || 
			!wp_verify_nonce($_REQUEST[self::NONCE_NAME], self::NONCE_VALUE)) return $post_id;

		$data = $_REQUEST[self::SET_KEY];
		$sanitized_data = array();
var_dump($data);die;
		if (!empty($data)) {

			// Title
			if (!empty($data['module_title'])) {
				$sanitized_data['module_title'] = sanitize_text_field($data['module_title']);
			}
		
			// Link
			if (!empty($data['more_link'])) {
				$sanitized_data['more_link'] = sanitize_text_field($data['more_link']);
			}

			// Elements Images
			if (!empty($data['element_image'])) {
				$sanitized_data['element_image'] = array_map('sanitize_text_field', $data['element_image']);
			}

			// Elements Titles
			if (!empty($data['element_title'])) {
				$sanitized_data['element_title'] = array_map('sanitize_text_field', $data['element_title']);
			}

			// Elements Links
			if (!empty($data['element_link'])) {
				$sanitized_data['element_link'] = array_map('sanitize_text_field', $data['element_link']);
			}

		} // if not empty Rad Data

		if (empty($sanitized_data)) {
			delete_post_meta($post_id, self::META_KEY);
		} else {
			update_post_meta($post_id, self::META_KEY, $sanitized_data);
		}

		return $post_id;
	}
}
