<?php
/**
 * Plugin Name:  POC Meta
 * Description:  Add custom meta 
 * Version:      1.0
 * Author:       Andrey C
 * Author URI:   https://github.com/andreybrokeit/
 * License:      GPLv2 or later
 */
define('POC_PLUGIN_DIR', plugin_dir_path(__FILE__));

require_once(POC_PLUGIN_DIR . '/class.custom-event-meta.php');

Custom_Event_Meta::init();
