/*!
 * FeuillesEditor (https://github.com/feuilles/Editor)
 * Copyright 2014 Alex Duloz
 * Licensed under MIT (https://github.com/feuilles/Editor/blob/gh-pages/LICENSE)
 */
(function() {

	/**
	 *
	 * Init plugin
	 * Then create public API.
	 *
	 */
	var self = editor = {};

	/**
	 *
	 * Start the editor
	 *
	 */
	editor.init = function() {
		editor.core.init();
	};

	/**
	 *
	 * Save a document
	 *
	 */
	editor.save = function() {
		editor.core.save();
	};

	/**
	 *
	 * Config options
	 *
	 */
	editor.config = {};

	/**
	 *
	 * The url to which send data
	 * when editor.save is called.
	 *
	 */
	editor.config.save = null;
	editor.config.save = function(url) {
		editor.config._save = url
	};

}).call(this);