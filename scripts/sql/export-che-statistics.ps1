param(
  [string]$ConnectionString = "postgresql://dev:111111@localhost:5432/registry",
  [string]$OutputFile = "scripts/sql/che-statistics-2023-08.csv"
)

$SqlFile = "scripts/sql/che-statistics-2023-08.sql"
$SqlContent = Get-Content $SqlFile -Raw

$CopyQuery = @"
COPY (
$SqlContent
) TO STDOUT WITH (FORMAT csv, HEADER true);
"@

$CopyQuery | psql $ConnectionString -P pager=off | Set-Content -Path $OutputFile -Encoding utf8

$RowCount = (Get-Content $OutputFile).Count - 1
Write-Host "Exported $RowCount rows to $OutputFile"
