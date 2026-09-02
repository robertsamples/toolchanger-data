# Inductive / pogo path changers

![Inductive / pogo path changers](../assets/diagrams/inductive_pogo-labeled.svg){ .tc-detail-fig }

Only the heat break and nozzle travel. The heater and thermistor cross the joint through spring pins or by inductive control, so nothing is plugged in by hand.

**Pros**

- Smallest and, in theory, cheapest tools of the filament path changers.
- No cable to route or manage per tool.
- Induction heating is very fast.

**Cons**

- The contact has to carry heater current for thousands of cycles.
- Dirt or oxide at the interface shows up as a heating fault.
- Gears have to open and re-engage filament path every time.
- More challenging for flexible materials than conventional toolchangers.
- Cannot preheat tools.
- Inductive heating requires steel blocks which have lower thermal conductivity.
- Inductive heating requires IR monitoring of temperature — which is less precise and reliable than a thermistor.
- Extruder places variable load on kinematic coupling.

<div class="tc-clear"></div>

## Systems

--8<-- "type-inductive_pogo.md"
