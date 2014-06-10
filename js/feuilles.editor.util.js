/*!
 * FeuillesEditor (https://github.com/feuilles/Editor)
 * Copyright 2014 Alex Duloz
 * Licensed under MIT (https://github.com/feuilles/Editor/blob/gh-pages/LICENSE)
 */
(function() {

	/**
	 *
	 * forEach shim
	 *
	 */
	var forEach = typeof Array.prototype.forEach === 'function' ? function(arr, fn) {
			return arr.forEach(fn);
		} : function(arr, fn) {
			for (var i = 0; i < arr.length; i++) fn(arr[i]);
		};

	var self = editor.util = {};

	/**
	 *
	 * Turn HTML conversations
	 * into plain text conversations
	 *
	 */
	editor.util.parseContent = function(content) {
		//
		// Remove <br>s
		// Browsers have  a tendency to add them.
		//
		$("br").remove();

		//
		// Extract the conversations from
		// the content passed to this method.
		// We create a "container node", then
		// work on it.
		//
		// Keep conversations "on the side",
		// and then inject them at the end of
		// the doc later.
		//
		var container = document.createElement("div");
		container.innerHTML = content;
		$container = $(container);

		//
		// Conversations in the container
		//
		var $conv = $container.find(".embedded-conversation");

		//
		// Conversations have been found
		//
		if ($conv.length) {
			//
			// Turn "DOM" conversations into
			// strings.
			//
			var convContent = "";
			$container.find($conv).each(function() {
				$current = $(this);
				var currentContent = $current.text();
				var currentId = $current.attr("data-conversation-id");
				convContent += "\n\n{conversation id=" + currentId + "}" + currentContent + "{/conversation}";
			});
		}

		//
		// Reset our HTML
		//
		container.innerHTML = "";

		//
		// New round of parsing
		// Nodes to content (we are creating
		// the string of our document).
		//
		var container = document.createElement("div");
		container.innerHTML = content;
		$container = $(container);

		//
		// Var holding our content string.
		//
		var content = "";

		//
		// Loop through nodes, and extract strings
		// to "populate" our content variable.
		//
		var first = true;
		$container.find('[data-editor="token"]').each(function() {
			$current = $(this);
			if ($current.attr("data-token") === "p") {
				content += (first === true) ? $current.html() : "\n" + $current.html();
			}
			first = false;
		});

		//
		// New round of parsing.
		// Transform conversation <span>s into
		// “semantic”, embedded conversations
		//
		var container = document.createElement("div");
		container.innerHTML = content;
		$container = $(container);

		//
		// Loop
		//
		$container.find("span").each(function() {
			$current = $(this);
			var currentContent = $current.text();

			var currentId = $current.attr("data-ref-for");

			//
			// If span is empty, it's a deleted conversation.
			// We remove it.
			//
			if ($.trim(currentContent) === "") {
				$current.remove();
				//
				// We also remove related 
				// conv div.
				//
				$('[data-conversation-id="' + currentId + '"]').remove();
				return;
			}

			//
			// Wrap the ref with accurate "tags"
			//
			currentContent = "{ref for=" + currentId + "}" + currentContent + "{/ref}";

			//
			// Create a text node, inject it before the span
			// then remove the span.
			//
			var txt = document.createTextNode(currentContent);
			$current.before(txt);
			$current.remove();

		});

		//
		// Conversation or not?
		// If not, empty string
		//
		var convContent = convContent || "";

		//
		// Return our container's content and
		// append conversations (if any).
		//
		return $container.text() + convContent;
	};


	/**
	 *
	 * Turn plain text documents in
	 * HTML documents.
	 *
	 */
	editor.util.makeContent = function(content) {

		//
		// Highlight refs
		//
		content = content.replace(/{ref for=([\s\S]*?)}([\s\S]*?){\/ref}/g, '<span class="conversation-highlight" data-ref-for="$1">$2</span>', content);

		//
		// Hide embedded conversations:
		// First, store them, then simply
		// wipe them.
		//
		var conv = content.match(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g); // store
		content = content.replace(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g, ""); // wipe

		//
		// Line breaks to nodes
		//
		var breaks = content.split(/(?:\r\n|\r|\n)/g);

		//console.log(breaks);

		if (breaks) {
			var lineContent = "";
			for (var j = 0; j < breaks.length; j++) {
				if ($.trim(breaks[j]) === "") {
					lineContent += '<div data-editor="token" data-token="p" data-empty="true"></div>';
				} else {
					lineContent += '<div data-editor="token" data-token="p">' + breaks[j] + "</div>";
				}
			};

			content = lineContent;

		} else {
			content = '<div data-editor="token" data-token="p">' + content + '</div>';
		}

		//
		// If we have conversations, append
		// them to our content.
		//
		if (conv) {
			for (var i = 0; i < conv.length; i++) {
				content += conv[i].replace(/{conversation id=([\s\S]*?)}([\s\S]*?){\/conversation}/g, '\n\n<div class="embedded-conversation" style="display:none;" data-conversation-id="$1">$2<\/div>');
			};
		}

		return content;
	};

	/**
	 *
	 * http: //stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
	 *
	 */
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

	/**
	 *
	 * http: //stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
	 *
	 */
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

	/**
	 *
	 * http: //stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
	 *
	 */
	editor.util.getSelectedNodes = function() {
		if (window.getSelection) {
			var sel = window.getSelection();
			if (!sel.isCollapsed) {
				return editor.util.getRangeSelectedNodes(sel.getRangeAt(0));
			}
		}
		return [];
	};

	/**
	 *
	 * Set the caret at a given position
	 *
	 */
	editor.util.setCaretAt = function(el, pos) {
		var range = document.createRange();
		var sel = window.getSelection();
		range.setStart(el, pos);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	};

	/**
	 *
	 * Find the first text node of an element
	 *
	 */
	editor.util.firstTextNode = function(el) {
		if (!el) {
			return false;
		}
		if (el.nodeType !== 3) {
			return self.firstTextNode(el.firstChild, el)
		}
		return el;
	};

	/**
	 *
	 * Find the last text node of an element
	 *
	 */
	editor.util.lastTextNode = function(el) {
		if (!el) {
			return false;
		}
		if (el.nodeType !== 3) {
			return self.lastTextNode(el.lastChild, el)
		}
		return el;
	};

	/**
	 *
	 * Remove <br>s
	 *
	 */
	editor.util.noBr = function(input) {
		if (!input) {
			return "";
		}
		return input.replace(/<br>/g, "");
	};

	/**
	 *
	 * Split content into two pieces
	 * using a unique string
	 *
	 */
	editor.util.contentToPieces = function(el) {
		$el = $(el);
		var unique = "___" + self.now() + "___";
		self.paste(unique);
		return $el.html().split(unique);
	};

	/**
	 *
	 * Paste content at the caret current position
	 *
	 */
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

	/**
	 *
	 * From underscore.js
	 * Get a timestamp.
	 *
	 */
	editor.util.now = Date.now || function() {
		return new Date().getTime();
	};

	/**
	 *
	 * Set focus on an element in a
	 * contenteditable context
	 *
	 */
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

	/**
	 *
	 * A readable UTC date.
	 */
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

	/**
	 *
	 * From underscore.js
	 *
	 */
	editor.util.invert = function(obj) {
		var result = {};
		for (var prop in obj) {
			if (!obj.hasOwnProperty(prop)) {
				continue;
			}
			result[obj[prop]] = prop;
		}
		return result;
	};

	/**
	 *
	 * From underscore.js
	 *
	 */
	editor.util.keys = function(obj) {
		var keys = [];
		for (var key in obj) {
			keys.push(key);
		}
		return keys;
	};

	/**
	 *
	 * From underscore.js
	 * escape & unescape
	 *
	 */
	var entityMap = {
		escape: {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;'
		}
	};
	entityMap.unescape = editor.util.invert(entityMap.escape);


	var entityRegexes = {
		escape: new RegExp('[' + editor.util.keys(entityMap.escape).join('') + ']', 'g'),
		unescape: new RegExp('(' + editor.util.keys(entityMap.unescape).join('|') + ')', 'g')
	};

	forEach(['escape', 'unescape'], function(method) {
		editor.util[method] = function(input) {
			if (!input) {
				return "";
			}
			return ("" + input).replace(entityRegexes[method], function(match) {
				return entityMap[method][match];
			});
		};
	});

}).call(this);