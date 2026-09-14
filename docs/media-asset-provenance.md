# Phase 3 Representative Media Asset Record

## Scope and review

Created on 2026-09-12 for Phase 3, Action 2. These are original, project-created, AI-assisted raster illustrations generated with OpenAI's built-in image generator as an external, human-reviewed design experiment. Each output was reviewed for visual subject identity, coherent restrained editorial style, absence of visible text/logos/watermarks, and obvious unsafe-looking exercise form before upload. This review is a visual quality check, not medical or coaching certification.

No third-party image was incorporated. The generated outputs carry C2PA provenance metadata. The application records them as `admin-upload` because they were passed through the existing Phase 2 upload-and-assignment service; that storage source describes the management path rather than authorship. Every asset is a PNG, 1536 × 1024 pixels (3:2), and has English and Brazilian Portuguese localized alt text. Reviewer: Codex implementation review.

The ignored legacy JPEG uploads were not used: their provenance is unknown and their visual styles are incompatible with this set. No muscle images were assigned because the required anatomical confidence was not established; environments remain contextual strings rather than manageable media entities.

## Prompt families

Each individual prompt named only the listed exercise, equipment item, or movement pattern and otherwise followed one of these controlled prompt families:

- **Exercise:** correct named setup in an uncluttered charcoal studio; semi-flat 3D/vector-inspired editorial fitness illustration; a centered, readable subject suitable for a 3:2 thumbnail and square crop; near-black, off-white, restrained coral, and small teal accents; no text, logos, watermarks, UI, extra people, anatomy overlay, or white background.
- **Equipment:** isolated named object in the same charcoal editorial-illustration language; no people, product branding, advertising treatment, or text.
- **Movement pattern:** a lower-density simplified silhouette/pose in the same palette; no labels, arrows, text, logos, watermarks, UI, or anatomy overlay.

## Managed assets

| Asset ID | Assigned entity                | Historical local upload key                               | Treatment                                           |
| -------- | ------------------------------ | --------------------------------------------------------- | --------------------------------------------------- |
| 4        | Exercise: Bench Press          | `/media/uploads/5aa07bcc-d1ad-411f-bb2f-77ca468e4058.png` | Base exercise; direct assignment                    |
| 5        | Unassigned reusable asset      | `/media/uploads/929f6e62-0747-4480-b21e-c57f9f05cf0e.png` | Preserved after redundant direct assignment removal |
| 6        | Exercise: Push Up              | `/media/uploads/c4eba653-fc09-4317-82d1-a83435f11854.png` | Base exercise; direct assignment                    |
| 7        | Exercise: Row                  | `/media/uploads/a60ed99d-eb54-4e26-b8f1-467fef3a2ff6.png` | Base exercise; direct assignment                    |
| 8        | Exercise: Leg Press            | `/media/uploads/a6287075-db13-4174-b118-7dd3771853c8.png` | Base exercise; direct assignment                    |
| 9        | Exercise variant: Goblet Squat | `/media/uploads/6c548090-f779-4772-94e7-12bad02351c5.png` | Direct exercise variant                             |
| 10       | Exercise: Hip Extension        | `/media/uploads/86750e89-8167-490a-8cb1-69162c9fe1bd.png` | Base exercise; direct assignment                    |
| 11       | Exercise: Running              | `/media/uploads/3c52aabd-adfc-4a01-aaa4-a5c52ddb52d1.png` | Base exercise; direct assignment                    |
| 12       | Equipment: Barbell             | `/media/uploads/c6de80c9-b0cb-484c-b965-37d3d896c6a5.png` | Direct equipment assignment                         |
| 13       | Equipment: Dumbbell            | `/media/uploads/b1f9a2c3-6d75-4cb7-8ca1-9b892d4fad38.png` | Direct equipment assignment                         |
| 14       | Equipment: Kettlebell          | `/media/uploads/9faae354-455c-405a-a2ab-94d9f4c8471a.png` | Direct equipment assignment                         |
| 15       | Equipment: Resistance Band     | `/media/uploads/dd48e2af-580e-4608-a3c5-5069980e4fc8.png` | Direct equipment assignment                         |
| 16       | Movement pattern: Push         | `/media/uploads/eed0044a-acd7-4f67-b7c8-f227d98f52dd.png` | Direct movement-pattern assignment                  |
| 17       | Movement pattern: Pull         | `/media/uploads/fdab7e8a-99a8-42a7-879c-0149919b8429.png` | Direct movement-pattern assignment                  |
| 18       | Movement pattern: Squat        | `/media/uploads/63e2172a-4fe0-45bd-9208-0d5da01077fd.png` | Direct movement-pattern assignment                  |
| 19       | Movement pattern: Hinge        | `/media/uploads/b60db06b-b234-42f4-8086-25ac6d69ea7c.png` | Direct movement-pattern assignment                  |
| 20       | Movement pattern: Gait         | `/media/uploads/f3884f5d-d767-4b58-b1e1-9fa3e0eb8767.png` | Direct movement-pattern assignment                  |

