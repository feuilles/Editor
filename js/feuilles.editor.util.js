(function() {

	var self = editor.util = {};

	/**
	 *
	 * Turn HTML conversations
	 * into embedded conversations
	 *
	 */
	editor.util.parseContent = function(content) {
		//
		// Remove <br>s
		//
		$("br").remove();

		//
		// Extract the conversations
		//
		var conv = document.createElement("div");
		conv.innerHTML = content;
		$conv = $(conv);

		var $theConv = $conv.find(".embedded-conversation");

		if ($theConv.length) {

			var the_convs = "";

			$conv.find($theConv).each(function() {
				$div = $(this);
				var divContent = $div.text();

				var refId = $div.attr("data-conversation-id");

				the_convs += "\n\n{conversation id=" + refId + "}" + divContent + "{/conversation}";
			});
		}

		conv.innerHTML = "";

		//
		// Tokens to content
		//
		var placeHolder = document.createElement("div");
		placeHolder.innerHTML = content;
		$placeHolder = $(placeHolder);

		var content = "";

		var first = true;
		$placeHolder.find('[data-editor="token"]').each(function() {
			$this = $(this);
			if ($this.attr("data-token") === "p") {
				content += (first === true) ? $this.html() : "\n" + $this.html();
			}
			first = false;
		});

		//
		// Transform conversation <span>s into
		// “semantic”, embedded conversations
		//
		var placeHolder = document.createElement("div");
		placeHolder.innerHTML = content;
		$placeHolder = $(placeHolder);

		$placeHolder.find("span").each(function() {
			$span = $(this);
			var spanContent = $span.text();

			var refId = $span.attr("data-ref-for");

			//
			// If span is empty, it's a deleted conversation.
			// We remove it.
			//
			if ($.trim(spanContent) === "") {
				$span.remove();
				// Remove related conv div
				$('[data-conversation-id="' + refId + '"]').remove();
				return;
			}

			spanContent = "{ref for=" + refId + "}" + spanContent + "{/ref}";

			var txt = document.createTextNode(spanContent);
			$span.before(txt);
			$span.remove();

		});

		var the_convs = the_convs || "";
		return $placeHolder.text() + the_convs;
	};


	// http: //stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
	editor.util.nextNode = function(node) {
		if (node.hasChildNodes()) {
			return node.firstChild;
		} else {
			while (node && !node.nextSibling) {
				node = node.parentNode;
			}
			if (!node) {
				return null;
			}
			return node.nextSibling;
		}
	};

	// http://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
	editor.util.getRangeSelectedNodes = function(range) {
		var node = range.startContainer;
		var endNode = range.endContainer;

		// Special case for a range that is contained within a single node
		if (node == endNode) {
			return [node];
		}

		// Iterate nodes until we hit the end container
		var rangeNodes = [];
		while (node && node != endNode) {
			rangeNodes.push(node = editor.util.nextNode(node));
		}

		// Add partially selected nodes at the start of the range
		node = range.startContainer;
		while (node && node != range.commonAncestorContainer) {
			rangeNodes.unshift(node);
			node = node.parentNode;
		}

		return rangeNodes;
	};

	// http://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
	editor.util.getSelectedNodes = function() {
		if (window.getSelection) {
			var sel = window.getSelection();
			if (!sel.isCollapsed) {
				return editor.util.getRangeSelectedNodes(sel.getRangeAt(0));
			}
		}
		return [];
	};

	editor.util.setCaretAt = function(el, pos) {
		var range = document.createRange();
		var sel = window.getSelection();
		range.setStart(el, pos);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	};

	editor.util.firstTextNode = function(el) {
		if (!el) {
			return false;
		}
		if (el.nodeType !== 3) {
			return self.firstTextNode(el.firstChild, el)
		}
		return el;
	};

	editor.util.lastTextNode = function(el) {
		if (!el) {
			return false;
		}
		if (el.nodeType !== 3) {
			return self.lastTextNode(el.lastChild, el)
		}
		return el;
	};

	editor.util.noBr = function(input) {
		return input.replace(/<br>/g, "");
	};

	editor.util.contentToPieces = function(el) {
		$el = $(el);
		var unique = "___" + self.now() + "___";
		self.paste(unique);
		return $el.html().split(unique);
	};


	editor.util.paste = function(content, highlight) {

		var sel = window.getSelection();
		var range = sel.getRangeAt(0);
		range.deleteContents();

		var el = document.createElement("div");
		el.innerHTML = content;
		var frag = document.createDocumentFragment();
		var node;
		var lastNode;

		while ((node = el.firstChild)) {
			lastNode = frag.appendChild(node);
		}

		var firstNode = frag.firstChild;
		range.insertNode(frag);

		// Preserve the selection
		if (lastNode) {
			range = range.cloneRange();
			range.setStartAfter(lastNode);

			//
			// Should we highlight 
			// pasted content?
			//
			if (highlight) {
				range.setStartBefore(firstNode);
			} else {
				range.collapse(true);
			}

			sel.removeAllRanges();
			sel.addRange(range);
		}

		return {
			firstNode: firstNode,
			lastNode: lastNode
		}

	};

	// From underscore.js
	editor.util.now = Date.now || function() {
		return new Date().getTime();
	};

	editor.util.focus = function(el) {


		// In some cases, we may just have a <br>, 
		// added by the browser, which will cause a bug.
		el.innerHTML = self.noBr(el.innerHTML);
		var isEmpty = ($.trim(el.innerHTML) === "");

		var sel = window.getSelection();
		var range = document.createRange();

		if (!isEmpty) {
			var firstTextNode = self.firstTextNode(el);
			range.setStart(firstTextNode, 0);
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
		}


		if (isEmpty) {
			el.innerHTML = '\u00a0';
			range.selectNodeContents(el);
			sel.removeAllRanges();
			sel.addRange(range);
			document.execCommand('delete', false, null);
		}
	};

	/**
	 *
	 * In contenteditable elements,
	 * you cannot rely on the event
	 * to find the target element
	 */
	editor.util.getTarget = function() {
		var sel = window.getSelection();
		var container = sel.focusNode;
		if (container) {
			return container.nodeType === 3 ? container.parentNode : container;
		}
		return;
	};

	editor.util.moment = function() {
		var months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December"
		];

		var d = new Date();
		var day = d.getDate();
		var month = d.getMonth();
		var year = d.getFullYear();

		var hours = d.getHours();
		var minutes = d.getMinutes();
		var seconds = d.getSeconds();
		return day + "-" + months[month] + "-" + year + " " + hours + ":" + minutes + ":" + seconds;

	};

}).call(this);