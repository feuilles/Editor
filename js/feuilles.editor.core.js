(function() {


	var self = editor.core = {};


	/**
	 *
	 * Init the editor
	 *
	 */
	editor.core.init = function() {
		/*
		$("body").on("click", "#the-editor", function(e) {
			editor.util.focus($("#the-editor").find('[data-token="p"]')[0]);
		});
		*/

		//
		// Init the writer
		//
		editor.writer.init(function() {
			//
			// Init conversations
			//
			editor.conv.init(function() {
				setTimeout(function() {
					editor.util.focus($("#the-editor").find('[data-token="p"]')[0]);
				}, 1);
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

		if (self._saving === true) {
			notify("Saving previous version. Wait a few seconds"); // Overlay?
			return;
		}

		self._saving = true;

		//
		// Mimic hidden fields
		//
		$('[data-hidden-fields="doc_editor"]').find("li").each(function() {
			$this = $(this);
			data[$this.attr("data-name")] = $this.attr("data-value");
		});

		//
		// Replace conversations with tokens
		//
		$('[data-editor-grab="true"]').each(function() {

			$this = $(this);

			var content;

			var fieldName = $this.attr("data-field-name");

			if ($this.attr("data-feuilles-write") === "multiline") {
				content = editor.util.parseContent(this.innerHTML);
			} else {
				content = $this.text();
			}

			data[fieldName] = content;
		});

		console.log(data.body);

		if (editor.config._save) {

			$(".nav-spin").show().spin("small", "#333");

			$.post(editor.config._save, data, function(res, status, xhr) {

				editor.core._saving = false;
				$(".nav-spin").spin(false).hide();
				if (xhr.status !== 200) {
					notify(res.message);
					return;
				}
				notify(res.message);
			});
		}
	};
}).call(this);