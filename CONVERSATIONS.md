# Conversations

In Feuilles, conversations are embedded directly in documents. A raw Feuilles document containing conversations may look like this:

	Hello, I am {ref for=$id}some text{/ref}.
	
	And I am some more text.

	{conversation id="$id"}
 	[
		{
        		"reference": "some text",
        		"author": "alexduloz",
        		"date": "5-June-2014 15:14:30",
        		"content": "Woah, awesome"
    		},
		{
        		"reference": "some text",
        		"author": "alexduloz",
        		"date": "5-June-2014 15:14:30",
        		"content": "Yeah, definitely awesome"
    		},
	]
	{/conversation}

## Ref

A “ref” is a portion of text being commented. It is delimited by the following “tags” `{ref for=$id}some text{/ref}`, where `$id` helps put together a ref and its related conversation.


## Conversation

A “conversation” is a stream of comments taking the form of an array. It is delimited by the following “tags” `{conversation id="$id"}{/conversation}`, where `$id` helps put together a ref and its related conversation.

Each comment takes the form of an object made of four properties:

* `reference`: the state of the `ref` when the comment is added (a `ref` may change from version to another, and keeping track of references helps creating meaningful conversations).
* `author`: The username of the comment owner.
* `date`: A date formatted like this `5-June-2014 15:14:30`.
* `content`: The actual comment.

## `$id`

“Refs” and “Convs” are bound by a common `id`. This `id` usually takes the following form: `username + time`, as in `alexduloz 5-June-2014 15:14:30`.

## Why embedding conversations?

Because you don't need fancy Javascript–read “editor”–to add comments to a text. You can also easily add conversations to your documents if you're working with our API.

## The server side

When our server receives a document, it parses the conversations contained in it (if any) and stores them in a dedicated table. The fact that conversations are parsed with every doc update means that you have to be careful with the way you create your `$id`s: if you're adding comments manually, a simple typo/modification may lead the server into thinking that a previous conversation has been deleted and that a new one has been created.

