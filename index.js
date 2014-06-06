//
// The username in a "log in" env is set
// by the server. Here we just type it.
//
var user = {
	username: "alexduloz"
};

//
// A fake document. We're not using a db here.
// Mock documents are located in the "/mock" dir.
// Feel free to create mock documents that outline 
// specific problems.
//
var mockDoc = "one-line";

/**
 *
 * Init
 *
 */

//
// Create a mock document
// (That's done on the server, db etc.)
//
$.when(
	$.get("./documents/" + mockDoc + "/body.txt"),
	$.get("./documents/" + mockDoc + "/data.json"),
	$.get("./feuilles.editor.html")
).then(function(body, data, template) {
	//
	// Render (usually done on the server)
	//
	var template = template[0];
	var body = body[0];
	var view = {};
	view.doc = data[0];
	view.doc["content"] = body;

	var content = Mustache.render(template, view);

	//
	// Inject
	//
	$("#feuilles-editor").html(content);

	//
	// Show (useless swag)
	//
	$(".feuilles-editor-container").fadeIn();

	//
	// Env specific (based on routes), kind of bypass
	// by just showing the elements.
	//
	$('[data-route="/console/doc/write/id/:id"]').show();
	$(".btn-tooltip").tooltip();

	setTimeout(function() {
		editor.config.save("./requests/save.json");
		editor.init();
	}, 30);
});