---
date: "{{dateCreated}}"
tags:
  - oncall
  - work
  - tbd
parent: "[[00 OnCall watch]]"
note-from-form: |-
  {
    "file-name": "t:OnCall Watch {{watchDates}}",
    "file-location": "t:Z-Core/OnCall/OnCall Watch {{watchDates}}",
    "form-items": [
      {
        "id": "dateCreated",
        "type": "dateTime"
      },
      {
        "id": "hasPrimary",
        "type": "checkbox",
        "init": "v:true",
        "get": "f:async (view, api) => view.hasPrimary ? 'true' : undefined",
        "form": {
          "title": "Primary Watch",
          "description": "Whenever going to participate as primary"
        }
      },
      {
        "id": "primaryStartDate",
        "type": "date",
        "get": "t:DD.MM.YYYY",
        "form": {
          "title": "Primary Begin",
          "description": "When primary role starts"
        }
      },
      {
        "id": "primaryEndDate",
        "type": "date",
        "init": "f:async (api) => moment().add(7, 'days')",
        "get": "t:DD.MM.YYYY",
        "form": {
          "title": "Primary Ends",
          "description": "When primary role ends"
        }
      },
      {
        "id": "primaryPartner",
        "type": "dropdown",
        "init": "ref:initOCESec",
        "form": {
          "title": "Secondary",
          "description": "Your backup"
        }
      },
      {
        "id": "hasSecondary",
        "type": "checkbox",
        "init": "v:true",
        "get": "f:async (view, api) => view.hasSecondary ? 'true' : undefined",
        "form": {
          "title": "Secondary Watch",
          "description": "Whenever going to participate as secondart"
        }
      },
      {
        "id": "secondaryStartDate",
        "type": "date",
        "init": "f:async (api) => moment().add(7, 'days')",
        "get": "t:DD.MM.YYYY",
        "form": {
          "title": "Secondary Begin",
          "description": "When secondary role starts"
        }
      },
      {
        "id": "secondaryEndDate",
        "type": "date",
        "init": "f:async (api) => moment().add(14, 'days')",
        "get": "t:DD.MM.YYYY",
        "form": {
          "title": "Secondary Ends",
          "description": "When secondary role ends"
        }
      },
      {
        "id": "secondaryPartner",
        "type": "dropdown",
        "init": "ref:initOCEPrim",
        "form": {
          "title": "Primary",
          "description": "For whom you are backup",
        }
      },
      {
        "id": "watchDates",
        "type": "text",
        "get": "ref:getWatchDates"
      }
    ],
    "beforeCreate": "ref:beforeCreate"
  }
---

