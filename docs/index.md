# Toolchanger separation plane



<div class="tc-plate"><div class="tc-top"><div class="tc-key"><img src="assets/diagrams/key.svg" alt="Annotated toolhead block diagram, with legend"></div><div class="tc-band"><div class="tc-band-label"><span>Conventional toolchangers</span></div><div class="tc-band-body tc-one"><a class="tc-cell" href="#type-full_conventional"><span class="tc-cell-fig"><img src="assets/diagrams/full_conventional.svg" alt="Full conventional block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">Full conventional</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">Prusa XL</span><span class="tc-org-commercial-toolhead">E3D toolchanger</span><span class="tc-org-foss">Stealthchanger</span><span class="tc-org-foss">Tapchanger</span><span class="tc-org-foss">Madam</span><span class="tc-org-foss">Daksh</span><span class="tc-org-foss">Lineux</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a><a class="tc-cell" href="#type-partial_conventional"><span class="tc-cell-fig"><img src="assets/diagrams/partial_conventional.svg" alt="Partial conventional block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">Partial conventional</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">U1</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a></div></div></div><div class="tc-band"><div class="tc-band-label"><span>Filament path changers</span></div><div class="tc-band-body "><a class="tc-cell" href="#type-gear_swapping"><span class="tc-cell-fig"><img src="assets/diagrams/gear_swapping.svg" alt="Gear swapping block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">Gear swapping</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">C5 series</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a><a class="tc-cell" href="#type-hotend_fan_swapping"><span class="tc-cell-fig"><img src="assets/diagrams/hotend_fan_swapping.svg" alt="Hotend fan swapping block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">Hotend fan swapping</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">M1D</span><span class="tc-org-foss">A4T-C</span><span class="tc-org-foss">MedusaHC</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a><a class="tc-cell" href="#type-inductive_pogo"><span class="tc-cell-fig"><img src="assets/diagrams/inductive_pogo.svg" alt="Inductive / pogo changers block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">Inductive / pogo changers</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">MX series</span><span class="tc-org-commercial-toolhead">INDX</span><span class="tc-org-foss">Quindecum</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a><a class="tc-cell" href="#type-wired"><span class="tc-cell-fig"><img src="assets/diagrams/wired.svg" alt="Wired block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">Wired</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">Klitek</span><span class="tc-org-foss">CX Changer</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a></div></div><div class="tc-band"><div class="tc-band-label"><span>Nozzle changers</span></div><div class="tc-band-body "><a class="tc-cell" href="#type-ams_assisted_toolchanger"><span class="tc-cell-fig"><img src="assets/diagrams/ams_assisted_toolchanger.svg" alt="AMS-assisted toolchangers block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">AMS-assisted toolchangers</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">Vortek</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a><a class="tc-cell" href="#type-ams_assisted_nozzle_changer"><span class="tc-cell-fig"><img src="assets/diagrams/ams_assisted_nozzle_changer.svg" alt="AMS-assisted nozzle changers block diagram"></span><span class="tc-cell-txt"><span class="tc-cell-name">AMS-assisted nozzle changers</span><span class="tc-cell-systems"><span class="tc-org-commercial-printer">Atomform</span><span class="tc-org-commercial-toolhead">Swapper3d</span></span><span class="tc-cell-desc"><em>Description to follow.</em></span></span></a></div></div></div>

## Toolchanger classes

### Conventional toolchangers

<details class="tc-details" id="type-full_conventional" markdown>
<summary>Full conventional</summary>

