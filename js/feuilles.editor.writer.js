/*!
 * FeuillesEditor (https://github.com/feuilles/Editor)
 * Copyright 2014 Alex Duloz
 * Licensed under MIT (https://github.com/feuilles/Editor/blob/gh-pages/LICENSE)
 */
(function() {

	/**
	 *
	 * Init Writer
	 *
	 */
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
		// Attempt to fix that by catching
		// "navigational" keys.
		// @see editor.writer.focus
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

		//
		// Turn [data-empty="true"] nodes
		// to [data-empty="false"] if something
		// is typed.
		//
		document.addEventListener("keydown", function(e) {
			//
			// Get our target node.
			// e.target doesn't work as expected
			// in contenteditable contexts.
			// We rely on .getTarget();
			// @see feuilles.editor.util.js#getTarget
			//
			var target = editor.util.getTarget();
			if (!target) {
				return;
			}
			var $target = $(target);
			var targetHTML = editor.util.noBr($.trim($target.html()));

			//
			// "true" to "false" if something
			// is typed.
			//
			if ($target.attr("data-empty") === "true" && targetHTML !== "" && targetHTML !== "&nbsp;") {
				$target.attr("data-empty", "false");
			}

		}, false);

		//
		// Handle the "enter" key in
		// contenteditable contexts.
		//
		kDown.whenDown("enter", function(e) {
			self.on.enter(e);
		});

		//
		// Handle the "backspace" key in
		// contenteditable contexts.
		//
		kDown.whenDown("backspace", function(e) {
			self.on.backspace(e);
		});

		//
		// Grab the raw content displayed in
		// the contenteditable area and
		// make it a bit fancier.
		//
		$theEditor = $("#the-editor");
		var content = editor.util.makeContent($theEditor.html());
		$theEditor.html(content);

		//
		// Callback (if any)
		//
		callback();
	};

	/**
	 *
	 * Take control of "navigational" keys.
	 * If we don't do that, using "up" and "down",
	 * for example, will make the caret jump from
	 * '[data-empty="false"]' to '[data-empty="false"]'
	 * nodes, ignoring '[data-empty="true"]' nodes.
	 *
	 * Empty nodes don't "catch focus", which makes
	 * for strange, hunge jumps if you have a lot
	 * of empty lines.
	 *
	 */
	editor.writer.focus = {
		//
		// The "up" key
		//
		"up": function(e) {
			//
			// Get a "contenteditable" target
			// (e.target is not reliable)
			//
			var target = editor.util.getTarget();
			if (!target) {
				return;
			}

			//
			// Are using the "up" key in
			// the editor?
			//
			var $target = $(target);
			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			//
			// Is there a "previous" node?
			//
			var $prev = $target.prev();
			if (!$prev.length) {
				return;
			}

			//
			// Is the "previous" node a
			// [data-empty="true"] type of node?
			//
			if ($prev.attr("data-empty") !== "true") {
				return;
			}

			//
			// Time to take control of the event.
			//
			e.preventDefault();

			//
			// Set caret at the beginning of
			// the empty node.
			//
			editor.util.focus($prev[0]);

		},

		//
		// The "down" key
		//
		"down": function(e) {
			//
			// Get a "contenteditable" target
			// (e.target is not reliable)
			//
			var target = editor.util.getTarget();
			if (!target) {
				return;
			}

			//
			// Are using the "down" key in
			// the editor?
			//
			var $target = $(target);
			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			//
			// Is there a "next" node?
			//
			var $next = $target.next();
			if (!$next.length) {
				return;
			}

			//
			// Is the "next" node a
			// [data-empty="true"] type of node?
			//
			if ($next.attr("data-empty") !== "true") {
				return;
			}

			//
			// Time to take control of the event.
			//
			e.preventDefault();

			//
			// Set caret at the beginning of
			// the empty node.
			//
			editor.util.focus($next[0]);
		},

		//
		// The "left" key
		//
		"left": function(e) {
			//
			// Get a "contenteditable" target
			// (e.target is not reliable)
			//
			var target = editor.util.getTarget();
			if (!target) {
				return;
			}

			//
			// Are using the "left" key in
			// the editor?
			//
			var $target = $(target);
			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			//
			// If the caret is currently located
			// in a [data-empty="true"] node, we know 
			// for sure that hitting left will move the 
			// caret to the previous node. 
			//
			// So, we have to check if we're not in an
			// empty node, and check the offset of the caret.
			// If the offset is not 0, we don't do anything.
			//
			if ($target.attr("data-empty") !== "true") {
				var sel = window.getSelection();
				//
				// We only want to consider the offset of
				// the *first* text node of the node. 
				//
				// !!! The offset may be 0 if we're in 
				// a conversation <span>. But that doesn't
				// mean that we want to move to the previous
				// node. 
				//
				if (editor.util.firstTextNode(target) !== sel.focusNode) {
					return;
				}

				//
				// Offset not 0, we don't move.
				//
				if (sel.focusOffset !== 0) {
					return;
				}
			}

			//
			// Is there a "previous" node?
			//
			var $prev = $target.prev();
			if (!$prev.length) {
				return;
			}

			//
			// Is the "previous" node a
			// [data-empty="true"] type of node?
			//
			if ($prev.attr("data-empty") !== "true") {
				return;
			}

			//
			// Time to take control of the event.
			//
			e.preventDefault();

			//
			// Set caret at the beginning of
			// the empty node.
			//
			editor.util.focus($prev[0]);
		},

		//
		// The "right" key
		//
		"right": function(e) {
			//
			// Get a "contenteditable" target
			// (e.target is not reliable)
			//
			var target = editor.util.getTarget();
			if (!target) {
				return;
			}

			//
			// Are using the "right" key in
			// the editor?
			//
			var $target = $(target);
			if (!$target.closest(".feuilles-editor").length) {
				return;
			}

			//
			// If the caret is currently located
			// in a [data-empty="true"] node, we know 
			// for sure that hitting right will move the 
			// caret to the next node. 
			//
			// So, we have to check if we're not in an
			// empty node, and check the offset of the caret.
			// If the offset is not at the end of the last node, 
			// we don't do anything.
			//
			if ($target.attr("data-empty") !== "true") {
				var sel = window.getSelection();
				var lastTextNode = editor.util.lastTextNode(target);

				//
				// Caret is not located in the last text node.
				//
				if (lastTextNode !== sel.focusNode) {
					return;
				}

				//
				// Caret is not located at the end
				// of the last text node.
				//
				if (sel.focusOffset !== lastTextNode.length) {
					return;
				}
			}

			//
			// Is there a "next" node?
			//
			var $next = $target.next();
			if (!$next.length) {
				return;
			}

			//
			// Is the "next" node a
			// [data-empty="true"] type of node?
			//
			if ($next.attr("data-empty") !== "true") {
				return;
			}

			//
			// Time to take control of the event.
			//
			e.preventDefault();

			//
			// Set caret at the beginning of
			// the empty node.
			//
			editor.util.focus($next[0]);
		},
	};

	/**
	 *
	 * Handle key events
	 *
	 */
	editor.writer.on = {};

	/**
	 *
	 * Handle the "enter" key
	 *
	 */
	editor.writer.on.enter = function(e) {
		//
		// Prevent line jumps in "inline"
		// contenteditables.
		//
		$target = $(e.target);
		if ($target.attr("data-feuilles-write") === "inline") {
			e.preventDefault();
			return false;
		}

		//
		// Handle line jumps in "multiline"
		// contenteditables.
		//
		if ($target.attr("data-feuilles-write") === "multiline") {
			e.preventDefault();

			//
			// Get a "node" instance. Either
			// the caret is already in a node, or
			// we get the closest instace.
			//
			var sel = window.getSelection();
			var $node = $(sel.focusNode);
			if (!$node.attr("data-token")) {
				$node = $node.closest('[data-editor="token"]');
			}
			var node = $node[0];

			//
			// We're about to create a new node.
			// We first split the current node
			// at caret position.
			//
			var pieces = editor.util.contentToPieces(node);

			//
			// This the part that stays in the current node.
			//
			pieces[0] = editor.util.noBr(pieces[0]);

			//
			// This is the part that is injected into
			// the new node.
			//
			pieces[1] = editor.util.noBr(pieces[1]);

			//
			// Check if the current node (the one
			// where the caret was located when the
			// user hit "enter") is empty.
			//
			var isEmpty;
			if ($.trim(editor.util.noBr(pieces[0])) === "") {
				isEmpty = true;
			}

			//
			// If the current node (the one holding pieces[0]) 
			// is empty, mark it as such.
			//
			if (isEmpty) {
				$node.attr("data-empty", "true");
				$node.html("");
			}

			// Update current node before moving to
			// the next one.
			//
			if (!isEmpty) {
				$node.html(pieces[0]);
			}

			//
			// Create the new node
			//
			var $newEl = $('<div data-editor="token" data-token="p" data-empty="false">' + pieces[1] + '</div>');

			//
			// Into the DOM
			//
			$node.after($newEl);

			//
			// Remove <br>s
			//
			$newEl.html(editor.util.noBr($newEl.html()));

			//
			// Set focus
			//
			editor.util.focus($newEl[0]);
		}
	};

	/**
	 *
	 * Handle the "backspace" key
	 *
	 */
	editor.writer.on.backspace = function(e) {
		//
		// We only want to intervene in
		// "multiline" contenteditables.
		//
		$target = $(e.target);
		if ($target.attr("data-feuilles-write") !== "multiline") {
			return;
		}

		//
		// Get a "node" instance. Either
		// the caret is already in a node, or
		// we get the closest instace.
		//
		var sel = window.getSelection();
		$node = $(sel.focusNode);
		if (!$node.attr("data-token")) {
			$node = $node.closest('[data-editor="token"]');
		}
		var node = $node[0];

		//
		// We only want to work in specific nodes
		//
		if (!$node.attr("data-token")) {
			return;
		}

		//
		// Get variables that will help us make
		// the right decision
		//
		var nodeContent = editor.util.noBr($node.html());

		var firstTextNode = editor.util.firstTextNode(node);
		if (!firstTextNode &&  nodeContent === "") {
			firstTextNode = sel.focusNode;
		} 

		//
		// First node scenario
		//
		if ($node.is(":first-child")) {
			//
			// Last node is already empty.
			// Do nothing.
			//
			if ($node.html() === "") {
				e.preventDefault();
				return;
			}

			//
			// Check if last node is being emptied
			//
			var deleteNode = (firstTextNode === sel.focusNode && sel.focusOffset <= 1);
			if (!deleteNode) {
				return;
			}
			e.preventDefault();
			if (sel.focusOffset === 1) {
				nodeContent = nodeContent.substr(1);
			}
			$node.html(nodeContent);
			return;
		}

		//
		// Get the "previous" node?
		//
		var $prev = $node.prev();
		if (!$prev.length) {
			return;
		}

		//
		// Is the "previous" node a
		// [data-empty="true"] type of node?
		// If the node doesn't have a data-empty
		// attribute set to true, the browser
		// will set the focus correctly. Otherwise
		// we have to provide some help.
		//
		if ($prev.attr("data-empty") !== "true") {
			return;
		}

		var nodeContent = editor.util.noBr($node.html());

		var firstTextNode = editor.util.firstTextNode(node);
		if (!firstTextNode &&  nodeContent === "") {
			firstTextNode = sel.focusNode;
		} 

		var deleteNode = (firstTextNode === sel.focusNode && sel.focusOffset <= 1);
		if (!deleteNode) {
			return;
		}

		e.preventDefault();

		//
		// Stay in the same node
		//
		if (sel.focusOffset === 1) {
			nodeContent = nodeContent.substr(1);
			$node.html(nodeContent);
			return;
		}

		//
		// Move to previous node
		//
		$prev.html(nodeContent);
		$prev.attr("data-empty", "false");
		$node.remove();
		editor.util.focus($prev[0]);

	};

}).call(this);