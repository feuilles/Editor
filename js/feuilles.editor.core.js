/*!
 * FeuillesEditor (https://github.com/feuilles/Editor)
 * Copyright 2014 Alex Duloz
 * Licensed under MIT (https://github.com/feuilles/Editor/blob/gh-pages/LICENSE)
 */
(function() {

	/**
	 *
	 * Init Core
	 *
	 */
	var self = editor.core = {};


	/**
	 *
	 * Init the editor
	 *
	 */
	editor.core.init = function() {
		//
		// Init "write" functionalities
		//
		editor.writer.init(function() {
			//
			// Init "conversations" functionalities
			//
			editor.conv.init(function() {
				//
				// We're done.
				//
			});
		});
	};

	/**
	 *
	 * Save
	 *
	 */
	editor.core._saving = false;
	editor.core.save = function(data) {

		var data = data ||  {};

		//
		// Already saving. 
		//
		if (self._saving === true) {
			notify("Saving previous version. Wait a few seconds"); // Overlay?
			return;
		}

		//
		// Init "saving state".
		//
		self._saving = true;

		//
		// Mimic hidden fields: we get
		// useful data that ned to be sent to the
		// server from elements that are not
		// displayed.
		//
		// REFACTOR: use data attributes?
		//
		$('[data-hidden-fields="doc_editor"]').find("li").each(function() {
			$this = $(this);
			data[$this.attr("data-name")] = $this.attr("data-value");
		});

		//
		// Create the collection to be sent to the server.
		// Each field marked with '[data-editor-grab="true"]'
		// will be part of the collection.
		//
		$('[data-editor-grab="true"]').each(function() {
			var $this = $(this);
			var content;
			var fieldName = $this.attr("data-field-name");

			//
			// Grab "inline" content as is.
			// Parse "multiline" content
			// @see feuilles.editor.util.js.#parseContent
			//
			if ($this.attr("data-feuilles-write") === "multiline") {
				content = editor.util.parseContent(this.innerHTML);
			} else {
				content = $this.text();
			}

			data[fieldName] = content;
		});

		//
		// Check if we have a "save" url.
		// @see feuilles.editor.js#config
		//
		if (!editor.config._save) {
			console.log("No 'save' url provided");
			return;
		}

		//
		// Show a spinner
		// REFACTOR: should be called from a user callback.
		//
		$(".nav-spin").show().spin("small", "#333");

		//
		// POST request
		//
		$.post(editor.config._save, data, function(res, status, xhr) {

			//
			// Unlock "saving state"
			//
			editor.core._saving = false;

			//
			// Hide spinner
			// REFACTOR: should be called from a user callback.
			//
			$(".nav-spin").spin(false).hide();

			//
			// Notification: error
			//
			if (xhr.status !== 200) {
				notify(res.message);
				return;
			}

			//
			// Notification: success
			//
			notify(res.message);
		});
	};
}).call(this);