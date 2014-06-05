(function() {

	var util = editor.util;

	var self = editor.writer = {};

	/**
	 *
	 * Init the editor:
	 * basic behaviors & events
	 *
	 */
	editor.writer.init = function(callback) {

		//
		// Empty paragraphs are ignored in the flow
		// of focus with the kbd.
		// Attempt to fix that.
		//
		kDown.whenDown("up", function(e) {
			editor.writer.focus.up(e);
		});

		kDown.whenDown("down", function(e) {
			editor.writer.focus.down(e);
		});

		kDown.whenDown("left", function(e) {
			editor.writer.focus.left(e);
		});

		kDown.whenDown("right", function(e) {
			editor.writer.focus.right(e);
		});

		document.addEventListener("keydown", function(e) {

			var realTarget = editor.util.getTarget();
			if (!realTarget) {
				return;
			}

			var $target = $(realTarget);

			var targetHTML = $.trim($target.html());

			targetHTML = editor.util.noBr(targetHTML);

			if ($target.attr("data-empty") === "true" && targetHTML !== "" && targetHTML !== "&nbsp;") {
				$target.attr("data-empty", "false");
			}

		}, false);

		//
		// Prevent line jumps in contenteditable
		// inline areas
		//
		kDown.whenDown("enter", function(e) {
			self.on.enter(e);
		});

		kDown.whenDown("backspace", function(e) {
			self.on.backspace(e);
		});

		self.makeContent($("#the-editor").html());

		callback();
	};

	/**
	 *
	 * This is where we translate our raw content
	 * into an editor, HTML-ish, rich content
	 *
	 */
	editor.writer.makeContent = function(content) {
		
		// console.log(content);

		//
		// Highlight refs
		//
		content = content.replace(/{ref for=([\s\S]*?)}([\s\S]*?){\/ref}/g, '<span class="conversation-highlight" data-ref-for="$1">$2</span>', content);

		//
		// Hide embedded conversations
		//
		//content = content.replace(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g, '<div class="embedded-conversation" style="display:none;" data-conversation-id="$1">$2<\/div>');
		var conv = content.match(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g);
		content = content.replace(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g, "");

		var br = content.split(/(?:\r\n|\r|\n)/g);

		if (br) {
			var lineByLine = "";
			for (var j = 0; j < br.length; j++) {
				if ($.trim(br[j]) === "") {
					lineByLine += '<div data-editor="token" data-token="p" data-empty="true"></div>';
				} else {
					lineByLine += '<div data-editor="token" data-token="p">' + br[j] + "</div>";
				}

				content = lineByLine;

			};
		} else {
			content = '<div data-editor="token" data-token="p">' + content + '</div>';
		}



		/*
		//
		// Highlight refs
		//
		content = content.replace(/{ref for=([\s\S]*?)}([\s\S]*?){\/ref}/g, '<span class="conversation-highlight" data-ref-for="$1">$2</span>', content);

		//
		// Hide embedded conversations
		//
		content = content.replace(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g, '<div class="embedded-conversation" style="display:none;" data-conversation-id="$1">$2<\/div>');
		*/

		//
		// Preserve conversations from tokenization
		//
		/*
		var div = document.createElement("div");
		div.innerHTML = content;

		$(div).find('[data-editor="token"]').each(function(){

			console.log(this);

			if ($(this).closest(".embedded-conversation").length) {
				$(this).remove();
			}
		});
		/*
		var div = document.createElement("div");
		div.innerHTML = content;
		$(div).find(".embedded-conversation").each(function() {
			$(this).find('[data-editor="token"]').remove();
		});
		*/
		//content = $(div).html();

		if (conv) {
			for (var i = 0; i < conv.length; i++) {
				content += conv[i].replace(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g, '\n\n<div class="embedded-conversation" style="display:none;" data-conversation-id="$1">$2<\/div>');
				//content += conv[i]
			};
		}

		//console.log(content);

		$('[data-feuilles-write="multiline"]').html(content);
	};

	editor.writer.focus = {
		"up": function(e) {
			var target = editor.util.getTarget();

			if (!target) {
				return;
			}

			var $target = $(target);

			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			var $prev = $target.prev();

			if (!$prev.length) {
				return;
			}

			if ($prev.attr("data-empty") !== "true") {
				return;
			}
			//
			// In the editor + prev empty node
			// take control of the event
			//
			e.preventDefault();

			editor.util.focus($prev[0]);

		},

		"down": function(e) {
			var target = editor.util.getTarget();

			if (!target) {
				return;
			}

			var $target = $(target);

			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			var $next = $target.next();

			if (!$next.length) {
				return;
			}

			if ($next.attr("data-empty") !== "true") {
				return;
			}
			//
			// In the editor + prev empty node
			// take control of the event
			//
			e.preventDefault();

			editor.util.focus($next[0]);
		},

		"left": function(e) {
			var target = editor.util.getTarget();

			if (!target) {
				return;
			}

			var $target = $(target);

			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			//
			// If empty node, we know we're going to
			// move to another node. If not, check that
			// we're at the end of the last text node.
			//
			if ($target.attr("data-empty") !== "true") {
				var sel = window.getSelection();

				if (editor.util.firstTextNode($target[0]) !== sel.focusNode) {
					return;
				}

				if (sel.focusOffset !== 0) {
					return;
				}
			}

			var $prev = $target.prev();

			if (!$prev.length) {
				return;
			}

			if ($prev.attr("data-empty") !== "true") {
				return;
			}
			//
			// In the editor + prev empty node
			// take control of the event
			//
			e.preventDefault();

			editor.util.focus($prev[0]);
		},

		"right": function(e) {
			var target = editor.util.getTarget();

			if (!target) {
				return;
			}

			var $target = $(target);

			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			//
			// If empty node, we know we're going to
			// move to another node. If not, check that
			// we're at the end of the last text node.
			//
			if ($target.attr("data-empty") !== "true") {

				var sel = window.getSelection();

				var lastTextNode = editor.util.lastTextNode($target[0]);

				//console.log($target[0]);
				//console.log(lastTextNode);
				//console.log(sel.focusNode);

				if (lastTextNode !== sel.focusNode) {
					return;
				}

				if (sel.focusOffset !== lastTextNode.length) {
					return;
				}
			}

			var $next = $target.next();

			if (!$next.length) {
				return;
			}

			if ($next.attr("data-empty") !== "true") {
				return;
			}
			//
			// In the editor + prev empty node
			// take control of the event
			//
			e.preventDefault();

			editor.util.focus($next[0]);
		},
	};


	editor.writer.on = {
		"enter": function(e) {
			$target = $(e.target);
			if ($target.attr("data-feuilles-write") === "inline") {
				e.preventDefault();
				return false;
			}

			if ($target.attr("data-feuilles-write") === "multiline") {
				e.preventDefault();

				var sel = window.getSelection();
				$node = $(sel.focusNode);

				if (!$node.attr("data-token")) {
					$node = $node.closest('[data-editor="token"]');
				}

				//
				// About to create a new section.
				// We first split the current section
				// at caret position
				//
				var pieces = editor.util.contentToPieces($node[0]);
				pieces[0] = editor.util.noBr(pieces[0]);
				pieces[1] = editor.util.noBr(pieces[1]);

				//
				// Check if the current section (the one
				// where the caret was located when the
				// user hit "enter") is empty.
				//
				var isEmpty;
				if ($.trim(editor.util.noBr(pieces[0])) === "") {
					isEmpty = true;
				}

				//
				// If the current section (pieces[0]) is empty 
				// and not a list, turn it into <hr>
				//
				if (isEmpty) {
					$node.attr("data-empty", "true");
					$node.html("");
				}


				// Update current section before moving to
				// the next one. The browser is kind enough
				// to fix unclosed tags for us. Normally.
				//
				if (!isEmpty) {
					$node.html(pieces[0]);
				}

				var $newEl = $('<div data-editor="token" data-token="p" data-empty="false">' + pieces[1] + '</div>');

				$newEl.html(editor.util.noBr($newEl.html()));

				$node.after($newEl);

				$newEl.html(editor.util.noBr($newEl.html()));

				editor.util.focus($newEl[0]);

				return false;
			}
		},
		"backspace": function(e) {

			$target = $(e.target);

			if ($target.attr("data-feuilles-write") !== "multiline") {
				return;
			}

			var sel = window.getSelection();
			$node = $(sel.focusNode);

			if (!$node.attr("data-token")) {
				$node = $node.closest('[data-editor="token"]');
			}

			if (!$node.attr("data-token")) {
				return;
			}

			var firstTextNode = editor.util.firstTextNode($node[0]);

			var deleteNode = (firstTextNode === sel.focusNode && sel.focusOffset === 0);

			if (!deleteNode) {
				return;
			}

			return;

			var nodeContent = $node.html();

			if ($.trim(nodeContent) === "") {
				empty = true;
			}

			e.preventDefault();

			$prev = $node.prev();

			console.log($prev[0]);

		}
	};

}).call(this);