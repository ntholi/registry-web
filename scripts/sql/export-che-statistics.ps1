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

node -e "const XLSX=require('xlsx');const[,input,output]=process.argv;const src=XLSX.readFile(input,{raw:true,codepage:65001});const sheet=src.Sheets[src.SheetNames[0]];const range=XLSX.utils.decode_range(sheet['!ref']);const numCols=new Set([8,13,14,15,19,21]);for(let r=range.s.r+1;r<=range.e.r;r++){for(const c of numCols){const addr=XLSX.utils.encode_cell({r,c});const cell=sheet[addr];if(cell&&cell.v!==''){const n=Number(cell.v);if(!isNaN(n)){cell.v=n;cell.t='n';delete cell.w}}}}const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,sheet,'CHE Statistics');XLSX.writeFile(wb,output);" -- "$TempCsv" "$OutputFile"

Remove-Item $TempCsv
Write-Host "Exported $RowCount rows to $OutputFile"
