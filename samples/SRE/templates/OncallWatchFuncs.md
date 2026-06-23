
```js:note-from-form:currentOncall
async function(api) {
	// try to get current on-call
	const today = moment().set({ hour: 0, minute: 0, second: 0 });
	const result = [];
	const oncallDirs = api.io.getDirectory("/Z-Core/OnCall");
	
	if (!oncallDirs) {
		api.throwError("No OnCall directories found");
	}
	
	for (const oncallDir of oncallDirs.children) {
		// format of directory name produced by NewWatch template expected to be
		// `xxxx OnCall Watch dd-mm-yyyy - dd-mm-yyyy` where `xxxx` is just a sequential 
		// numeber and `dd-mm-yyyy - dd-mm-yyyy` is a date range. And we are looking for 
		// `dd-mm-yyyy - dd-mm-yyyy` that covers todays date. If not found use latest
		
		const match = oncallDir.name.match(/^(\d+)\s+.*?\s+(\d{2}-\d{2}-\d{4})\s*-\s*(\d{2}-\d{2}-\d{4})/);
		if (match && api.io.isDirectory(oncallDir)) {
			const [,, startStr, endStr] = match;
		    const startDate = moment(startStr, "DD-MM-YYYY");
		    const endDate = moment(endStr, "DD-MM-YYYY");
		    
		    const item = {
			    k: oncallDir.path,
			    v: oncallDir.children.find(item => api.io.isFile(item) && oncallDir.name.endsWith(item.basename)).basename
		    };
		    
		    if (today.isBetween(startDate, endDate, "day", "[]")) {
			    item['s'] = true;
		    }
		    
		    result.push(item);
		}
	}
	
	return result;
}
```

```js:note-from-form:sanitizeTitle
async function(view, api) {
	const title = view.title;
	const replacements = {
		'<': 'lt',
		'>': 'gt',
		'"': "'",
		'?': '',
		'*': 'ast'
	};
	
	let name = view.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, (char) =>
        Object.prototype.hasOwnProperty.call(replacements, char)
            ? replacements[char]
            : "_"
    );
    
    name = name.trim().replace(/[. ]+$/, '');
    
    const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
    if (reserved.test(name)) {
        name = `_${name}`;
    }
    
    return name;
}
```
