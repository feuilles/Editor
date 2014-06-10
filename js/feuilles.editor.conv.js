/*!
 * FeuillesEditor (https://github.com/feuilles/Editor)
 * Copyright 2014 Alex Duloz
 * Licensed under MIT (https://github.com/feuilles/Editor/blob/gh-pages/LICENSE)
 */

//
// Example of an embedded conversation
//
/*
Hello, I am a text and this is cool. {ref for=alexduloz 22-June-2014 17:08:46}I am some ref{/ref}.
	
	{conversation id=alexduloz 22-June-2014 17:08:46}
	[
		{
			"reference": "I am some ref",
			"author": "alexduloz",
			"date": "21-12-2014 08:00:00",
			"content": "Hello, I'm a comment"
		},
		{
			"reference": "I am some ref",
			"author": "alexduloz",
			"date": "21-12-2014 08:05:32",
			"content": "Hey, I'm a reply"
		}
	]
	{/conversation}
*/

(function() {

	//
	// DOM Elements
	//
	var $body,
		$deleteConvContainer,
		$conversationRef,
		$conversationInput,
		$conversationEmpty,
		$conversation,
		$writerCol,
		$conversationCol,
		$conversationItems,
		$conversationNone,
		$sayIt,
		$theEditor,
		$sure,
		$template,
		$conversationTitle;


	/**
	 *
	 * Private var to store the current
	 * conversation (the one that is being
	 * highlighted).
	 */
	var conversationReadableId = null;

	/**
	 *
	 * The conversation node to delete
	 *
	 */
	var $deleteNode = null;

	/**
	 *
	 * The HTML of the template.
	 * (No need for a templating plugin.)
	 *
	 */
	var templateHTML = null;

	var self = editor.conv = {};

	/**
	 *
	 * Init
	 *
	 */
	editor.conv.init = function(callback) {

		$body = $("body");
		$deleteConvContainer = $(".delete-conv-container");
		$conversationRef = $(".conversation-reference");
		$conversationInput = $(".conversation-input");
		$conversationEmpty = $(".conversation-empty");
		$conversation = $(".conversations");
		$writerCol = $(".writer-col");
		$conversationCol = $(".conversations-col");
		$conversationItems = $(".conversation-items");
		$conversationNone = $(".conversation-none");
		$sayIt = $("#say_it");
		$theEditor = $("#the-editor");
		$sure = $("#sure");
		$template = $("#conversation-template");
		templateHTML = $template.html();
		$conversationTitle = $(".conversation-title");


		//
		// Close conversation pane
		//
		kDown.whenShortcut("alt+esc", function(e) {
			editor.conv.hide();
		});

		//
		// Remove conversation: the shortcut way
		//
		kDown.whenShortcut("cmd+esc", function(e) {
			editor.conv.remove.viaShortcut(e);
		});

		//
		// Remove conversation: the click way
		//
		$("body").on("click", ".btn-delete-conversation", function(e) {
			editor.conv.remove.viaClick(e);
		});

		//
		// Conversation prompt: delete -> nope
		//
		$("body").on("click", ".delete-conv-nope", function(e) {
			self.removeNope();
		});

		//
		// Conversation prompt: delete -> yep
		//
		$("body").on("click", ".delete-conv-yep", function(e) {
			self.removeYep();
		});

		//
		// When no conversation is highlighted and you
		// open the conv pane, there is a list of all the
		// active conversations. This is what happens when you
		// click on an item of that list.
		//
		$("body").on("click", ".conversation-all-ref", function(e) {
			e.preventDefault();
			conversationReadableId = $(this).attr("data-related-ref");
			editor.conv.loadOne();
			return false;
		});

		//
		// Show/Hide conversation pane -> click
		//
		$("body").on("click", "#toggle-conversation", function(e) {
			e.preventDefault();
			editor.conv.toggleConversation();
			return false;
		});

		//
		// Show/Hide conversation pane -> kbd
		//
		kDown.whenShortcut("alt+cmd", function(e) {
			e.preventDefault();
			editor.conv.toggleConversation();
			return false;
		});

		//
		// The "converse" icon
		//
		$("body").on("click", ".btn-start-conversation", function(e) {
			editor.conv.start(e)
		});

		//
		// Submitting a new comment
		//
		$("body").on("submit", '[name="converse"]', function(e) {
			editor.conv.addItem(e);
		});

		//
		// In the body of the text, when the conversation pane is open, 
		// you can see all the conversations that are active. That's what
		// happen when you click on a conversation.
		//
		$("body").on("click", ".show-conversations .conversation-highlight", function(e) {
			e.preventDefault();
			conversationReadableId = $(this).attr("data-ref-for");
			editor.conv.loadOne();
			return false;
		});

		//
		// The little cross to close the conversation pane
		//
		$("body").on("click", ".hide-conversations-pane button", function(e) {
			e.preventDefault();
			editor.conv.hide();
			return false;
		});

		callback();
	};

	/**
	 *
	 * Show conversation pane
	 *
	 */
	editor.conv.show = function(args) {
		//
		// Show/Hide elements
		//
		$body.addClass("show-conversations");
		$conversation.hide().css("min-height", $(".feuilles-editor-container").height() + "px");
		$conversation.show();
		$writerCol.addClass("col-md-8"); // class from Twitter Bootstrap
		$conversationCol.addClass("col-md-4"); // class from Twitter Bootstrap

		if (args) {
			if (args.ref) {
				$deleteConvContainer.show();
				$conversationRef.show();
				$conversationInput.show();
				$conversationEmpty.hide();
				//
				// In conversation pane: add ref and focus on the textarea
				//
				setTimeout(function() {
					$sayIt.focus();
					$("#conversation-reference").text(args.ref);
				}, 1);
			}
			if (args.isNew) {
				$conversationItems.html("");
				$conversationNone.show();
			}
		}
	};

	/**
	 *
	 * Hide conversation pane
	 *
	 */
	editor.conv.hide = function() {
		$conversation.hide();
		$body.removeClass("show-conversations");
		$writerCol.removeClass("col-md-8");
		$conversationsCol.removeClass("col-md-4");
	};

	/**
	 *
	 * Starting a new conversation
	 *
	 */
	editor.conv.start = function() {
		//
		// Get selection
		//
		var sel = window.getSelection();

		//
		// No text selected
		//
		if (sel.isCollapsed) {
			notify("Select some text to start a conversation");
			return;
		}

		//
		// e.target is not reliable in
		// contenteditable environments
		//
		var target = editor.util.getTarget();

		//
		// Selected text is part of a conversation node
		//
		if ($(target).attr("data-ref-for")) {
			notify("The text you highlighted is already part of a conversation");
			return;
		}

		//
		// Selected text contains nodes that are not
		// that are not text nodes. Probably a cross-p
		// issue. Could also be a cross-span problem.
		//
		var nodes = editor.util.getSelectedNodes();
		if (nodes) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].nodeType !== 3) {
					notify("Crossing paragraphs is not possible (yet)");
					return;
				}
			};
		}

		//
		// The piece of text to highlight
		//
		var reference = sel.toString();

		editor.conv.show({
			ref: reference,
			isNew: true,
		});

		//
		// Prepare to surround the text highighted
		// and create a conversation object (hidden
		// in a div).
		//
		var range = sel.getRangeAt(0).cloneRange();
		var div = document.createElement("div");
		var span = document.createElement("span");
		div.setAttribute("class", "embedded-conversation");
		div.style.display = "none";
		span.setAttribute("class", "conversation-highlight");

		//
		// Create a new conversation,
		// so clean previous highlight
		//
		$(".conversation-highlighted").removeClass("conversation-highlighted");

		//
		// Store the conversation ID
		//
		conversationReadableId = user.username + " " + editor.util.moment();

		//
		// Highlight the new conv and
		// create the conv container
		//
		span.setAttribute("data-ref-for", conversationReadableId);
		div.setAttribute("data-conversation-id", conversationReadableId);
		$(span).addClass("conversation-highlighted");

		//
		// Highlight
		//
		range.surroundContents(span);
		$theEditor.append(div);

		sel.removeAllRanges();
		sel.addRange(range);

		//
		// Save the document
		//
		editor.save();
	}

	/**
	 *
	 * Remove a conversation from the document
	 *
	 */
	editor.conv.remove = {};

	/**
	 *
	 * Remove a conversation via
	 * the kbd
	 * @see editor.conv.init for the kDown shortcut
	 *
	 */
	editor.conv.remove.viaShortcut = function(e) {
		e.preventDefault();
		var sel = window.getSelection();

		//
		// Get the conv node to delete.
		//
		$deleteNode = $(sel.focusNode).closest(".conversation-highlight");

		//
		// Shortcut performed when caret was not
		// in a conv node: exit.
		//
		if (!$deleteNode.length) {
			return;
		}

		//
		// Prompt to confirm deletion
		//
		editor.conv.remove.prompt();

	};

	/**
	 *
	 * Remove a conversation via
	 * the click event
	 * @see editor.conv.init for the event
	 *
	 */
	editor.conv.remove.viaClick = function(e) {
		e.preventDefault();

		//
		// Get the conv node to delete.
		// If user can see the "delete" icon,
		// it means a conversation is selected,
		// which means that conversation id is
		// available in the global space.
		// @see editor.conv.init for the click
		// event that stores the conv id.
		//
		$deleteNode = $('[data-ref-for="' + conversationReadableId + '"]');
		if (!$deleteNode.length) {
			return;
		}

		//
		// Prompt to confirm deletion
		//
		editor.conv.remove.prompt();
	};

	/**
	 *
	 * Ask the user to confirm deletion
	 * @see editor.conv.init for the prompts
	 *
	 */
	editor.conv.remove.prompt = function() {
		var sure = $sure.html();
		$('.editor-modal .modal-content').html(sure);
		$('.editor-modal').modal("show");
	};

	/**
	 *
	 * Don't delete a conv
	 *
	 */
	editor.conv.removeNope = function() {
		$('.editor-modal').modal("hide");
	};

	/**
	 *
	 * __Do__ delete a conv
	 *
	 * The variable holding the node
	 * to delete is available in the global
	 * space.
	 *
	 * @see editor.conv.remove to see how we
	 * store that variable.
	 *
	 */
	editor.conv.removeYep = function() {
		$('.editor-modal').modal("hide");

		//
		// Get the conv id
		//
		var convId = $deleteNode.attr("data-ref-for");

		//
		// Get the ref, and inject it before the node.
		//
		$deleteNode.before($deleteNode.text()).remove();

		//
		// Delete the node.
		//
		$('[data-conversation-id="' + convId + '"]').remove();

		//
		// Since we're no longer focusing on one
		// specific conversation, we load *all* the
		// active conversations.
		//
		self.loadAll();

		//
		// Doc has been modified. Save.
		//
		editor.save();
	};

	/**
	 *
	 * Load a specific conversation
	 * in the conversation pane
	 *
	 */
	editor.conv.loadOne = function() {
		//
		// The id of the conversation should
		// be available in the global scope
		//
		if (!conversationReadableId) {
			return;
		}

		//
		// Get the reference
		//
		var reference = $('[data-ref-for="' + conversationReadableId + '"]').text();

		//
		// Show the conversation pane
		//
		editor.conv.show({
			ref: reference,
			isNew: false,
		});

		$conversationItems.html("");

		$(".conversation-highlighted").removeClass("conversation-highlighted");
		$('[data-ref-for="' + conversationReadableId + '"]').addClass("conversation-highlighted");

		//
		// Things are embedded
		//
		var ok = true;
		try {
			var conv = JSON.parse($.trim($('[data-conversation-id="' + conversationReadableId + '"]').text()));
		} catch (e) {
			ok = false;
		}

		console.log(conv);

		$("#conversation-reference").text(reference);

		var div = document.createElement("div");
		div.innerHTML = templateHTML;
		var $div = $(div);

		if (ok) {
			$conversationNone.hide();
			for (var i = 0; i < conv.length; i++) {
				$div.find(".conversation-new-reference").text(conv[i].reference);
				if (conv[i].reference !== reference) {
					$div.find(".conversation-new-reference").show();
				} else {
					$div.find(".conversation-new-reference").hide;
				}
				$div.find(".conversation-username").text(conv[i].author);
				$div.find(".conversation-content").text(conv[i].content);
				$div.find(".conversation-nicedate").text(conv[i].date);

				$conversationItems.append($div.html());
			};
		}

		if (!ok) {
			$conversationNone.show();
		}
	};

	/**
	 *
	 * Load a list of all the active
	 * conversations embedded in the document.
	 *
	 */
	editor.conv.loadAll = function() {
		//
		// All conv: handling the DOM 
		//
		$conversationItems.html("");
		$conversationTitle.show();
		$conversationEmpty.hide();
		$deleteConvContainer.hide();
		$conversationNone.hide();
		$writerCol.addClass("col-md-8");
		$conversationCol.addClass("col-md-4");
		$conversationRef.hide();
		$conversationInput.hide();
		$conversation.show();

		//
		// The HTML template for the loadAll pane
		//
		var template = $("#conversation-all-template").html();
		var div = document.createElement("div");
		div.innerHTML = template;
		var $template = $(div);

		//
		// Adjust height
		//
		$conversationItems.css("min-height", $(".feuilles-editor-container").height() + "px");

		//
		// Gather highlights
		//
		$highlights = $(".conversation-highlight");

		//
		// No active conversation yet
		//
		if (!$highlights.length) {
			$(".conversation-empty").show();
			$(".conversation-reference").hide();
			$(".conversation-input").hide();
			$(".delete-conv-container").hide();
			return;
		}

		//
		// List all the active conversations
		//
		$highlights.each(function() {
			$this = $(this);
			var ref = $this.text();
			$ref = $template.find(".conversation-all-ref");
			$ref.text(ref);
			$ref.attr("data-related-ref", $this.attr("data-ref-for"));
			$conversationItems.append($template.html());
		});
	};

	/**
	 *
	 * Show/Hide conversation pane
	 *
	 */
	editor.conv.toggleConversation = function() {
		//
		// Visible? Hide.
		//
		if ($conversation.is(":visible")) {
			$writerCol.removeClass("col-md-8");
			$conversationCol.removeClass("col-md-4");
			$conversation.hide();
			$body.removeClass("show-conversations");
			$(".conversation-highlighted").removeClass("conversation-highlighted");
			return;
		}

		//
		// We're going to open the conversation pane
		// We can either fill it with a specific conversation or
		// with *all* the conversations.
		//
		$body.addClass("show-conversations");

		//
		// Check if the caret is inside a
		// highlighted node.
		//
		var sel = window.getSelection();
		$highlight = $(sel.focusNode).closest(".conversation-highlight");

		//
		// Load a specific conversation
		//
		if ($highlight.length) {
			conversationReadableId = $highlight.attr("data-ref-for");
			self.loadOne();
		}

		//
		// Load a list of all conversations
		//
		if (!$highlight.length) {
			self.loadAll();
		}
	};


	/**
	 *
	 * Add an item to a conversation
	 *
	 */
	editor.conv.addItem = function(e) {
		e.preventDefault();

		if (!conversationReadableId) {
			notify("No conversation selected");
			return;
		}

		//
		// Get the submitted content
		//
		var content = $sayIt.val();
		if (!content) {
			notify("Say something");
			return;
		}

		//
		// Reset input value
		//
		$sayIt.val("");

		//
		// Get the ref
		//
		var reference = $('[data-ref-for="' + conversationReadableId + '"]').text();
		$("#conversation-reference").text(reference);

		//
		// Hide the "no conv" message
		//
		$conversationNone.hide();

		//
		// Get the HTML template 
		//
		var template = $("#conversation-template").html();
		var div = document.createElement("div");
		div.innerHTML = template;
		var $div = $(div);

		//
		// Our readable it.
		//
		var moment = editor.util.moment();

		//
		// Conversation item: populate
		//
		$div.find(".conversation-new-reference").text(reference);
		$div.find(".conversation-username").text(user.username);
		$div.find(".conversation-content").text(content);
		$div.find(".conversation-nicedate").text(moment);
		$conversationItems.prepend($div.html());

		//
		// Get the content of the embedded conv 
		// and update it (the JSON part)
		//
		var currentConv = $('[data-conversation-id="' + conversationReadableId + '"]').text();

		if ($.trim(currentConv) === "") {
			//
			// First item in the current conv
			//
			var theConv = [{
				"reference": reference,
				"author": user.username,
				"date": moment,
				"content": content
			}];
			theConv = JSON.stringify(theConv, null, 4);
			$('[data-conversation-id="' + conversationReadableId + '"]').text(theConv);
		} else {
			//
			// Add item to the current conv
			//
			var theConv = JSON.parse(currentConv);
			theConv.push({
				"reference": reference,
				"author": user.username,
				"date": moment,
				"content": content
			});
			theConv = JSON.stringify(theConv, null, 4);
			$('[data-conversation-id="' + conversationReadableId + '"]').text(theConv);
		}

		//
		// Update doc
		//
		editor.save();

		return false;
	};
}).call(this)