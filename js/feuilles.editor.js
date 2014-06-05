(function() {

	var self = editor = {};

	/**
	 *
	 * Just a few wrappers
	 *
	 */
	editor.init = function() {
		editor.core.init();
	};

	editor.save = function() {
		editor.core.save();
	};

	editor.config = {
		"save": function(url) {
			editor.config._save = url
		},
		_save: null
	};

}).call(this);