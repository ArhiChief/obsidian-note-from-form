---
date: "{{dateCreated}}"
tags:
  - oncall
  - work
  - Incident
  - tbd
oncall-watch: "[[{{onCallWatch}}]]"
note-from-form: |-
  {
    "file-name": "t:RFA {{incSev}} {{titleSanitized}}",
    "file-location": "t:{{selectedOncallWatchDir}}/RFA",
    "form-items": [
      {
        "id": "dateCreated",
        "type": "dateTime"
      },
      {
        "id": "incSev",
        "type": "number",
        "form": {
          "title": "Incident #"
        },
        "validate": "f:async (view, api) => ({ isValid: view.incSev > 10000, errMsg: 'Invalid Incident number' })"
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

Incident Link: [Incident-{{incSev}} ](https://example.com/incidents/incident/{{incSev}})
Start Time & Date: {{startAt}}
End Time & Date: {{endAt}}

# RFA {{incSev}}: {{title}}

## Request

## What was done

## Workitems

## Something Else