{{#hasPrimary}}
Primary Start: {{primaryStartDate}}
Primary End: {{primaryEndDate}}
Partner: {{primaryPartner}}
{{/hasPrimary}}

{{#hasSecondary}}
Secondary Start: {{secondaryStartDate}}
Secondary End: {{secondaryEndDate}}
Partner: {{secondaryPartner}}
{{/hasSecondary}}

# Details

## Livesite Incidents

| Start Date & Time | End Date & Time | INC |
|-------------------|-----------------|-----|

## Assistance Requests

| Start Date & Time | End Date & Time | RFA |
|-------------------|-----------------|-----|

## Customer Request Investigations

- CRI

{{#hasPrimary}}
## Daily Checks
{{#dailyChecks}}
 - [[{{.}}]]
{{/dailyChecks}}
{{/hasPrimary}}

## Deployments

| Service | Release Link | Done | Comments |
|---------|--------------|------|----------|

## Weekly Operational Review



## Created Incidents or Issues

| Link | Notes |
|------|-------|


## Something Else

```js:note-from-form:initOCESec
async function(api) {
  return [
    { k: "user01", v: "User One (user01@example.com)"  },
    { k: "user02", v: "User Two (user02@example.com)" },
    { k: "user03", v: "User Three (user03@example.com)" },
    { k: "user04", v: "User Four (user04@example.com)" },
    { k: "user05", v: "User Five (user05@example.com)" },
    { k: "user06", v: "User Six (user06@example.com)", s: true },
    { k: "user07", v: "User Seven (user07@example.com)" },
    { k: "user08", v: "User Eight (user08@example.com)" },
    { k: "user09", v: "User Nine (user09@example.com)" },
    { k: "user10", v: "User Ten (user10@example.com)" },
    { k: "user11", v: "User Eleven (user11@example.com)" },
    { k: "user12", v: "User Twelve (user12@example.com)" },
    { k: "user13", v: "User Thirteen (user13@example.com)" },
  ];
}
```

```js:note-from-form:initOCEPrim
async function(api) {
  return [
    { k: "user01", v: "User One (user01@example.com)", s: true },
    { k: "user02", v: "User Two (user02@example.com)" },
    { k: "user03", v: "User Three (user03@example.com)" },
    { k: "user04", v: "User Four (user04@example.com)" },
    { k: "user05", v: "User Five (user05@example.com)" },
    { k: "user06", v: "User Six (user06@example.com)" },
    { k: "user07", v: "User Seven (user07@example.com)" },
    { k: "user08", v: "User Eight (user08@example.com)" },
    { k: "user09", v: "User Nine (user09@example.com)" },
    { k: "user10", v: "User Ten (user10@example.com)" },
    { k: "user11", v: "User Eleven (user11@example.com)" },
    { k: "user12", v: "User Twelve (user12@example.com)" },
    { k: "user13", v: "User Thirteen (user13@example.com)" },
  ];
}
```

```js:note-from-form:getWatchDates
async function(view, api) {
  let fmt='DD-MM-YYYY'; 
  let result = (s, e) => moment(s).format(fmt) + ' - ' + moment(e).format(fmt); 
  if (view.hasPrimary && view.hasSecondary) { 
    return result(view.primaryStartDate, view.secondaryEndDate); 
  } else if (view.hasPrimary) { 
    return result(view.primaryStartDate, view.primaryEndDate); 
  } else if (view.hasSecondary) { 
    return result(view.secondaryStartDate, view.secondaryEndDate); 
  } 
  return moment(view.dateCreated).format('X');
}
```

```js:note-from-form:beforeCreate
async function(view, api) {
  // update view["file-location"] and append number for new watch so it will be last in the list
  const parts = view["file-location"].replace(/\/+$/, "").split("/");  // view["file-location"] will be something like `Z-Core/OnCall/OnCall Watch 10.11.2026 - 24.11.2026`
  const watchFolderName = parts.pop();                                 // "OnCall Watch 10.11.2026 - 24.11.2026"
  const watchParentFolderPath = parts.join("/");                       // "Z-Core/OnCall"
  const watchFolder = api.io.getDirectory(watchParentFolderPath);
  let folderId = 0;
  if (watchFolder) {
	  for (const item of watchFolder.children) {
		  if (api.io.isDirectory(item)) {
			  const id = parseInt(item.name.match(/^\d+/)[0], 10);     // should return 1 for "0001"
			  if (folderId < id) {
				  folderId = id;
			  }
		  }
	  }
  }
  const watchFolderPath = `${watchParentFolderPath}/${String(++folderId).padStart(4, '0')} ${watchFolderName}`;
  view["file-location"] = watchFolderPath;
  
  // create list of daily livesite reports. Reports are created for next days covering previous day,
  // except weekends. Weekends are covered on Monday and report include Friday, Satuarday and Sunday.
  if (view.hasPrimary) {
	  const dailyChecks = [];
	  const dailyReportsFolder = await api.io.createDirectory(`${watchFolderPath}/Daily`);
	  
	  const current = moment(view.primaryStartDate, "DD.MM.YYYY").set({ hour: 11, minute: 0, second: 0 });
	  const endDate = moment(view.primaryEndDate, "DD.MM.YYYY").set({ hour: 11, minute: 0, second: 0 });
	  
	  let from = current.clone();
	  do {
		  current.add(1, 'day');
		  if (current.isoWeekday() > 5) {
			  continue;
		  }
		  
		  const fileName = `Daily ${current.format("DD.MM.YYYY")}`;
		  
		  const vm = {
			  dateCreated: moment().format(),
			  checkFrom: from.local().format(),
			  checkTo: current.local().format(),
			  dashboardTimeFrom: from.utc().format('x'),
			  dashboardTimeTo: current.utc().format('x'),
			  date: current.format('DD.MM.YYYY'),
			  selectedOncallWatchValue: view["file-name"]
		  };
		  vm["file-name"] = fileName;
		  vm["file-location"] = dailyReportsFolder.path;
		  
		  const template = await api.io.getFile(`${api.io.templatesDirectory.path}/Daily Check.md`);
		  if (!template) {
			  api.throwError(`Can't find ${api.io.templatesDirectory.path}/Daily Check.md`);
		  }
		  await api.renderTemplate(template, vm);
		  
		  from = current.clone();
		  dailyChecks.push(fileName);
	  } while (current.isBefore(endDate, "day"))
	  
	  view['dailyChecks'] = dailyChecks;
  }
}
```