## Resolver validation state

- Goblet Squat resolves its direct kettlebell-setup asset rather than the barbell back-squat base asset.
- Barbell Bench Press, Bilateral Leg Press, Bodyweight Glute Bridge, Bodyweight Push Up, One-Arm Dumbbell Row, Treadmill Running, and Dumbbell Bench Press resolve their directly assigned base-exercise asset through the established inheritance rule.
- An unknown entity resolves to the established initial fallback.

The associated files were recovered from ignored application-managed storage under
`public/media/uploads`; their UUID names were used only as historical recovery references, never as
catalog identity. The 66 assigned reviewed assets now also live under source-controlled
`public/media/catalog/` paths named by stable catalog key and have provider-neutral object keys in
`data/canonical-media.json`. The ignored upload originals remain preserved as local/deferred
storage. No third-party asset was added.

## Phase 4 Action 2 — Tier 1 base and equipment curation

Action 2 extends the same human-reviewed external-generation workflow, provenance standard, and
prompt-family constraints. The current batch uses a deliberately non-photorealistic semi-flat
editorial rendering, charcoal background, off-white/coral emphasis, and small teal accents. Every
asset below was inspected for subject/equipment identity, safe obvious form, absent visible text,
logos, watermarks, and stylistic coherence before it was passed through the normal management
service.

