---
date: "{{dateCreated}}"
tags:
  - oncall
  - work
  - tbd
oncall-watch: "[[{{onCallWatch}}]]"
note-from-form: |-
  {
    "file-name": "f:async (view, api) => `Daily ${moment(view.checkTo).format('DD.MM.yyyy')}`",
    "file-location": "t:{{selectedOncallWatchDir}}/Daily",
    "form-items": [
      {
        "id": "dateCreated",
        "type": "dateTime"
      },
      {
        "id": "checkFrom",
        "type": "dateTime",
        "init": "f:async (api) => moment().set({ hour: 11, minute: 0, second: 0 }).add(-1, 'days')",
        "get": "f:async (view, api) => moment(view.checkFrom).format()",
        "form": {
          "title": "From",
          "description": "From what time (local) check starts"
        }
      },
      {
        "id": "checkTo",
        "type": "dateTime",
        "init": "f:async (api) => moment().set({ hour: 11, minute: 0, second: 0 })",
        "get": "f:async (view, api) => moment(view.checkTo).format()",
        "form": {
          "title": "To",
          "description": "Till what time (local) check ends"
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
        "id": "dashboardTimeFrom",
        "type": "dateTime",
        "get": "f:async (view, api) => moment(view.checkFrom).utc().format('x')"
      },
      {
        "id": "dashboardTimeTo",
        "type": "dateTime",
        "get": "f:async (view, api) => moment(view.checkTo).utc().format('x')"
      },
      {
        "id": "selectedOncallWatchDir",
        "type": "text",
        "get": "f:async (view, api) => view.onCallWatch[0].k"
      },
      {
        "id": "date",
        "type": "text",
        "get": "f:async (view, api) => moment(view.checkFrom).format('DD.MM.yyyy')"
      }
    ]
  }
---

Link to dashboard: [Daily Check dashboard](https://example.dashboard.com?globalStartTime={{dashboardTimeFrom}}&globalEndTime={{dashboardTimeTo}}&pinGlobalTimeRange=true)
Check From: {{checkFrom}}
Check To: {{checkTo}}

# Daily Check {{date}}

## Workitems