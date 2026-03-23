param(
  [string]$ConnectionString = "postgresql://dev:111111@localhost:5432/registry",
  [string]$OutputFile = "scripts/sql/che-statistics-2023-08.xlsx"
)

$SqlFile = "scripts/sql/che-statistics-2023-08.sql"
$SqlContent = Get-Content $SqlFile -Raw
$OutputFile = [System.IO.Path]::ChangeExtension($OutputFile, ".xlsx")
$TempCsv = [System.IO.Path]::ChangeExtension($OutputFile, ".csv")

$CopyQuery = @"
COPY (
$SqlContent
) TO STDOUT WITH (FORMAT csv, HEADER true);
"@

$CopyQuery | psql $ConnectionString -P pager=off | Set-Content -Path $TempCsv -Encoding utf8

$RowCount = (Get-Content $TempCsv).Count - 1

node -e "const XLSX=require('xlsx'); const [,input,output]=process.argv; const src=XLSX.readFile(input, { raw: false, codepage: 65001 }); const sheet=src.Sheets[src.SheetNames[0]]; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, sheet, 'CHE Statistics'); XLSX.writeFile(wb, output);" -- "$TempCsv" "$OutputFile"

Remove-Item $TempCsv
Write-Host "Exported $RowCount rows to $OutputFile"
