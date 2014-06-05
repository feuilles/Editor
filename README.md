# feuilles.editor.js 

Here's the JS engine that powers [Feuilles](https://feuill.es)' editor. It's dirty. It's not refactored. But here it is. Brutally.


## A Note

You will find here a replica of our “write” page. The links and ajax requests that are not directly part of the editor have been disabled/removed. 

## If you want to contribute

The files that you need to worry about to improve the editor are:

* ./feuilles.editor.html 
* ./js/feuilles.editor.js 
* ./js/feuilles.editor.util.js 
* ./js/feuilles.editor.writer.js 
* ./js/feuilles.editor.conversations.js 
* ./css/feuilles.editor.css 

All the other files that are included in this repo are here to help you recreate our environment. No need to touch them, unless you want to.

If you want to add styles that won't make it to prod, put them in the following file: `/css/feuilles.ephemeral.css`. 

You can modify a few settings in `index.js`.

## How to launch the editor

Simply launch `index.html`. An ajax request will load `feuilles.editor.html`. 

Files are separated to “decouple” the various components of the page, which is useful when you want to focus on one single problem, the editor in our case. 

Consider this repo an “incubator”. I use it myself when I'm working on the editor. Then, when it's time to deploy, I have Grunt tasks that put things together for me. You obviously don't have to bother about Grunt tasks and such considerations. Simply add the features you want to see in the editor, and then let me take care of the “deploy” process.

## Documents

In the `documents` directory, you will find examples of Feuilles documents, along with some mock data (used to find out if, for example, the document is published on GitHub, Dropbox or WP).

If you want to create a new mock document that outlines a specific problem, just go ahead. All you will need to do is edit `index.js` to load the appropriate document.

## Environment

The following libraries are available: 
* [jQuery](http://jquery.com/)
* [Bootstrap](http://getbootstrap.com/)
* [kDown](https://github.com/alexduloz/kDown)
* [jQuery.spin.js](http://fgnass.github.io/spin.js/)
* [miniNotifications.js](http://www.minijs.com/plugins/8/notification) 

Feel free to suggest new libraries.

## Narrative

* In `feuilles.editor.js`, look at the `init()` method. This method will init sub-modules (which are located in `feuilles.editor.write.js` and `feuilles.editor.conv.js`).
* In `feuilles.editor.write.js`, you will find everything that is related to the *actual* editor. We focus a lot on keys, especially on `enter` and `backspace`, so we can take control of what browsers do.
* In `feuilles.editor.conv.js`, you will find everything that is related to [conversations](https://github.com/feuilles/Editor/blob/gh-pages/CONVERSATIONS.md). Since conversations are embedded in Feuilles documents, we also alter in here the actual document's content (but only the parts that have to deal with conversations). Anything that is not related to conversations is not placed in this file.
* In `feuilles.editor.util.js`, you will find a few helpers. You will certainly be interested in the `parseContent()` method, which is called by `editor.write.save()` to transform the markup produced by the editor into data that is server-compliant.
* The `feuilles.editor.js` contains a few wrappers to make the public API somehow friendlier. It also contains `config` variables.


## Empathy

I'm rather a perfectionist. In an effort to ship and move forward, I have uploaded portions of code that I find utterly embarrassing. In fact, “awful” would be a more appropriate way to put it. I could have refactored it to death to prove you that I'm a seasoned dev blah blah blah. But that would have taken a long time.

So here is our editor, in all its naked truth. If you were born with the ability to produce clean code right away, lucky you. 

## TODO

So many things… But ASAP: 

* Code should be cleaned and refactored
* Meaningful comments should be added


## Bugs

* Erase all the content of the editor (width cmd+a, for example), then start typing something. Boom.


## Abstraction

At the moment, it's not possible to simply grab the editor and run it on your own website. This will require a certain level of abstraction. Right now, the code powering the editor is quite bound to Feuilles and its environment. 

However, I plan to abstract the editor in a way that makes it easy to plug it into your own projects.

## Cheers

@alexduloz