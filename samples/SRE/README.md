# Site Relability Engineer templates

In a company where I work in addition to service maintanance and feature delivery me and my teammates are paricipating as Site Relability Engineer aka OnCall engineers. All the processes are well defined and only one thing missing is journaling of the time, events and system state. Being able to have a SRE journal was a main reason for this plugin to appear.

Here you will find set of templates used by myself to track OnCall history. In addition, templates are using all features available in plugin.

Some explanation is probably needed to understand templates. Each SRE rotation lasts for 2 weeks. During this time, for a first week SRE is responsible to accept all incidents, all customer investigation request and ensure system QoS is under SLA.

[New Watch.md](./templates/New%20Watch.md) is a main template used as journal of all events and keep references for different types of activities. I usually use it to report results. Execution of this template creates required folders in Vault and in addition creates sets of some other notes called Daily Checks (see below).

[Daily Check.md](./templates/Daily%20Check.md) is a template for note using to cover observation of service QoS and describe issues. Within a team we have an agreement that primary SRE every morning reports to the team state of service for last 24 hours (or more in case of weekends), so it's a good idea to have such notes and be able to return back if needed. In addition, template generate links to dashboard used by our team as overal overview of system health. `file-location` property of template is overloaded in a way to inject created Daily Check report into correct place and avoid manual movement of created file to correct place.

[Livesite Incident.md](./templates/Livesite%20Incident.md) is a template used to journal any livesite issues observed by telemetry or reported by customers. Just like `Daily Check.md` template it supports injection of generated note into correct folder of the vault.

[Request For Assistance.md](./templates/Request%20For%20Assistance.md) and [Customer Request Investigation.md](./templates/Customer%20Request%20Investigation.md) are templates used by SRE to journal special kind of activities based on the type of request from partner. Same as for `Daily Check.md` it supports injection of result into correct "OnCall Watch" directory.

[OncallWatchFuncs.md](./templates/OncallWatchFuncs.md) is helper file used to store common JS functions used by templates.