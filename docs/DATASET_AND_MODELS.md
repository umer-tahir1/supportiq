# Dataset and model notes

Inspection used the actual local `311_Restaurant_data_20260930.csv`, not an assumed older NYC schema.

- 75,258 records, 38 columns, no duplicate ticket IDs or entirely duplicated rows.
- Created dates: January 1, 2020 through September 29, 2026.
- 72,634 source statuses are Closed, 2,621 In Progress, and 3 Unspecified.
- 2,621 missing closed dates; 72,637 valid nonnegative created/closed intervals.
- One top-level category: Food Establishment.
- No narratives, business names, sentiment labels, or delivery classifications.
- Empty legacy fields such as Vehicle Type and Bridge Highway Name are not imported.

## Source descriptor counts

| Descriptor | Records |
| --- | ---: |
| Rodents/Insects/Garbage | 24,583 |
| Food Spoiled | 6,110 |
| Pet/Animal | 5,347 |
| Bare Hands in Contact w/ Food | 5,339 |
| Letter Grading | 4,745 |
| Food Contaminated | 4,318 |
| No Permit or License | 3,631 |
| Food Worker Hygiene | 2,892 |
| Food Contains Foreign Object | 2,760 |
| Kitchen/Food Prep Area | 2,531 |
| Food Temperature | 1,999 |
| Toilet Facility | 1,995 |
| Odor | 1,949 |
| Food Protection | 1,535 |
| Food Preparation Location | 847 |
| Permit/License/Certificate | 663 |
| Handwashing | 600 |
| Dishwashing/Utensils | 557 |
| Facility Construction | 490 |
| Food Worker Activity | 465 |
| Food Worker Illness | 299 |
| Allergy Information | 282 |
| Ventilation | 276 |
| Sewage | 225 |
| Toxic Chemical/Material | 188 |
| Plumbing | 185 |
| Pesticide | 173 |
| Water | 142 |
| Sign | 58 |
| Sodium Warning | 33 |
| Lighting | 25 |
| Milk Not Pasteurized | 16 |

## Evaluation interpretation

The classifier's 80/20 stratified split contains 60,206 training rows and 15,052 test rows. All 32 descriptors are retained. Descriptor reconstruction accuracy and weighted precision/recall/F1 are 1.0. This is a deliberately disclosed proxy task: descriptor text is its own target and repeats across the split. It is unsuitable for claiming predictive accuracy on unseen narratives. Even splitting by unique text cannot independently evaluate all classes, because each class has exactly one unique descriptor.

We do not fabricate labeled customer narratives to inflate a benchmark. The next useful dataset would contain independently written, independently labeled customer messages. The manually authored inference vocabulary rules are outside this training score and are verified only through explicit functional examples.

| K | Silhouette on unique descriptors |
| --- | ---: |
| 5 | −0.002135 |
| 8 | 0.009787 |
| 10 | 0.022633 |

K = 10 is the best of these tested values, but the absolute separation is weak. Clusters reflect shared descriptor vocabulary, not validated operational root causes. Full cluster keywords, examples, class metrics, and confusion matrix are generated in `backend/saved_models/evaluation.json` and available to administrators at `/api/ml/evaluation`.

Sentiment comes from VADER plus the two documented phrase rules. Compound scores are polarity values, not confidence probabilities. Stored historical and live predictions are clearly derived fields. No sentiment accuracy is reported without ground-truth labels.

## Data integrity and scope

The importer uses source IDs as a uniqueness constraint and imports explicitly in 2,000-record transactions. Retrying after interruption skips committed IDs. Sequential repeat imports are verified; do not run concurrent imports. Training artifacts preserve original ticket IDs for similarity.

The raw dataset is left in place and never edited. Processed data, local database, credentials, and trained artifacts are excluded from version control. There are no invented business names or per-record customer identities in historical records. The source's addresses and boroughs remain those of NYC; they are not relabeled as real UrbanBite branches.
