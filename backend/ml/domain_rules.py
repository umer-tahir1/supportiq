"""Small, hand-written restaurant vocabulary rules, not learned dataset labels."""

import re


def expand_complaint_terms(text):
    # Source descriptors say "temperature"; customers often say their food was cold.
    # Append vocabulary rather than altering the stored original message.
    rules = [
        (
            r"\bfood\b.{0,45}\b(cold|undercooked|raw)\b|\bcold food\b",
            "food temperature",
        ),
        (r"\b(rotten|moldy|mouldy)\b", "food spoiled"),
        (r"\b(cockroaches?|rats?|mice|bugs?)\b", "rodents insects"),
    ]
    additions = [terms for pattern, terms in rules if re.search(pattern, text.lower())]
    return text + " " + " ".join(additions)


def sentiment_input(text):
    # VADER itself misses these negative restaurant phrases. Explicit tokens give
    # them domain polarity without pretending a sentiment model was trained.
    rules = [
        (
            r"\bfood\b.{0,45}\b(completely cold|cold|undercooked)\b|\bcold food\b",
            " restaurant_cold_food ",
        ),
        (r"\b(order|delivery)\b.{0,50}\b(late|delayed)\b", " restaurant_late_order "),
    ]
    for pattern, replacement in rules:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


SENTIMENT_LEXICON = {"restaurant_cold_food": -1.8, "restaurant_late_order": -1.8}