| Asset ID | Assigned entity                     | Historical local upload key                               | English / Portuguese metadata                                                               |
| -------- | ----------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 21       | Exercise: Overhead Press            | `/media/uploads/f8b1d124-116d-408a-86e6-0626120fe1f3.png` | Standing barbell overhead press / desenvolvimento militar com barra em pé                   |
| 22       | Exercise: Pull Up                   | `/media/uploads/c43670ac-87eb-41e4-9397-aa1fe168f7d9.png` | Bodyweight pull-up / barra fixa                                                             |
| 23       | Exercise: Lat Pulldown              | `/media/uploads/0621935c-219d-4fee-ab82-e8e60d9cf453.png` | Seated lat pulldown / puxada na frente em máquina                                           |
| 24       | Exercise: Deadlift                  | `/media/uploads/b4a0de1e-d7cc-4d1f-8e1c-0943436284d6.png` | Conventional barbell deadlift setup / levantamento terra convencional com barra             |
| 25       | Exercise: Squat                     | `/media/uploads/2103f902-8943-4f77-989b-f70ac803ef2d.png` | Barbell back squat / agachamento livre com barra                                            |
| 26       | Exercise: Romanian Deadlift         | `/media/uploads/952d2828-8805-4aad-ad87-a769264c61af.png` | Romanian deadlift / levantamento terra romeno                                               |
| 27       | Exercise: Forward Lunge             | `/media/uploads/a34cf5dd-af81-49c7-9ed8-6212efac4e72.png` | Forward lunge / afundo à frente                                                             |
| 28       | Exercise: Reverse Lunge             | `/media/uploads/840f29fe-1f00-4b31-86fc-1c34da4264c2.png` | Reverse lunge / afundo reverso                                                              |
| 29       | Exercise: Split Squat               | `/media/uploads/70baecfc-1e60-48e7-bbaf-231cd47166aa.png` | Split squat / agachamento dividido                                                          |
| 30       | Exercise: Chest Fly                 | `/media/uploads/81bab83f-fdc4-459c-8463-37ab3aee21b3.png` | Chest fly / crucifixo                                                                       |
| 31       | Exercise: Lateral Raise             | `/media/uploads/cf26e364-d0db-4e9f-8691-28af28d96872.png` | Lateral raise / elevação lateral                                                            |
| 32       | Exercise: Biceps Curl               | `/media/uploads/145f3ce7-abf1-4183-86f1-6a8ea4610e20.png` | Biceps curl / rosca bíceps                                                                  |
| 33       | Exercise: Triceps Pushdown          | `/media/uploads/10715814-40ea-4ef6-882f-b3ea438df397.png` | Cable triceps pushdown / tríceps na polia                                                   |
| 34       | Equipment: Suspension Trainer (TRX) | `/media/uploads/9a8ec289-cc07-4eb2-b7aa-8044413b04e5.png` | Suspension trainer / treinador de suspensão                                                 |
| 35       | Equipment: Ab Wheel                 | `/media/uploads/63e69822-489e-4c9b-a684-75b03199300a.png` | Ab wheel / roda abdominal                                                                   |
| 36       | Equipment: Medicine Ball            | `/media/uploads/1c127e04-846b-425b-9ae1-4dc5f9c00115.png` | Textured medicine ball / bola medicinal texturizada                                         |
| 37       | Exercise: Leg Extension             | `/media/uploads/96f0967d-0a68-42ec-a360-9daeb0ff59da.png` | Seated leg extension / extensão de pernas sentada                                           |
| 38       | Exercise: Leg Curl                  | `/media/uploads/6a0c8689-c1f4-496c-a02c-7f68da3986d4.png` | Prone leg curl / flexão de pernas deitado                                                   |
| 39       | Exercise: Plank                     | `/media/uploads/9c9fa0a8-682e-4952-a5bc-9c0f1fe48753.png` | High plank / prancha alta                                                                   |
| 40       | Exercise: Kettlebell Swing          | `/media/uploads/94b49881-cf60-4809-ad44-ae21def1ddb8.png` | Two-handed kettlebell swing / balanço com kettlebell usando as duas mãos                    |
| 41       | Exercise: Farmer Carry              | `/media/uploads/f04d481d-0bd7-4a64-bfa4-a76dd90b167b.png` | Farmer carry with two dumbbells / caminhada do fazendeiro com dois halteres                 |
| 42       | Exercise: Walking                   | `/media/uploads/18d16809-e509-4635-b929-c630dd4bb80b.png` | Brisk walking / caminhada acelerada                                                         |
| 43       | Exercise: Cycling                   | `/media/uploads/ab1fc275-35f3-4cf2-9232-2e23ab2e9af7.png` | Stationary cycling / ciclismo em bicicleta ergométrica                                      |
| 44       | Exercise: Jump Rope                 | `/media/uploads/7f181e84-ce34-4b52-9914-bac35ec8ccd8.png` | Jump rope / pular corda                                                                     |
| 45       | Exercise: Elliptical Training       | `/media/uploads/9087ec29-e45d-4d26-bf84-aab7765cbf17.png` | Elliptical training / treino em máquina elíptica                                            |
| 46       | Exercise: Rowing                    | `/media/uploads/aab37365-115c-4a7b-85fc-17d9d0e69a99.png` | Indoor rowing / remo indoor                                                                 |
| 47       | Equipment: Smith Machine            | `/media/uploads/bcec2a00-882e-4c5c-a29e-c08c6d061bb5.png` | Guided-bar Smith machine / máquina Smith com barra guiada                                   |
| 48       | Equipment: Cable Machine            | `/media/uploads/7a630206-3bce-4172-8f92-bdeb8d860f0a.png` | Dual-pulley cable machine / máquina de cabos com polias duplas                              |
| 49       | Equipment: Leg Press Machine        | `/media/uploads/bb7ae8b2-02db-4af3-8eb1-dc697702010c.png` | 45-degree sled leg press / leg press com trenó a 45 graus                                   |
| 50       | Equipment: Chest Press Machine      | `/media/uploads/09636aaf-e4ba-4377-a05d-611fe71175fd.png` | Seated selectorized chest press / máquina de supino sentado com pilha de pesos              |
| 51       | Equipment: Hack Squat Machine       | `/media/uploads/88c60a73-4e59-4c2a-8faa-dcd9df9ab334.png` | Plate-loaded hack squat / hack squat com carga por anilhas                                  |
| 52       | Equipment: Leg Extension Machine    | `/media/uploads/bd91363f-2ac8-4411-96b0-313a0842929c.png` | Seated leg extension machine / máquina de extensão de pernas sentada                        |
| 53       | Equipment: Leg Curl Machine         | `/media/uploads/6121421a-71bd-4f51-ad68-a4e7599be8d2.png` | Prone leg curl machine / máquina de flexão de pernas deitado                                |
| 54       | Equipment: Rear Delt Machine        | `/media/uploads/dbd00724-138e-4c5d-bc68-00b8fdaf7103.png` | Reverse-pec-deck rear delt machine / máquina de deltoide posterior reversa                  |
| 55       | Equipment: Lat Pulldown Machine     | `/media/uploads/e58bf12e-c17e-4746-9a5b-74fce33e0ef9.png` | Seated lat pulldown machine / máquina de puxada na frente sentada                           |
| 56       | Equipment: Pull-up Bar              | `/media/uploads/a764276f-2cb4-499b-8d14-729ff19abe12.png` | Freestanding pull-up bar station / estação de barra fixa independente                       |
| 57       | Equipment: Dip Bar                  | `/media/uploads/3a1ab41e-7f48-48c3-a0d3-ca0e260ea940.png` | Freestanding parallel dip bar station / estação de barras paralelas                         |
| 58       | Equipment: Jump Rope                | `/media/uploads/e73e53e2-7d24-4cdf-9c3e-5bcb93a13371.png` | Adjustable jump rope / corda de pular ajustável                                             |
| 59       | Equipment: Treadmill                | `/media/uploads/93315e2f-5f4c-4d92-8773-ddd76c061271.png` | Motorized treadmill / esteira motorizada                                                    |
| 60       | Equipment: Stationary Bike          | `/media/uploads/0438c592-33ee-4d35-ba76-f8d2da9f9afd.png` | Upright stationary exercise bike / bicicleta ergométrica vertical                           |
| 61       | Equipment: Elliptical Trainer       | `/media/uploads/69a78ab8-1076-427b-8ca6-a2a06adb1ac5.png` | Elliptical trainer / treinador elíptico                                                     |
| 62       | Equipment: Rowing Machine           | `/media/uploads/9e893395-5d40-4362-b1f4-ff1e15229e81.png` | Indoor rowing machine / máquina de remo indoor                                              |
| 63       | Equipment: Flat Bench               | `/media/uploads/d60a6186-7634-436d-b098-9ed9c6b2a0b1.png` | Flat weight bench / banco reto de musculação                                                |
| 64       | Equipment: Incline Bench            | `/media/uploads/693ab42f-89d5-44a0-8c1a-5655afb4ea64.png` | Adjustable incline weight bench / banco inclinado ajustável                                 |
| 65       | Equipment: Decline Bench            | `/media/uploads/13a4af6a-5c81-4edc-9e0a-08defbf7190f.png` | Decline weight bench with ankle rollers / banco declinado com rolos para tornozelos         |
| 66       | Equipment: Squat Rack               | `/media/uploads/c866737e-b021-4de1-9b50-f52dda14be34.png` | Open-front squat rack with safety arms / rack de agachamento aberto com braços de segurança |
| 67       | Equipment: Power Rack               | `/media/uploads/2b4bfcee-418e-4ea9-b51a-08b39a6a6e08.png` | Four-post power rack with safety pins / power rack de quatro postes com pinos de segurança  |

