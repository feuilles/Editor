# Mock documents

This is where we can mimic documents that are normally stored in the database.

To add a document, just create a folder and give it a name. You will put two files in that folder:

* `body.txt`, which holds the main content of the document
* `data.json`, which holds various information about the document (see just below)

## A `data.json` manifesto

```
{
    "id": int,
    "sha": int,
    "title": string,
    "slug": string,
    "version": int,
    "editable": bool,
    "is_published": bool,
    "published": {
        "github": {
            "url": string
        }, 
        "wordpress":  {
            "url": string
        }, 
        "dropbox": {
            "url": string
        }
    }
}
```