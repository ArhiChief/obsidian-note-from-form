---
date: "{{dateCreated}}"
tags:
  - oncall
  - work
  - investigation
  - "{{criType}}"
  - tbd
oncall-watch: "[[{{onCallWatch}}]]"
note-from-form: |-
  {
    "file-name": "t:CRI {{criNum}} {{titleSanitized}}",
    "file-location": "t:{{selectedOncallWatchDir}}/CRI",
    "form-items": [
      {
        "id": "dateCreated",
        "type": "dateTime"
      },
      {
        "id": "title",
        "type": "text",
        "form": {
          "title": "CRI Title"
        },
        "validate": "f:async (view, api) => ({ isValid: !!view.title, errMsg: 'Title is required' })"
      },
      {
        "id": "criType",
        "type": "dropdown",
        "init": "v:[{\"k\":\"inc\",\"v\":\"Incident\",\"s\":true},{\"k\":\"messanger-post\",\"v\":\"Messanger Post\"}]",
        "get": "f:async (view, api) => view.criType[0].k",
        "form": {
          "title": "CRI Type",
          "description": "How CRI was requested"
        }
      },
      {
        "id": "incNum",
        "type": "number",
        "form": {
          "title": "Incident #",
          "description": "Provide Incident numeber if 'CRI Type' is 'Incident'"
        },
        "validate": "f:async (view, api) => ({ isValid: view.criType[0].k === 'inc' ? view.incNum > 10000 : true , errMsg: 'Invalid Incident number' })"
      },
      {
        "id": "messangerPostName",
        "type": "text",
        "form": {
          "title": "Post Title",
          "description": "Provide Messanger Post Title if 'CRI Type' is 'Messanger Post'",
          "placeholder": "Some title"
        },
        "validate": "f:async (view, api) => ({ isValid: view.criType[0].k === 'messanger-post' ? !!view.messangerPostName : true, errMsg: 'Post Title required' })"
      },
      {
        "id": "messangerPostLink",
        "type": "textArea",
        "form": {
          "title": "Post Link",
          "description": "Provide link to Messanger Post if 'CRI Type' is 'Messanger Post'",
          "placeholder": "https://example.com"
        },
        "validate": "f:async (view, api) => ({ isValid: view.criType[0].k === 'messanger-post' ? !!view.messangerPostLink : true, errMsg: 'Post Link required' })"
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
        "id": "incNum",
        "type": "text",
        "get": "f:async (view, api) => view.criType[0].k === 'inc' ? view.incNum.toString() : moment(view.dateCreated).format('X')"
      },
      {
        "id": "isMessangerPost",
        "type": "checkbox",
        "get": "f:async (view, api) => view.criType[0].k === 'messanger-post' ? 'true' : undefined"
      },
      {
        "id": "isINC",
        "type": "checkbox",
        "get": "f:async (view, api) => view.criType[0].k === 'inc' ? 'true' : undefined"
      },
      {
        "id": "titleSanitized",
        "type": "text",
        "get": "ref:/templates/OncallWatchFuncs.md:sanitizeTitle"
      },
      {
        "id": "selectedOncallWatchDir",
        "type": "text",
        "get": "f:async (view, api) => view.onCallWatch[0].k"
      }
    ]
  }
---

{{#isMessangerPost}}
Messanger Post Link: [{{messangerPostName}}]({{messangerPostLink}})
{{/isMessangerPost}}
{{#isINC}}
Incident Link: [Incident-{{criNum}}](https://example.com/incident/{{criNum}})
{{/isINC}}

# CRI {{criNum}}: {{title}}

## Request

## Investigation

## Outcome

## Workitems

## Something Else