The generated source files remain outside the project; the durable application references are the
managed storage keys above. Action 2 was completed after its recorded Tier 1 and equipment coverage
verification.

## Phase 4 Action 3 — Movement-pattern completion

Action 3 uses the same built-in image-generation, human-review, managed-upload, and localized
metadata workflow. The three outputs were reviewed for clear movement identity, obvious safe form,
3:2 framing, compatible charcoal/coral/teal visual language, and absence of visible text, labels,
logos, watermarks, UI, or anatomy overlays. The three distinct adult subjects broaden the collection's
visible range of skin tones, age cues, hair, and body build naturally without stereotype-driven
depiction.

| Asset ID | Assigned entity            | Historical local upload key                               | English / Portuguese metadata                                                                                                                    |
| -------- | -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 68       | Movement pattern: Lunge    | `/media/uploads/1078dab8-1e49-4df7-a159-3a8d865399c7.png` | Graphic silhouette representing a lunge movement pattern. / Silhueta gráfica que representa o padrão de movimento de afundo.                     |
| 69       | Movement pattern: Carry    | `/media/uploads/828ba824-1f7c-45be-bac7-dbfbe9574cb3.png` | Graphic silhouette representing a loaded carry movement pattern. / Silhueta gráfica que representa o padrão de movimento de transporte de carga. |
| 70       | Movement pattern: Rotation | `/media/uploads/947d6e90-0818-4054-ada4-695f03e9f6ba.png` | Graphic silhouette representing a trunk rotation movement pattern. / Silhueta gráfica que representa o padrão de movimento de rotação do tronco. |

