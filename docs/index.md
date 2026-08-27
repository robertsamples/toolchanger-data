# Toolchanger Classes

--8<-- "plate.html"

## Conventional toolchangers

<details class="tc-details" id="type-full_conventional" markdown>
<summary>Full conventional</summary>

![Full conventional](assets/diagrams/full_conventional-labeled.svg){ .tc-detail-fig }

The whole toolhead travels. Each tool carries its own extruder motor, gears, fans, heat break and control board, so the only thing broken at a change is the link back to the mainboard.

**Pros**

- One connection to break and remake.
- Tools are self-contained, so one can be built or debugged on its own.
- Nothing is shared between tools, so a fault stays in one tool.

**Cons**

- A tool costs a whole toolhead.
- Most mass to accelerate and to dock.
- Most parts per tool to keep calibrated.

<div class="tc-clear"></div>

--8<-- "type-full_conventional.md"

</details>

<details class="tc-details" id="type-partial_conventional" markdown>
<summary>Partial conventional</summary>

![Partial conventional](assets/diagrams/partial_conventional-labeled.svg){ .tc-detail-fig }

The tool keeps the extruder and the hot end but leaves the part cooling fan on the carriage, along with some of the toolhead electronics.

**Pros**

- Cheaper per tool than a full toolhead.
- Part cooling and its duct never have to survive docking.

**Cons**

- Part cooling has to reach whatever tool is mounted.
- More connections cross the joint than in a full conventional.

<div class="tc-clear"></div>

--8<-- "type-partial_conventional.md"

</details>

## Filament path changers

<details class="tc-details" id="type-gear_swapping" markdown>
<summary>Gear swapping</summary>

![Gear swapping](assets/diagrams/gear_swapping-labeled.svg){ .tc-detail-fig }

The extruder motor stays on the carriage and the drive gears travel with the tool along with the hot end. The split is in the middle of the extruder.

**Pros**

- Motor mass stays off the tool.
- Cheaper tools than carrying a whole extruder.

**Cons**

- The drive coupling has to re-engage accurately every change.
- Filament stays loaded in the tool between changes.

<div class="tc-clear"></div>

--8<-- "type-gear_swapping.md"

</details>

<details class="tc-details" id="type-hotend_fan_swapping" markdown>
<summary>Hotend fan swapping</summary>

![Hotend fan swapping](assets/diagrams/hotend_fan_swapping-labeled.svg){ .tc-detail-fig }

The hot end travels with its own heat break fan. The extruder and part cooling stay behind, so filament is cut or retracted at the change.

**Pros**

- Small, cheap tools.
- Each hot end keeps the heat break fan it was designed around.

**Cons**

- Filament has to be pulled clear before a change and re-fed after.
- Fan power and the heater circuit both cross the joint.

<div class="tc-clear"></div>

--8<-- "type-hotend_fan_swapping.md"

</details>

<details class="tc-details" id="type-inductive_pogo" markdown>
<summary>Inductive / pogo changers</summary>

![Inductive / pogo changers](assets/diagrams/inductive_pogo-labeled.svg){ .tc-detail-fig }

Only the heat break and nozzle travel. The heater and thermistor cross the joint through spring pins or an inductive coupling, so nothing is plugged in by hand.

**Pros**

- Smallest and cheapest tools of the filament path changers.
- No cable to route or manage per tool.

**Cons**

- The contact has to carry heater current for thousands of cycles.
- Dirt or oxide at the interface shows up as a heating fault.

<div class="tc-clear"></div>

--8<-- "type-inductive_pogo.md"

</details>

<details class="tc-details" id="type-wired" markdown>
<summary>Wired</summary>

![Wired](assets/diagrams/wired-labeled.svg){ .tc-detail-fig }

The same split as inductive/pogo, but the heater and thermistor stay on a wire back to the board instead of crossing a contact.

**Pros**

- A crimped or soldered joint is more predictable than a contact.
- No pin wear.

**Cons**

- Each tool stays tethered, which limits where tools can be parked.
- Cable management gets harder with every tool added.

<div class="tc-clear"></div>

--8<-- "type-wired.md"

</details>

## Hotend changers

<details class="tc-details" id="type-ams_assisted_hotend_changer" markdown>
<summary>AMS-assisted hotend changers</summary>

![AMS-assisted hotend changers](assets/diagrams/ams_assisted_hotend_changer-labeled.svg){ .tc-detail-fig }

A hot end changer paired with an automatic material system. The AMS handles filament, so the tool only carries the heat break and nozzle.

**Pros**

- Filament handling and tool changing stay separate problems.
- Cheap tools.

**Cons**

- Depends on the AMS to feed and retract reliably.
- Purge and load time on every material change.

<div class="tc-clear"></div>

--8<-- "type-ams_assisted_hotend_changer.md"

</details>

<details class="tc-details" id="type-ams_assisted_nozzle_changer" markdown>
<summary>AMS-assisted nozzle changers</summary>

![AMS-assisted nozzle changers](assets/diagrams/ams_assisted_nozzle_changer-labeled.svg){ .tc-detail-fig }

Only the nozzle is swapped. The heat break, fans and extruder all stay on the machine and the AMS feeds filament.

**Pros**

- The smallest and cheapest thing to duplicate per tool.
- Almost no mass added to the carriage.

**Cons**

- The nozzle joint has to seal at temperature every time.
- Everything upstream is shared, so tools can only differ in nozzle geometry.

<div class="tc-clear"></div>

--8<-- "type-ams_assisted_nozzle_changer.md"

</details>

## All systems

--8<-- "systems-all.md"
