$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$expectedRemote = 'https://github.com/Leo-Moon7/taran-family-event-platform.git'
$approvedFiles = @(
  'contact.html',
  'contact-success.html',
  'partners.html',
  'claim.html',
  'vendor-dashboard.html'
)

$gitCommand = Get-Command git -ErrorAction SilentlyContinue
$bundledGit = 'C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
$gitExe = if ($gitCommand) { $gitCommand.Source } elseif (Test-Path -LiteralPath $bundledGit) { $bundledGit } else { throw 'Git 실행 파일을 찾을 수 없습니다.' }

$pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
$bundledPnpm = 'C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
$pnpmExe = if ($pnpmCommand) { $pnpmCommand.Source } elseif (Test-Path -LiteralPath $bundledPnpm) { $bundledPnpm } else { throw 'pnpm 실행 파일을 찾을 수 없습니다.' }

$bundledNodeDir = 'C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
if (Test-Path -LiteralPath $bundledNodeDir) {
  $env:Path = "$bundledNodeDir;$env:Path"
}

Push-Location $repoRoot
try {
  $branch = (& $gitExe branch --show-current).Trim()
  if ($branch -ne 'main') { throw "현재 브랜치가 main이 아닙니다: $branch" }

  $remote = (& $gitExe remote get-url origin).Trim()
  if ($remote -ne $expectedRemote) { throw "origin이 예상 저장소와 다릅니다: $remote" }

  & $gitExe diff --cached --quiet
  if ($LASTEXITCODE -ne 0) { throw '이미 스테이징된 변경이 있습니다. 기존 스테이징을 먼저 검토하세요.' }

  foreach ($file in $approvedFiles) {
    if (-not (Test-Path -LiteralPath $file)) { throw "승인 파일이 없습니다: $file" }
  }

  & $pnpmExe test
  if ($LASTEXITCODE -ne 0) { throw 'pnpm test 실패' }
  & $pnpmExe build
  if ($LASTEXITCODE -ne 0) { throw 'pnpm build 실패' }
  & $pnpmExe 'test:dist'
  if ($LASTEXITCODE -ne 0) { throw 'pnpm test:dist 실패' }

  & $gitExe add -- $approvedFiles
  if ($LASTEXITCODE -ne 0) { throw '승인 파일 스테이징 실패' }

  $stagedFiles = @(& $gitExe diff --cached --name-only | Sort-Object)
  $expectedFiles = @($approvedFiles | Sort-Object)
  if (Compare-Object -ReferenceObject $expectedFiles -DifferenceObject $stagedFiles) {
    throw "스테이징 범위가 승인 파일과 다릅니다: $($stagedFiles -join ', ')"
  }

  & $gitExe commit -m 'fix: align public promises and add contact form'
  if ($LASTEXITCODE -ne 0) { throw '커밋 실패' }

  & $gitExe push origin main
  if ($LASTEXITCODE -ne 0) { throw 'origin/main 푸시 실패' }

  Write-Output '배포 커밋을 origin/main에 푸시했습니다.'
  Write-Output 'Netlify 자동 배포 후 아래 주소를 확인하세요:'
  Write-Output 'https://taran-family-event-test.netlify.app/contact.html'
} finally {
  Pop-Location
}
