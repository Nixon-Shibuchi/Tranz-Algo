# Builds Tranz-Algo demo shipment data as a Word document (requires Microsoft Word).
$ErrorActionPreference = "Stop"
$outPath = Join-Path $PSScriptRoot "Tranz-Algo_Demo_Shipment_Data.docx"

function Add-Heading {
    param([object]$Selection, [string]$Text, [int]$Level = 1)
    $Selection.Style = "Heading $Level"
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-Paragraph {
    param([object]$Selection, [string]$Text)
    $Selection.Style = "Normal"
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-Table {
    param(
        [object]$Doc,
        [object]$Selection,
        [string[]]$Headers,
        [object[]]$Rows
    )
    $rowCount = $Rows.Count + 1
    $colCount = $Headers.Count
    $table = $Doc.Tables.Add($Selection.Range, $rowCount, $colCount)
    $table.Style = "Grid Table 4 - Accent 1"
    for ($c = 1; $c -le $colCount; $c++) {
        $table.Cell(1, $c).Range.Text = $Headers[$c - 1]
        $table.Cell(1, $c).Range.Bold = $true
    }
    for ($r = 0; $r -lt $Rows.Count; $r++) {
        $cells = @($Rows[$r])
        if ($Rows[$r] -is [array]) { $cells = $Rows[$r] }
        for ($c = 0; $c -lt $colCount; $c++) {
            $val = if ($c -lt $cells.Count) { [string]$cells[$c] } else { "" }
            $table.Cell($r + 2, $c + 1).Range.Text = $val
        }
    }
    $Selection.Start = $table.Range.End
    $Selection.TypeParagraph()
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$sel = $word.Selection

Add-Heading $sel "Tranz-Algo - Demo Shipment Data" 1
Add-Paragraph $sel "Made-up sample batches for entering into the Tranz-Algo app. Create products first under Products, then each shipment under Shipments. Use True Cost to allocate, price, and commit."
Add-Paragraph $sel ""

Add-Heading $sel "Shipment 1 - Already-Local (agent paperwork in ZMW)" 2
Add-Paragraph $sel "Story: Soaps arrived from Johannesburg. Your clearing agent sent one ZMW invoice in ZMW - no foreign currency on the supplier side."

Add-Heading $sel "Products (create once)" 3
Add-Table $doc $sel @("SKU", "Name", "Weight (kg)") @(
    @("SOAP-LAV", "Lavender bath soap", "0.15"),
    @("SOAP-ALO", "Aloe vera soap", "0.15"),
    @("SOAP-CIT", "Citrus hand soap", "0.12")
)

Add-Heading $sel "New shipment header" 3
Add-Table $doc $sel @("Field", "Value") @(
    @("Reference", "SHP-LOC-2026-01"),
    @("Supplier", "Cape Clean Supplies"),
    @("Invoice number", "CA-8842"),
    @("Clearing agent", "Mwamba Logistics"),
    @("Carrier", "Intercity Freight"),
    @("Origin", "South Africa"),
    @("Primary cost mode", "Already-Local"),
    @("Local currency", "ZMW")
)

Add-Heading $sel "Lines (mode: Already-Local on each line)" 3
Add-Table $doc $sel @("Product", "Qty", "Local unit (ZMW)") @(
    @("SOAP-LAV", "24", "18.50"),
     @("SOAP-ALO", "24", "22.00"),
    @("SOAP-CIT", "12", "19.00")
)

Add-Heading $sel "Save costs" 3
Add-Table $doc $sel @("Field", "Value") @(
    @("Shipping total", "4,500"),
    @("Duty total", "1,100"),
    @("VAT total", "1,650"),
    @("Paperwork source", "Agent invoice MW-441 / FR-992")
)

Add-Heading $sel "True Cost" 3
Add-Table $doc $sel @("Setting", "Value") @(
    @("Allocation", "quantity"),
    @('Profit margin', '0.30 (30%)'),
    @('Action', 'Commit batch when ready')
)

Add-Paragraph $sel ""

Add-Heading $sel "Shipment 2 - Auto FX (USD supplier invoice)" 2
Add-Paragraph $sel "Story: LED lighting from Shenzhen. Supplier invoice is in USD; freight and tax paperwork are already in ZMW."

Add-Heading $sel "Products (create once)" 3
Add-Table $doc $sel @("SKU", "Name", "Weight (kg)") @(
    @("LED-9W", "9W LED bulb warm white", "0.08"),
    @("LED-12W", "12W LED bulb daylight", "0.10"),
    @("LED-BATT", "Rechargeable LED lantern", "0.45")
)

Add-Heading $sel "New shipment header" 3
Add-Table $doc $sel @("Field", "Value") @(
    @("Reference", "SHP-FX-2026-02"),
    @("Supplier", "BrightPath Electronics Ltd"),
    @("Invoice number", "BP-SZ-11907"),
    @("Clearing agent", "Zed Customs Partners"),
    @("Carrier", "Air China Cargo"),
    @("Origin", "China"),
    @("Primary cost mode", "Auto FX"),
    @("Foreign currency", "USD"),
    @("Local currency", "ZMW")
)

Add-Heading $sel "Lines (mode: Auto FX on each line)" 3
Add-Table $doc $sel @("Product", "Qty", "Line weight (kg)", "Foreign unit (USD)") @(
    @("LED-9W", "50", "4.0", "0.85"),
    @("LED-12W", "30", "3.0", "1.20"),
    @("LED-BATT", "20", "9.0", "2.50")
)

Add-Heading $sel "Save costs" 3
Add-Table $doc $sel @("Field", "Value") @(
    @("Exchange rate", "27.40"),
    @("Shipping total", "6,800"),
    @("Duty total", "2,400"),
    @("VAT total", "3,200"),
    @("Paperwork source", "Supplier inv BP-SZ-11907 / CA slip ZCP-778")
)
Add-Paragraph $sel "Note: You can use Fetch FX instead of typing 27.40 if the backend has internet access."

Add-Heading $sel "True Cost" 3
Add-Table $doc $sel @("Setting", "Value") @(
    @("Allocation", "weight"),
    @('Profit margin', '0.25 (25%)'),
    @('Action', 'Commit batch when ready')
)

Add-Paragraph $sel ""

Add-Heading $sel "Quick order of work" 2
Add-Paragraph $sel "1. Products - add all six SKUs listed above."
Add-Paragraph $sel "2. Shipments - create SHP-LOC-2026-01, add lines, save costs, Open True Cost, allocate, price, commit."
Add-Paragraph $sel "3. Repeat for SHP-FX-2026-02 with USD lines and exchange rate."
Add-Paragraph $sel ""
Add-Paragraph $sel "Generated for Tranz-Algo local demo and viva practice."

if (Test-Path $outPath) { Remove-Item $outPath -Force }
$doc.SaveAs2($outPath, 16) | Out-Null
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null

Write-Host "Created: $outPath"
