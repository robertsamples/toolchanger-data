# Toolchanger Subtypes

--8<-- "plate.html"

## Conventional toolchangers

<details class="note" id="type-full_conventional" markdown>
<summary>Full conventional</summary>

![Full conventional](assets/diagrams/full_conventional-labeled.svg){ .tc-detail-fig }

The whole toolhead is functionally a tool with a basic carriage being coupled to the belt. Each tool carries its own extruder motor, gears, fans, heat break and sometimes a toolhead board. The oldest type of 3D printer toolchanger.

**Pros**

- Uses close to standard toolheads.
- Failure modes are straightforward.
- Tools are self-contained, so one can be built or debugged on its own.
- Nothing is shared between tools, so a fault stays in one tool.

**Cons**

- A tool costs a whole toolhead — costly.
- Kinematic mount carries a large amount of weight and must be rigid.
- Most parts per tool to keep calibrated.

<div class="tc-clear"></div>

--8<-- "type-full_conventional.md"

</details>

<details class="note" id="type-partial_conventional" markdown>
<summary>Partial conventional</summary>

![Partial conventional](assets/diagrams/partial_conventional-labeled.svg){ .tc-detail-fig }

The tool keeps the extruder and the hot end but leaves the part cooling fan on the carriage, along with some of the toolhead electronics.

**Pros**

- Cheaper per tool than a full toolhead, less wiring.
- Part cooling and its duct never have to survive docking.

**Cons**

- Limited part cooling options.
- More connections cross the joint than in a full conventional.

<div class="tc-clear"></div>

--8<-- "type-partial_conventional.md"

</details>

## Filament path changers

<details class="note" id="type-gear_swapping" markdown>
<summary>Gear swapping path changers</summary>

![Gear swapping path changers](assets/diagrams/gear_swapping-labeled.svg){ .tc-detail-fig }

The extruder motor stays on the carriage and the drive gears travel with the tool along with the hot end. The split is in the middle of the extruder.

**Pros**

- Motor mass stays off the tool.
- Cheaper tools than carrying a whole extruder.
- Filament path is not modified.

**Cons**

- The drive coupling has to re-engage accurately every change.
- Requires custom motor.

<div class="tc-clear"></div>

--8<-- "type-gear_swapping.md"

</details>

<details class="note" id="type-hotend_fan_swapping" markdown>
<summary>Hotend fan swapping path changers</summary>

![Hotend fan swapping path changers](assets/diagrams/hotend_fan_swapping-labeled.svg){ .tc-detail-fig }

The hot end travels with its own heat break fan. The extruder and part cooling stay behind, the extruder gears open for filament path changes.

**Pros**

- Small, cheap tools.
- Prevents heat creep compared to systems that do not carry a hotend fan, more flexibility for preheating.

**Cons**

- Gears have to open and reengage filament path every time.
- More challenging for flexible materials than conventional toolchangers.
- More wiring than similar systems that don't carry a hotend fan on the tool.
- Extruder places variable load on kinematic coupling.

<div class="tc-clear"></div>

--8<-- "type-hotend_fan_swapping.md"

</details>

<details class="note" id="type-inductive_pogo" markdown>
<summary>Inductive / pogo path changers</summary>

![Inductive / pogo path changers](assets/diagrams/inductive_pogo-labeled.svg){ .tc-detail-fig }

Only the heat break and nozzle travel. The heater and thermistor cross the joint through spring pins or by inductive control, so nothing is plugged in by hand.

**Pros**

- Smallest and, in theory, cheapest tools of the filament path changers.
- No cable to route or manage per tool.
- For induction heating is very fast.

**Cons**

- The contact has to carry heater current for thousands of cycles.
- Dirt or oxide at the interface shows up as a heating fault.
- Gears have to open and reengage filament path every time.
- More challenging for flexible materials than conventional toolchangers.
- Cannot preheat tools.
- Inductive heating requires steel blocks which have lower thermal conductivity.
- Inductive heating requires IR monitoring of temperature — which is less precise and reliable than a thermistor.
- Extruder places variable load on kinematic coupling.

<div class="tc-clear"></div>

--8<-- "type-inductive_pogo.md"

</details>

<details class="note" id="type-wired" markdown>
<summary>Wired path changers</summary>

![Wired path changers](assets/diagrams/wired-labeled.svg){ .tc-detail-fig }

The same split as inductive/pogo, but the heater and thermistor stay on a wire back to the board instead of crossing a contact.

**Pros**

- A crimped or soldered joint is more predictable than a contact.
- No pin wear.
- No custom electronics.
- Can be preheated.

**Cons**

- Without a dock fan preheating could cause heat creep.
- More wiring, requires redundant mosfets and thermistor pins.
- Gears have to open and reengage filament path every time.
- More challenging for flexible materials than conventional toolchangers.
- Extruder places variable load on kinematic coupling.

<div class="tc-clear"></div>

--8<-- "type-wired.md"

</details>

## Hotend changers

<details class="note" id="type-ams_assisted_hotend_changer" markdown>
<summary>AMS-assisted hotend changers</summary>

![AMS-assisted hotend changers](assets/diagrams/ams_assisted_hotend_changer-labeled.svg){ .tc-detail-fig }

A hot end changer paired with an automatic material system. The AMS handles filament, so the tool only carries the heat break and nozzle.

**Pros**

- Filament handling and tool changing stay separate problems.
- Cheap tools.
- Aesthetically pleasing — easier to put a low lid on.

**Cons**

- Depends on the AMS to feed and retract reliably.
- Load time on every material change.
- Mechanically complex swapping mechanism.
- Requires purchasing an AMS.

<div class="tc-clear"></div>

--8<-- "type-ams_assisted_hotend_changer.md"

</details>

<details class="note" id="type-ams_assisted_nozzle_changer" markdown>
<summary>AMS-assisted nozzle changers</summary>

![AMS-assisted nozzle changers](assets/diagrams/ams_assisted_nozzle_changer-labeled.svg){ .tc-detail-fig }

Only the nozzle is swapped. The heat break, fans and extruder all stay on the machine and the AMS feeds filament.

**Pros**

- The smallest and cheapest thing to duplicate per tool.

**Cons**

- Depends on the AMS to feed and retract reliably.
- Load time on every material change.
- Mechanically complex swapping mechanism.
- Requires purchasing an AMS.

<div class="tc-clear"></div>

--8<-- "type-ams_assisted_nozzle_changer.md"

</details>

## All systems

--8<-- "systems-all.md"