![Full conventional](assets/diagrams/full_conventional-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">Prusa XL</span> | Commercial printer |
| <span class="tc-org-commercial-toolhead">E3D toolchanger</span> | Commercial toolhead |
| <span class="tc-org-foss">Stealthchanger</span> | FOSS design |
| <span class="tc-org-foss">Tapchanger</span> | FOSS design |
| <span class="tc-org-foss">Madam</span> | FOSS design |
| <span class="tc-org-foss">Daksh</span> | FOSS design |
| <span class="tc-org-foss">Lineux</span> | FOSS design |

</details>

<details class="tc-details" id="type-partial_conventional" markdown>
<summary>Partial conventional</summary>

![Partial conventional](assets/diagrams/partial_conventional-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">U1</span> | Commercial printer |

!!! note

    In the source figure the dashed boundary cuts through the toolhead board rather than around it. Read as: some tool electronics travel, some stay. Worth verifying against the real machine.

</details>

### Filament path changers

<details class="tc-details" id="type-gear_swapping" markdown>
<summary>Gear swapping</summary>

![Gear swapping](assets/diagrams/gear_swapping-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">C5 series</span> | Commercial printer |

</details>

<details class="tc-details" id="type-hotend_fan_swapping" markdown>
<summary>Hotend fan swapping</summary>

![Hotend fan swapping](assets/diagrams/hotend_fan_swapping-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">M1D</span> | Commercial printer |
| <span class="tc-org-foss">A4T-C</span> | FOSS design |
| <span class="tc-org-foss">MedusaHC</span> | FOSS design |

</details>

<details class="tc-details" id="type-inductive_pogo" markdown>
<summary>Inductive / pogo changers</summary>

![Inductive / pogo changers](assets/diagrams/inductive_pogo-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">MX series</span> | Commercial printer |
| <span class="tc-org-commercial-toolhead">INDX</span> | Commercial toolhead |
| <span class="tc-org-foss">Quindecum</span> | FOSS design |

</details>

<details class="tc-details" id="type-wired" markdown>
<summary>Wired</summary>

![Wired](assets/diagrams/wired-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">Klitek</span> | Commercial printer |
| <span class="tc-org-foss">CX Changer</span> | FOSS design |

!!! note

    Same swap set as inductive/pogo. The difference is how the heater/thermistor circuit crosses the boundary, not which blocks travel.

</details>

### Nozzle changers

<details class="tc-details" id="type-ams_assisted_toolchanger" markdown>
<summary>AMS-assisted toolchangers</summary>

![AMS-assisted toolchangers](assets/diagrams/ams_assisted_toolchanger-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">Vortek</span> | Commercial printer |

</details>

<details class="tc-details" id="type-ams_assisted_nozzle_changer" markdown>
<summary>AMS-assisted nozzle changers</summary>

![AMS-assisted nozzle changers](assets/diagrams/ams_assisted_nozzle_changer-labeled.svg){ .tc-detail-fig }

_Description to follow._

<div class="tc-clear"></div>

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">Atomform</span> | Commercial printer |
| <span class="tc-org-commercial-toolhead">Swapper3d</span> | Commercial toolhead |

</details>

## All systems

| Name | Origin |
| --- | --- |
| <span class="tc-org-commercial-printer">Prusa XL</span> | Commercial printer |
| <span class="tc-org-commercial-toolhead">E3D toolchanger</span> | Commercial toolhead |
| <span class="tc-org-foss">Stealthchanger</span> | FOSS design |
| <span class="tc-org-foss">Tapchanger</span> | FOSS design |
| <span class="tc-org-foss">Madam</span> | FOSS design |
| <span class="tc-org-foss">Daksh</span> | FOSS design |
| <span class="tc-org-foss">Lineux</span> | FOSS design |
| <span class="tc-org-commercial-printer">U1</span> | Commercial printer |
| <span class="tc-org-commercial-printer">C5 series</span> | Commercial printer |
| <span class="tc-org-commercial-printer">M1D</span> | Commercial printer |
| <span class="tc-org-foss">A4T-C</span> | FOSS design |
| <span class="tc-org-foss">MedusaHC</span> | FOSS design |
| <span class="tc-org-commercial-printer">MX series</span> | Commercial printer |
| <span class="tc-org-commercial-toolhead">INDX</span> | Commercial toolhead |
| <span class="tc-org-foss">Quindecum</span> | FOSS design |
| <span class="tc-org-commercial-printer">Klitek</span> | Commercial printer |
| <span class="tc-org-foss">CX Changer</span> | FOSS design |
| <span class="tc-org-commercial-printer">Vortek</span> | Commercial printer |
| <span class="tc-org-commercial-printer">Atomform</span> | Commercial printer |
| <span class="tc-org-commercial-toolhead">Swapper3d</span> | Commercial toolhead |

---


