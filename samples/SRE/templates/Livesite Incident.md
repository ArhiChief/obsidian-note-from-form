---
date: "{{dateCreated}}"
tags:
  - oncall
  - work
  - icm
  - livesite
  - tbd
icm-severity: "{{incSev}}"
oncall-watch: "[[{{onCallWatch}}]]"
note-from-form: |-
  {
    "file-name": "t:INC {{incNum}} {{titleSanitized}}",
    "file-location": "t:{{selectedOncallWatchDir}}/INC",
    "form-items": [
      {
        "id": "dateCreated",
        "type": "dateTime"
      },
      {
        "id": "incNum",
        "type": "number",
        "form": {
          "title": "Incident #"
        },
        "validate": "f:async (view, api) => ({ isValid: view.incNum > 10000, errMsg: 'Invalid Incident number' })"
      },
      {
        "id": "title",
        "type": "text",
        "form": {
          "title": "Incident Title"
        },
        "validate": "f:async (view, api) => ({ isValid: !!view.title, errMsg: 'Incident Title is required' })"
      },
      {
        "id": "service",
        "type": "dropdown",
        "init": "ref:initService",
        "get": "f:async (view, api) => view.service[0].k",
        "form": {
          "title": "Service",
          "description": "Service that was impacted"
        }
      },
      {
        "id": "incSev",
        "type": "dropdown",
        "init": "v:[{\"k\":\"0\",\"v\":\"0\"},{\"k\":\"1\",\"v\":\"1\"},{\"k\":\"2\",\"v\":\"2\",\"s\":true},{\"k\":\"2.5\",\"v\":\"2.5\"},{\"k\":\"3\",\"v\":\"3\"},{\"k\":\"4\",\"v\":\"4\"}]",
        "form": {
          "title": "Severity",
          "description": "Severity of incident"
        }
      },
      {
        "id": "incCat",
        "type": "dropdown",
        "init": "ref:initIncCat",
        "form": {
          "title": "Incident Category",
        }
      },
      {
        "id": "startAt",
        "type": "dateTime",
        "form": {
          "title": "Start At",
          "description": "Time when phone call happened"
        }
      },
      {
        "id": "endAt",
        "type": "dateTime",
        "init": "f:async (api) => moment().add(1, 'hours')",
        "form": {
          "title": "End At",
          "description": "Time when Incident was marked as mitigated"
        }
      },
      {
        "id": "onCallWatch",
        "type": "dropdown",
        "init": "ref:/templates/OncallWatchFuncs.md:currentOncall",
        "form": {
          "title": "OnCall Watch",
          "description": "Name of OnCall Watch"
        }
      },
      {
        "id": "selectedOncallWatchDir",
        "type": "text",
        "get": "f:async (view, api) => view.onCallWatch[0].k"
      },
      {
        "id": "titleSanitized",
        "type": "text",
        "get": "ref:/templates/OncallWatchFuncs.md:sanitizeTitle"
      }
    ]
  }
---

Incident Link: [Incident-{{incNum}}](https://example.com/incident/{{incNum}})
Service: {{service}}
Severity: {{incSev}}
Start Time & Date: {{startAt}}
End Time & Date: {{endAt}}
Incident Category: {{incCat}}

# Incident {{incNum}}: {{title}}

## Synopsis

## Reason

## Mitigation

## Something Else

```js:note-from-form:initService
async function(api) {
	return [
		{ k: "[My Service](https://example.com/services/myservice)", v: "My Service", s: true }
	];
}
```

```js:note-from-form:initIncCat
async function(api) {
	return [
		{ k: "1",  v: "External - Network", s: true },
		{ k: "7",  v: "External - Overload" },
		{ k: "8",  v: "External - Other process crashes" },
		{ k: "12", v: "Internal - Deployment" },
		{ k: "14", v: "Internal - False alarm" },
		{ k: "15", v: "Internal - Security" },
		{ k: "16", v: "Internal - any other bug caused by PNH" }
	];
}
```