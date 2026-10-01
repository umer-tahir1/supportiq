"""Stable command-line entrypoint for training the complete model pipeline."""

import argparse
from pathlib import Path

from ml.inspect_dataset import find_dataset
from ml.y import train_all


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path)
    args = parser.parse_args()
    train_all(args.dataset or find_dataset())
