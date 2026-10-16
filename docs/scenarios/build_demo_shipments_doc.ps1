# Regenerates Tranz-Algo_Demo_Shipment_Data.docx via the Python builder.
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$py = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"
$script = Join-Path $PSScriptRoot "build_demo_shipments_doc.py"
if (-not (Test-Path $py)) { $py = "py" }
& $py $script