The historical upload keys above document the recovery/provenance record; they are not the current
durable object keys. Current canonical object keys are stored in `data/canonical-media.json` and
the `media_assets.storage_key` column. No muscle asset was added, reassigned, or deleted: the
pre-existing JPEG muscle records remain a separate provenance/anatomy audit finding. Environments
remain contextual strings and received no managed assignment.

## Phase 4 Action 6 — Legacy retention and final health audit

The final audit kept every legacy asset record and file intact. It removed only the two unsupported
legacy direct assignments: asset 1 from Abs and asset 3 from Abductors. The existing transactional
removal service preserved both assets for future provenance/source/license review. Asset 2 remains
unassigned with its existing placeholder localized text; assets 1 and 3 remain unassigned, and
asset 5 remains the reviewed reusable Barbell Bench Press illustration retained after the variant
audit. None of assets 1–3 is claimed as project-created, licensed, or suitable for current visual
coverage.

Read-only verification found 70 present application-managed files, each matching its stored MIME
type and dimensions, with no unsafe storage key, unreadable object, or byte-identical duplicate.
The managed collection totals 113,375,117 bytes; individual files range from 35,203 to 2,195,217
bytes. All 66 active direct assignments have both English and Brazilian Portuguese localized alt
text records. The canonical seed uses the 70 current manifest assignments, including the two
non-conflicting original static assignments (`exercise_variant:barbell-bench-press` and
`muscle:chest`). The three original static files that overlapped recovered
reviewed assignments remain in place but are no longer selected by the canonical manifest.
