"""Regenerate the demo shipment handout into docs/viva/ (canonical location)."""
from pathlib import Path
import runpy

VIVA_BUILDER = Path(__file__).resolve().parents[1] / "viva" / "build_viva_docs.py"


def main():
    ns = runpy.run_path(str(VIVA_BUILDER))
    path = ns["build_demo_handout"]()
    print(f"Created: {path}")
    print("(Demo handout lives in docs/viva/ — see docs/viva/README.md)")


if __name__ == "__main__":
    main()
