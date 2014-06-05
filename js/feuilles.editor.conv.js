//
// Embedded conversations, how they look like:
//
/*
Hello, I am a text and this is cool. {ref for=alexduloz}I am some ref{/ref}.
	
	{conversation id=12345}
	[
		{
			"author": "alexduloz",
			"date": "21-12-2014 08:00",
			"content": "Hello, I'm a comment"
		},
		{
			"author": "bli",
			"date": "21-12-2014 08:00",
			"content": "Hey, I'm a reply"
		}
	]
	{/conversation}
	
And later, there can be {ref for=67890}another ref{/ref}.
	
	{conversation id=67890}
	[
		{
			"author": "alexduloz",
			"date": "21-12-2014 08:00",
			"content": "Hello, I'm a comment"
		},
		{
			"author": "bli",
			"date": "21-12-2014 08:00",
			"content": "Hey, I'm a reply"
		}
	]
	{/conversation}

*/

(function() {

	var self = editor.conv = {};

	/**
	 *
	 * Private var to store the current
	 * conversation
	 */
	editor.conv._conversationReadableId = null;

	/**
	 *
	 * Init
	 *
	 */
	editor.conv.init = function(callback) {

		//
		// Close conversation pane
		//
		kDown.whenShortcut("alt+esc", function(e) {
			editor.conv.close();
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
		// Conversation prompt: don't delete
		//
		$("body").on("click", ".delete-conv-nope", function(e) {
			self.removeNope();
		});

		//
		// Conversation prompt: delete
		//
		$("body").on("click", ".delete-conv-yep", function(e) {
			self.removeYep();
		});

		$("body").on("click", ".conversation-all-ref", function(e) {
			e.preventDefault();
			var readableId = $(this).attr("data-related-ref");
			editor.conv.loadConversation(readableId);
			return false;
		});

		/**
		 *
		 * Toggle conversations
		 *
		 */
		$("body").on("click", "#toggle-conversation", function(e) {
			e.preventDefault();
			editor.conv.toggleConversation();
			return false;
		});

		kDown.whenShortcut("alt+cmd", function(e) {
			e.preventDefault();
			editor.conv.toggleConversation();
			return false;
		});

		$("body").on("click", ".btn-start-conversation", function(e) {
			editor.conv.startConversation(e)
		});

		$("body").on("submit", '[name="converse"]', function(e) {
			editor.conv.addConversationItem(e);
		});

		$("body").on("click", ".show-conversations-pane .conversation-highlight", function(e) {
			e.preventDefault();
			var conversationReadableId = $(this).attr("data-ref-for");
			editor.conv.loadConversation(conversationReadableId);
			return false;
		});

		$("body").on("click", ".hide-conversations-pane button", function(e) {

			e.preventDefault();
			
			editor.conv.close(e);
			
			/*
			$(".conversations").hide();
			$("body").removeClass("show-conversations-pane");

			$(".writer-col").removeClass("col-md-8");
			$(".conversations-col").removeClass("col-md-4");

			$(".conversation-highlighted").removeClass("conversation-highlighted");
			*/

			return false;
		});

		callback();
	};

	editor.conv.startConversation = function() {
		var sel = window.getSelection();

		if (sel.isCollapsed) {
			notify("Select some text to start a conversation");
			return;
		}

		var target = editor.util.getTarget();

		if ($(target).attr("data-ref-for")) {
			notify("The text you highlighted is already part of a conversation");
			return;
		}

		var nodes = editor.util.getSelectedNodes();

		if (nodes) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].nodeType !== 3) {
					notify("Crossing paragraphs is not possible (yet)");
					return;
				}
			};
		}

		$body = $("body");

		$body.addClass("show-conversations-highlights");
		$body.addClass("show-conversations-pane");

		$(".delete-conv-container").show();
		$(".conversation-reference").show();
		$(".conversation-input").show();
		$(".conversation-empty").hide();

		var reference = sel.toString();
		if (sel.rangeCount) {
			var range = sel.getRangeAt(0).cloneRange();
			var div = document.createElement("div");
			var span = document.createElement("span");

			//
			// Surround our ref
			//
			div.setAttribute("class", "embedded-conversation");
			div.style.display = "none";

			span.setAttribute("class", "conversation-highlight");

			//
			// Show conversation pane
			//
			$conversation = $(".conversations");

			$conversation.css("min-height", $(".feuilles-editor-container").height() + "px");

			$conversation.fadeIn();
			$(".writer-col").addClass("col-md-8");
			$(".conversations-col").addClass("col-md-4");

			$(".conversation-items").html("");
			$(".conversation-none").show();

			//
			// In conversation pane: add ref and focus on the textarea
			//
			setTimeout(function() {
				sel.removeAllRanges();
				$("#say_it").focus();
				$("#conversation-reference").text(reference);
			}, 1);

			//
			// Create a new conversation
			//
			$(".conversation-highlighted").removeClass("conversation-highlighted");

			conversationReadableId = user.username + " " + editor.util.moment();

			span.setAttribute("data-ref-for", conversationReadableId);
			div.setAttribute("data-conversation-id", conversationReadableId);
			$(span).addClass("conversation-highlighted");
			editor.save();

			editor.conv._conversationReadableId = conversationReadableId;

			/*
			post(urls.api.conversation.create, data, function(err, res) {
				if (!err) {
					conversationReadableId = res.conversation_readable_id;
					span.setAttribute("data-ref-for", res.conversation_readable_id);
					div.setAttribute("data-conversation-id", res.conversation_readable_id);
					$(span).addClass("conversation-highlighted");
					save.doc();
				}
			});

			*/

			range.surroundContents(span);

			$("#the-editor").append(div);

			sel.removeAllRanges();
			sel.addRange(range);
		}
	}

	/**
	 *
	 * Close conversation pane
	 *
	 */
	editor.conv.close = function(e) {
		$conversation = $(".conversations");

		if ($conversation.length) {
			if ($conversation.is(":visible")) {
				e.preventDefault();
				$conversation.hide();
				$("body").removeClass("show-conversations-highlights");
				$("body").removeClass("show-conversations-pane");
				$(".writer-col").removeClass("col-md-8");
				$(".conversations-col").removeClass("col-md-4");
				return false;
			}
		}
	};

	/**
	 *
	 * Don't delete a conv
	 *
	 */
	editor.conv.removeNope = function() {
		$('.editor-modal').modal("hide");
		editor.conv._$deleteNode = null;
	};

	/**
	 *
	 * Delete a conv
	 *
	 */
	editor.conv.removeYep = function() {
		$('.editor-modal').modal("hide");

		$deleteNode = self._$deleteNode;

		var convId = $deleteNode.attr("data-ref-for");

		$deleteNode.before($deleteNode.text()).remove();

		$('[data-conversation-id="' + convId + '"]').remove();

		self.loadAllConversations();

		editor.save();
	};

	/**
	 *
	 * Remove a conversation from the document
	 * @see editor.conv.init for the prompts
	 *
	 */
	editor.conv._$deleteNode = null;
	editor.conv.remove = {
		viaShortcut: function(e) {
			var sel = window.getSelection();

			$deleteNode = $(sel.focusNode).closest(".conversation-highlight");

			if (!$deleteNode.length) {
				return;
			}
			e.preventDefault();

			self._$deleteNode = $deleteNode;

			editor.conv.remove.prompt();

		},
		viaClick: function(e) {
			e.preventDefault();

			$deleteNode = $('[data-ref-for="' + conversationReadableId + '"]');

			self._$deleteNode = $deleteNode;

			editor.conv.remove.prompt();
		},
		prompt: function() {
			var sure = $("#sure").html();
			$('.editor-modal .modal-content').html(sure);
			$('.editor-modal').modal("show");
		}
	};

	/**
	 *
	 * Load a specific conversation
	 * in the conversation pane
	 *
	 */
	editor.conv.loadConversation = function(readable_id) {

		var $container = $(".conversation-items");

		$container.html("");

		$(".conversing-about").hide();

		$(".conversation-empty").hide();

		$("body").addClass("show-conversations-pane");

		$(".delete-conv-container").show();

		$(".writer-col").addClass("col-md-8");
		$(".conversations-col").addClass("col-md-4");

		$(".conversation-reference").show();
		$(".conversation-input").show();

		$conversation = $(".conversations");

		$conversation.css("min-height", $(".feuilles-editor-container").height() + "px");

		$conversation.show();

		conversationReadableId = readable_id;

		$(".conversation-highlighted").removeClass("conversation-highlighted");

		$('[data-ref-for="' + readable_id + '"]').addClass("conversation-highlighted");

		//
		// Things are embedded
		//
		var ok = true;
		try {
			var conv = JSON.parse($.trim($('[data-conversation-id="' + conversationReadableId + '"]').text()));
		} catch (e) {
			ok = false;
		}

		var template = $("#conversation-template").html();

		var reference = $('[data-ref-for="' + readable_id + '"]').text();
		$("#conversation-reference").text(reference);

		var div = document.createElement("div");
		div.innerHTML = template;
		var $div = $(div);

		if (ok) {
			$(".conversation-none").hide();
			for (var i = 0; i < conv.length; i++) {
				$div.find(".conversation-new-reference").text(conv[i].reference);
				if (conv[i].reference_modified === true) {
					$div.find(".conversation-new-reference").show();
				} else {
					$div.find(".conversation-new-reference").hide;
				}
				$div.find(".conversation-username").text(conv[i].author);
				$div.find(".conversation-content").text(conv[i].content);
				$div.find(".conversation-nicedate").text(conv[i].date);

				$container.append($div.html());
			};
		}

		if (!ok) {
			$(".conversation-none").show();
		}
	};

	/**
	 *
	 * Load a list of all the conversations
	 *
	 */
	editor.conv.loadAllConversations = function() {

		var $container = $(".conversation-items");

		$container.html("");

		$(".conversing-about").show();
		$(".conversation-empty").hide();

		$(".delete-conv-container").hide();

		$(".conversation-none").hide();

		$(".writer-col").addClass("col-md-8");
		$(".conversations-col").addClass("col-md-4");

		$(".conversation-reference").hide();
		$(".conversation-input").hide();

		$conversation = $(".conversations");

		$conversation.show();

		var template = $("#conversation-all-template").html();

		var div = document.createElement("div");
		div.innerHTML = template;
		var $div = $(div);

		var $container = $(".conversation-items");

		$conversation.css("min-height", $(".feuilles-editor-container").height() + "px");

		$highlights = $(".conversation-highlight");

		if (!$highlights.length) {
			$(".conversation-empty").show();
			$(".conversation-reference").hide();
			$(".conversation-input").hide();
			$(".delete-conv-container").hide();

			return;
		}

		$(".conversation-highlight").each(function() {
			$this = $(this);

			var ref = $this.text();

			$ref = $div.find(".conversation-all-ref");
			$ref.text(ref);
			$ref.attr("data-related-ref", $this.attr("data-ref-for"));

			$container.append($div.html());
		});
	};

	/**
	 *
	 * Show/Hide conversation pane
	 *
	 */
	editor.conv.toggleConversation = function() {
		$conversation = $(".conversations");

		if ($conversation.is(":visible")) {

			$(".writer-col").removeClass("col-md-8");
			$(".conversations-col").removeClass("col-md-4");

			$conversation.hide();
			$("body").removeClass("show-conversations-highlights");
			$("body").removeClass("show-conversations-pane");

			$(".conversation-highlighted").removeClass("conversation-highlighted");

			return;
		}

		//
		// We're going to open the conversation pane
		// We can either fill it with a specific conversation or
		// with *all* the conversations.
		//

		$("body").addClass("show-conversations-highlights");
		$("body").addClass("show-conversations-pane");

		var sel = window.getSelection();
		$highlight = $(sel.focusNode).closest(".conversation-highlight");

		//
		// Load a specific conversation
		//
		if ($highlight.length) {
			var readableId = $highlight.attr("data-ref-for");
			self.loadConversation(readableId);
		}

		//
		// Load a list of all conversations
		//
		if (!$highlight.length) {
			self.loadAllConversations();
		}

	};


	/**
	 *
	 * Add an item to a conversation
	 *
	 */
	editor.conv.addConversationItem = function(e) {

		e.preventDefault();

		conversationReadableId = editor.conv._conversationReadableId;

		if (!conversationReadableId) {
			notify("No conversation selected");
			return;
		}

		var content = $("#say_it").val();

		if (!content) {
			notify("Say something");
			return;
		}

		var reference = $('[data-ref-for="' + conversationReadableId + '"]').text();
		$("#conversation-reference").text(reference);

		//
		// Get the content of the embedded conv and update it
		//
		var currentConv = $('[data-conversation-id="' + conversationReadableId + '"]').text();

		$(".conversation-none").hide();

		var template = $("#conversation-template").html();

		var reference = $('[data-ref-for="' + conversationReadableId + '"]').text();
		$("#conversation-reference").text(reference);

		var div = document.createElement("div");
		div.innerHTML = template;
		var $div = $(div);

		var moment = editor.util.moment();

		var $container = $(".conversation-items");

		$div.find(".conversation-new-reference").text(reference);

		$div.find(".conversation-username").text(user.username);
		$div.find(".conversation-content").text(content);
		$div.find(".conversation-nicedate").text(moment);
		$container.prepend($div.html());

		$("#say_it").val("");

		if ($.trim(currentConv) === "") {
			var theConv = [{
				"reference": reference,
				"author": user.username,
				"date": moment,
				"content": content
			}];
			theConv = JSON.stringify(theConv, null, 4);
			$('[data-conversation-id="' + conversationReadableId + '"]').text(theConv);
		} else {
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

		editor.save();

		/*
		var data = {
			conversation_readable_id: conversationReadableId,
			sha: $('[data-name="sha"]').attr("data-value"),
			content: $("#say_it").val(),
			reference: reference
		}

		post(urls.api.conversation.item.create, data, function(err, res) {

			if (!err) {

				$(".conversation-none").hide();

				$("#say_it").val("");

				var template = $("#conversation-template").html();

				var reference = $('[data-ref-for="' + conversationReadableId + '"]').text();
				$("#conversation-reference").text(reference);

				var div = document.createElement("div");
				div.innerHTML = template;
				var $div = $(div);

				var $container = $(".conversation-items");

				$div.find(".conversation-new-reference").text(res.conversation.reference);

				$div.find(".conversation-username").text(res.conversation.username);
				$div.find(".conversation-content").text(res.conversation.content);
				$div.find(".conversation-nicedate").text(res.conversation.nicedate);
				$container.prepend($div.html());

				if ($.trim(currentConv) === "") {
					var theConv = [{
						"id": res.conversation.id,
						"reference": reference,
						"author": res.conversation.username,
						"date": res.conversation.nicedate,
						"content": res.conversation.content
					}];
					theConv = JSON.stringify(theConv, null, 4);
					$('[data-conversation-id="' + conversationReadableId + '"]').text(theConv);
				} else {
					var theConv = JSON.parse(currentConv);
					theConv.push({
						"id": res.conversation.id,
						"reference": reference,
						"author": res.conversation.username,
						"date": res.conversation.nicedate,
						"content": res.conversation.content
					});
					theConv = JSON.stringify(theConv, null, 4);
					$('[data-conversation-id="' + conversationReadableId + '"]').text(theConv);
				}

				save.doc();

			}
		});
		*/

		return false;

	};



}).call(this)