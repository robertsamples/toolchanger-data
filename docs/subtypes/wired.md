# Wired path changers

![Wired path changers](../assets/diagrams/wired-labeled.svg){ .tc-detail-fig }

The same split as inductive/pogo, but the heater and thermistor stay on a wire back to the board instead of crossing a contact.

**Pros**

- A crimped or soldered joint is more predictable than a contact.
- No pin wear.
- No custom electronics.
- Can be preheated.

**Cons**

- Without a dock fan preheating could cause heat creep.
- More wiring, requires redundant mosfets and thermistor pins.
- Gears have to open and re-engage filament path every time.
- More challenging for flexible materials than conventional toolchangers.
- Extruder places variable load on kinematic coupling.

<div class="tc-clear"></div>

## Systems

--8<-- "type-wired.md"
