param(
  [string]$VaultRoot = $(if ($env:THRESHOLD_VAULT_ROOT) { $env:THRESHOLD_VAULT_ROOT } else { "C:\Threshold\threshold\ThresholdVault" }),
  [string]$OutputDir = "C:\Threshold\Threshold Studio Website\ThresholdStudio\data"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SiteRoot = Split-Path -Parent $OutputDir
$VaultAssetRoot = Join-Path $SiteRoot "assets\vault"

$VaultRoot = [System.IO.Path]::GetFullPath($VaultRoot)
$SiteRoot = [System.IO.Path]::GetFullPath($SiteRoot)

if ($VaultRoot.StartsWith($SiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  Write-Warning "Vault root is inside the website workspace. Keep vault and runtime as separate workspaces for clean architecture."
}

function Get-NoteText {
  param(
    [string]$Path,
    [string]$RawText = $null
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  $raw = if ($null -ne $RawText) { $RawText } else { Get-Content -LiteralPath $Path -Raw -Encoding UTF8 }
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $null
  }

  $clean = ($raw -replace "\r", "")
  $clean = ($clean -replace "!\[\[[^\]]+\]\]", "")
  $clean = ($clean -replace "!\[[^\]]*\]\([^)]+\)", "")
  $clean = ($clean -replace "\[\[([^\]]+)\]\]", '$1')
  $clean = ($clean -replace "`n{3,}", "`n`n").Trim()
  return $clean
}

function Get-Excerpt {
  param([string]$Text, [int]$MaxLength = 320)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return ""
  }

  $lines = $Text -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  $body = ($lines | Select-Object -First 3) -join " "
  $body = ($body -replace "^#+\s*", "").Trim()
  if ($body.Length -le $MaxLength) {
    return $body
  }

  return ($body.Substring(0, $MaxLength).TrimEnd() + "...")
}

function Get-RelativeVaultPath {
  param([string]$Path, [string]$Root)

  $rootWithSlash = $Root.TrimEnd('\\') + '\\'
  if ($Path.StartsWith($rootWithSlash, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $Path.Substring($rootWithSlash.Length).Replace('\\', '/')
  }

  return [System.IO.Path]::GetFileName($Path)
}

function Get-WebAssetPath {
  param([string]$AbsolutePath)

  $siteWithSlash = $SiteRoot.TrimEnd('\\') + '\\'
  if ($AbsolutePath.StartsWith($siteWithSlash, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $AbsolutePath.Substring($siteWithSlash.Length).Replace('\\', '/')
  }

  return [System.IO.Path]::GetFileName($AbsolutePath)
}

function Select-Note {
  param(
    [object[]]$Notes,
    [string]$Pattern = "",
    [ValidateSet("First", "Last")]
    [string]$Mode = "First"
  )

  $source = @($Notes)
  if (-not [string]::IsNullOrWhiteSpace($Pattern)) {
    $source = @($source | Where-Object {
      $_ -and $_.title -match $Pattern
    })
  }

  if ($source.Count -eq 0) {
    return $null
  }

  if ($Mode -eq "Last") {
    return ($source | Select-Object -Last 1)
  }

  return ($source | Select-Object -First 1)
}

function Get-NoteExcerptValue {
  param([object]$Note)

  if ($null -eq $Note) {
    return ""
  }

  if ($Note -is [System.Collections.IDictionary] -and $Note.Contains("excerpt")) {
    return [string]$Note["excerpt"]
  }

  if ($Note.PSObject.Properties.Name -contains "excerpt") {
    return [string]$Note.excerpt
  }

  return ""
}

function Resolve-PreferredNote {
  param(
    [object]$Primary,
    [object]$Fallback
  )

  if ($null -ne $Primary) {
    return $Primary
  }

  return $Fallback
}

function Get-EmbeddedAssetRefs {
  param([string]$RawText)

  $refs = New-Object System.Collections.Generic.List[string]
  if ([string]::IsNullOrWhiteSpace($RawText)) {
    return @()
  }

  $wikiMatches = [regex]::Matches($RawText, '!\[\[([^\]]+)\]\]')
  foreach ($match in $wikiMatches) {
    $candidate = ($match.Groups[1].Value -split '\|')[0].Trim()
    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
      $refs.Add($candidate)
    }
  }

  $markdownMatches = [regex]::Matches($RawText, '!\[[^\]]*\]\(([^)]+)\)')
  foreach ($match in $markdownMatches) {
    $candidate = $match.Groups[1].Value.Trim()
    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
      $refs.Add($candidate)
    }
  }

  return @($refs | Select-Object -Unique)
}

function Resolve-AssetPath {
  param(
    [string]$Reference,
    [string]$NoteDirectory,
    [System.IO.FileInfo[]]$VaultFiles
  )

  if ([string]::IsNullOrWhiteSpace($Reference)) {
    return $null
  }

  if ([System.IO.Path]::IsPathRooted($Reference) -and (Test-Path -LiteralPath $Reference)) {
    return (Get-Item -LiteralPath $Reference).FullName
  }

  $relativeCandidate = Join-Path $NoteDirectory $Reference
  if (Test-Path -LiteralPath $relativeCandidate) {
    return (Get-Item -LiteralPath $relativeCandidate).FullName
  }

  $targetName = [System.IO.Path]::GetFileName($Reference)
  $found = $VaultFiles | Where-Object { $_.Name -eq $targetName } | Select-Object -First 1
  if ($found) {
    return $found.FullName
  }

  return $null
}

function Import-EmbeddedAssets {
  param(
    [string]$NotePath,
    [string]$RawText,
    [System.IO.FileInfo[]]$VaultFiles,
    [string]$VaultRootPath
  )

  $noteDirectory = Split-Path -Parent $NotePath
  $refs = Get-EmbeddedAssetRefs -RawText $RawText
  $assets = New-Object System.Collections.Generic.List[object]

  foreach ($reference in $refs) {
    $resolved = Resolve-AssetPath -Reference $reference -NoteDirectory $noteDirectory -VaultFiles $VaultFiles
    if (-not $resolved) {
      continue
    }

    $extension = [System.IO.Path]::GetExtension($resolved)
    if (@('.png', '.jpg', '.jpeg', '.webp', '.gif') -notcontains $extension.ToLowerInvariant()) {
      continue
    }

    $relativeAssetPath = Get-RelativeVaultPath -Path $resolved -Root $VaultRootPath
    $destination = Join-Path $VaultAssetRoot $relativeAssetPath.Replace('/', '\\')
    $destinationDirectory = Split-Path -Parent $destination
    if (-not (Test-Path -LiteralPath $destinationDirectory)) {
      New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    }

    Copy-Item -LiteralPath $resolved -Destination $destination -Force
    $assets.Add([ordered]@{
      sourcePath = $relativeAssetPath
      webPath = Get-WebAssetPath -AbsolutePath $destination
      name = [System.IO.Path]::GetFileNameWithoutExtension($resolved)
      extension = $extension
    })
  }

  return @($assets | Sort-Object webPath -Unique)
}

function New-NoteRecord {
  param(
    [System.IO.FileInfo]$Note,
    [System.IO.FileInfo[]]$VaultFiles,
    [string]$VaultRootPath
  )

  $rawText = Get-Content -LiteralPath $Note.FullName -Raw -Encoding UTF8
  $text = Get-NoteText -Path $Note.FullName -RawText $rawText
  if (-not $text) {
    return $null
  }

  $assets = Import-EmbeddedAssets -NotePath $Note.FullName -RawText $rawText -VaultFiles $VaultFiles -VaultRootPath $VaultRootPath
  return [ordered]@{
    title = [System.IO.Path]::GetFileNameWithoutExtension($Note.Name)
    relativePath = Get-RelativeVaultPath -Path $Note.FullName -Root $VaultRootPath
    excerpt = Get-Excerpt -Text $text
    body = $text
    assets = $assets
  }
}

function Find-PreferredNote {
  param(
    [System.IO.FileInfo[]]$Notes,
    [string[]]$PreferredNames,
    [System.IO.FileInfo[]]$VaultFiles,
    [string]$VaultRootPath
  )

  foreach ($preferred in $PreferredNames) {
    $found = $Notes | Where-Object { $_.Name -eq $preferred } | Select-Object -First 1
    if ($found) {
      $record = New-NoteRecord -Note $found -VaultFiles $VaultFiles -VaultRootPath $VaultRootPath
      if ($record) {
        return $record
      }
    }
  }

  return $null
}

function Get-NotePatternScore {
  param(
    [System.IO.FileInfo]$Note,
    [string[]]$Patterns
  )

  $score = 0
  $name = $Note.Name.ToLowerInvariant()
  $path = $Note.FullName.ToLowerInvariant()

  foreach ($pattern in $Patterns) {
    if ([string]::IsNullOrWhiteSpace($pattern)) {
      continue
    }

    $probe = $pattern.ToLowerInvariant()
    if ($name -like "*$probe*") {
      $score += 8
      continue
    }

    if ($path -like "*$probe*") {
      $score += 4
    }
  }

  return $score
}

function Get-RecordPatternScore {
  param(
    [object]$Record,
    [string[]]$Patterns
  )

  if ($null -eq $Record) {
    return 0
  }

  $score = 0
  $title = [string]$Record.title
  $relativePath = [string]$Record.relativePath
  $excerpt = [string]$Record.excerpt

  foreach ($pattern in $Patterns) {
    if ([string]::IsNullOrWhiteSpace($pattern)) {
      continue
    }

    $probe = [regex]::Escape($pattern)
    if ($title -match $probe) {
      $score += 8
    }
    if ($relativePath -match $probe) {
      $score += 6
    }
    if ($excerpt -match $probe) {
      $score += 2
    }
  }

  return $score
}

function Merge-UniqueNotes {
  param(
    [object[]]$Primary,
    [object[]]$Secondary
  )

  $merged = New-Object System.Collections.ArrayList
  $seen = @{}
  $combined = @()
  $combined += @($Primary)
  $combined += @($Secondary)

  foreach ($note in $combined) {
    if ($null -eq $note) {
      continue
    }

    $key = [string]$note.relativePath
    if ([string]::IsNullOrWhiteSpace($key)) {
      $key = [string]$note.title
    }

    if ([string]::IsNullOrWhiteSpace($key)) {
      continue
    }

    if (-not $seen.ContainsKey($key)) {
      $seen[$key] = $true
      [void]$merged.Add($note)
    }
  }

  return @($merged.ToArray())
}

function Select-TopChannelNotes {
  param(
    [object[]]$Notes,
    [string[]]$Patterns,
    [object]$Preferred = $null,
    [int]$Limit = 5
  )

  $source = Merge-UniqueNotes -Primary @($Preferred) -Secondary @($Notes)
  $ranked = New-Object System.Collections.Generic.List[object]

  foreach ($note in $source) {
    $score = Get-RecordPatternScore -Record $note -Patterns $Patterns
    if ($null -ne $Preferred) {
      if ($note.relativePath -eq $Preferred.relativePath -or $note.title -eq $Preferred.title) {
        $score += 100
      }
    }

    $ranked.Add([ordered]@{
      note = $note
      score = $score
      title = [string]$note.title
      relativePath = [string]$note.relativePath
    })
  }

  return @($ranked |
    Sort-Object @{Expression = { $_.score }; Descending = $true }, @{Expression = { $_.title }; Descending = $false } |
    Select-Object -First $Limit |
    ForEach-Object { $_.note })
}

if (-not (Test-Path -LiteralPath $VaultRoot)) {
  throw "Vault root not found: $VaultRoot"
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

if (-not (Test-Path -LiteralPath $VaultAssetRoot)) {
  New-Item -ItemType Directory -Path $VaultAssetRoot -Force | Out-Null
}

$allNotes = Get-ChildItem -LiteralPath $VaultRoot -Recurse -File -Filter *.md
$allVaultFiles = Get-ChildItem -LiteralPath $VaultRoot -Recurse -File

$preferredSpecies = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "The Canopy Gatekeepers - One Species, Four Journeys.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
$preferredWeatherFog = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "Field Weather Mist Drift.md",
  "Garden Weather.md",
  "Mist-Aligned Role Activation.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
$preferredWeatherExpand = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "Garden Weather.md",
  "Signal Bloom.md",
  "Signal Field.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
$preferredWeatherCollapse = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "Pressure Weather.md",
  "Collapse Convergence Event - Sprite Jet Funnel.md",
  "Collapse Engine.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
$preferredWeatherSoil = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "Compost Engine.md",
  "Garden Weather.md",
  "Field Memory in suspended form.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
$preferredChamberPrimary = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "The One Who Traversed the Maze of Steps.md",
  "Chamber Of Resonant Stillness.md",
  "The Choice Matrix Model.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
$preferredChamberStill = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "Chamber Of Resonant Stillness.md",
  "stairs.md",
  "Return Path Index.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
$preferredActor = Find-PreferredNote -Notes $allNotes -PreferredNames @(
  "Actor Systems.md",
  "Actor Expressions.md",
  "theghost.actor-metrics.md"
) -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot

$categoryRules = @{
  species = @(
    "The Canopy Gatekeepers - One Species, Four Journeys.md",
    "04 - Species",
    "Gatekeepers",
    "Drift Creatures.md",
    "The Canopy Gatekeepers",
    "Fib Flower",
    "Cross-Flower Migration",
    "Pinwheel Realms"
  )
  weather = @(
    "Garden Weather.md",
    "Pressure Weather.md",
    "Field Weather Mist Drift.md",
    "Weather",
    "Mist",
    "Signal Bloom.md",
    "Compost Engine.md",
    "Drift",
    "Collapse",
    "Pressure",
    "Resonance"
  )
  chambers = @(
    "The One Who Traversed the Maze of Steps.md",
    "stairs.md",
    "The Choice Matrix Model.md",
    "Chamber",
    "Return Path Index.md",
    "Gate State.md",
    "Crown Structure",
    "Seam Structure",
    "Orbit",
    "Capture"
  )
  actors = @(
    "Actor Systems.md",
    "Actor Expressions.md",
    "06 - Actors",
    "theghost.actor-",
    "Gatekeeper",
    "Anchor",
    "Resonance",
    "Pressure",
    "Drift"
  )
  geometry = @(
    "Fib Flower",
    "Crown Structure",
    "Seam Structure",
    "Cluster Geometry",
    "Orbit Mechanics",
    "Cross-Flower Migration",
    "Root Machine"
  )
  drift = @(
    "Drift",
    "Cycle-Drift",
    "Drift Physics",
    "Drift Map",
    "Drift Layer",
    "Drift Fields"
  )
  collapse = @(
    "Collapse",
    "Collapse Physics",
    "Collapse Ecology",
    "Collapse Weather",
    "Fragmentation",
    "Reformation"
  )
  pressure = @(
    "Pressure",
    "Threshold Pressure",
    "Pressure Weather",
    "Anchor Tension",
    "Cohesion Under Pressure",
    "Invariant"
  )
  resonance = @(
    "Resonance",
    "Resonance Overview",
    "Cycle-Resonance",
    "Echo",
    "Signal"
  )
}

$categorized = [ordered]@{}
$maxCategoryNotes = 120
foreach ($category in $categoryRules.Keys) {
  $noteResults = New-Object System.Collections.Generic.List[object]
  $scoredResults = New-Object System.Collections.Generic.List[object]

  foreach ($note in $allNotes) {
    $score = Get-NotePatternScore -Note $note -Patterns $categoryRules[$category]
    if ($score -le 0) {
      continue
    }

    $scoredResults.Add([ordered]@{
      note = $note
      score = $score
    })
  }

  $ranked = @($scoredResults | Sort-Object @{Expression = { $_.score }; Descending = $true }, @{Expression = { $_.note.FullName }; Descending = $false } | Select-Object -First $maxCategoryNotes)

  foreach ($entry in $ranked) {
    $note = $entry.note
    $record = New-NoteRecord -Note $note -VaultFiles $allVaultFiles -VaultRootPath $VaultRoot
    if (-not $record) {
      continue
    }

    $noteResults.Add($record)
  }

  $categorized[$category] = @($noteResults | Sort-Object title)
}

$channelTopN = 5
$speciesFogPool = Select-TopChannelNotes -Notes $categorized.species -Preferred $preferredSpecies -Patterns @("species", "gatekeepers", "fib flower", "anchor", "resonance", "drift") -Limit $channelTopN
$speciesExpandPool = Select-TopChannelNotes -Notes $categorized.species -Preferred $preferredSpecies -Patterns @("species", "canopy", "orbit", "resonance", "drift") -Limit $channelTopN
$speciesCollapsePool = Select-TopChannelNotes -Notes $categorized.species -Preferred $preferredSpecies -Patterns @("species", "collapse", "pressure", "capture", "migration") -Limit $channelTopN
$speciesSoilPool = Select-TopChannelNotes -Notes $categorized.species -Preferred $preferredSpecies -Patterns @("species", "soil", "anchor", "reformation", "resonance") -Limit $channelTopN

$weatherFogPool = Select-TopChannelNotes -Notes $categorized.weather -Preferred $preferredWeatherFog -Patterns @("mist", "weather", "drift", "invariant", "cohesion") -Limit $channelTopN
$weatherExpandPool = Select-TopChannelNotes -Notes $categorized.weather -Preferred $preferredWeatherExpand -Patterns @("garden", "weather", "bloom", "signal", "resonance", "orbit") -Limit $channelTopN
$weatherCollapsePool = Select-TopChannelNotes -Notes $categorized.weather -Preferred $preferredWeatherCollapse -Patterns @("pressure", "collapse", "weather", "storm", "brittle", "shear") -Limit $channelTopN
$weatherSoilPool = Select-TopChannelNotes -Notes $categorized.weather -Preferred $preferredWeatherSoil -Patterns @("soil", "compost", "memory", "anchor", "reformation") -Limit $channelTopN

$chambersFogPool = Select-TopChannelNotes -Notes $categorized.chambers -Preferred $preferredChamberStill -Patterns @("chamber", "stillness", "mist", "resonance", "quiet") -Limit $channelTopN
$chambersExpandPool = Select-TopChannelNotes -Notes $categorized.chambers -Preferred $preferredChamberPrimary -Patterns @("stairs", "maze", "expand", "signal", "orbit") -Limit $channelTopN
$chambersCollapsePool = Select-TopChannelNotes -Notes $categorized.chambers -Preferred $preferredChamberPrimary -Patterns @("collapse", "threshold", "fracture", "pressure", "maze") -Limit $channelTopN
$chambersSoilPool = Select-TopChannelNotes -Notes $categorized.chambers -Preferred $preferredChamberStill -Patterns @("chamber", "soil", "return", "anchor", "reformation") -Limit $channelTopN

$actorsFogPool = Select-TopChannelNotes -Notes $categorized.actors -Preferred $preferredActor -Patterns @("actor", "whisper", "mist", "drift", "resonance") -Limit $channelTopN
$actorsExpandPool = Select-TopChannelNotes -Notes $categorized.actors -Preferred $preferredActor -Patterns @("actor", "lumen", "signal", "orbit", "resonance") -Limit $channelTopN
$actorsCollapsePool = Select-TopChannelNotes -Notes $categorized.actors -Preferred $preferredActor -Patterns @("actor", "collapse", "ruin", "pressure", "capture") -Limit $channelTopN
$actorsSoilPool = Select-TopChannelNotes -Notes $categorized.actors -Preferred $preferredActor -Patterns @("actor", "archive", "anchor", "soil", "memory") -Limit $channelTopN

$routeEthosPool = Select-TopChannelNotes -Notes $categorized.chambers -Preferred $preferredChamberStill -Patterns @("chamber", "stillness", "ethos", "anchor", "cohesion") -Limit $channelTopN
$routeMythologyPool = Select-TopChannelNotes -Notes $categorized.weather -Preferred $preferredWeatherCollapse -Patterns @("pressure", "collapse", "myth", "weather", "resonance") -Limit $channelTopN
$routeWheelPool = Select-TopChannelNotes -Notes $categorized.weather -Preferred $preferredWeatherFog -Patterns @("drift", "wheel", "weather", "mist", "cycle") -Limit $channelTopN
$routeHousegardenPool = Select-TopChannelNotes -Notes $categorized.weather -Preferred $preferredWeatherSoil -Patterns @("compost", "soil", "house", "garden", "memory") -Limit $channelTopN
$routeInvitationPool = Select-TopChannelNotes -Notes $categorized.species -Preferred $preferredSpecies -Patterns @("species", "invitation", "gatekeepers", "threshold", "capture") -Limit $channelTopN

$archiveBindings = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  vaultRoot = $VaultRoot
  species = [ordered]@{
    fog = [ordered]@{ spirit = "The Deer"; note = (Select-Note -Notes $speciesFogPool); notePool = $speciesFogPool }
    expand = [ordered]@{ spirit = "The Whale"; note = (Select-Note -Notes $speciesExpandPool); notePool = $speciesExpandPool }
    collapse = [ordered]@{ spirit = "The Wolf"; note = (Select-Note -Notes $speciesCollapsePool); notePool = $speciesCollapsePool }
    soil = [ordered]@{ spirit = "The Bear"; note = (Select-Note -Notes $speciesSoilPool); notePool = $speciesSoilPool }
  }
  weather = [ordered]@{
    fog = [ordered]@{ note = (Select-Note -Notes $weatherFogPool); notePool = $weatherFogPool }
    expand = [ordered]@{ note = (Select-Note -Notes $weatherExpandPool); notePool = $weatherExpandPool }
    collapse = [ordered]@{ note = (Select-Note -Notes $weatherCollapsePool); notePool = $weatherCollapsePool }
    soil = [ordered]@{ note = (Select-Note -Notes $weatherSoilPool); notePool = $weatherSoilPool }
  }
  chambers = [ordered]@{
    fog = [ordered]@{ note = (Select-Note -Notes $chambersFogPool); notePool = $chambersFogPool }
    expand = [ordered]@{ note = (Select-Note -Notes $chambersExpandPool); notePool = $chambersExpandPool }
    collapse = [ordered]@{ note = (Select-Note -Notes $chambersCollapsePool); notePool = $chambersCollapsePool }
    soil = [ordered]@{ note = (Select-Note -Notes $chambersSoilPool); notePool = $chambersSoilPool }
  }
  actors = [ordered]@{
    fog = [ordered]@{ guardian = "The Whisperer"; note = (Select-Note -Notes $actorsFogPool); notePool = $actorsFogPool }
    expand = [ordered]@{ guardian = "The Lumen Keeper"; note = (Select-Note -Notes $actorsExpandPool); notePool = $actorsExpandPool }
    collapse = [ordered]@{ guardian = "The Architect of Ruin"; note = (Select-Note -Notes $actorsCollapsePool); notePool = $actorsCollapsePool }
    soil = [ordered]@{ guardian = "The Archivist"; note = (Select-Note -Notes $actorsSoilPool); notePool = $actorsSoilPool }
  }
  routes = [ordered]@{
    "ethos-gate" = [ordered]@{ page = "ethos"; note = (Select-Note -Notes $routeEthosPool); notePool = $routeEthosPool; lore = (Get-NoteExcerptValue -Note (Select-Note -Notes $routeEthosPool)) }
    "mythology-gate" = [ordered]@{ page = "mythology"; note = (Select-Note -Notes $routeMythologyPool); notePool = $routeMythologyPool; lore = (Get-NoteExcerptValue -Note (Select-Note -Notes $routeMythologyPool)) }
    "wheel-gate" = [ordered]@{ page = "learningwheel"; note = (Select-Note -Notes $routeWheelPool); notePool = $routeWheelPool; lore = (Get-NoteExcerptValue -Note (Select-Note -Notes $routeWheelPool)) }
    "housegarden-gate" = [ordered]@{ page = "housegarden"; note = (Select-Note -Notes $routeHousegardenPool); notePool = $routeHousegardenPool; lore = (Get-NoteExcerptValue -Note (Select-Note -Notes $routeHousegardenPool)) }
    "invitation-gate" = [ordered]@{ page = "invitation"; note = (Select-Note -Notes $routeInvitationPool); notePool = $routeInvitationPool; lore = (Get-NoteExcerptValue -Note (Select-Note -Notes $routeInvitationPool)) }
  }
}

$vaultIndex = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  vaultRoot = $VaultRoot
  categories = $categorized
}

$vaultManifest = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  vaultRoot = $VaultRoot
  importedAssetsRoot = "assets/vault"
  archive = $archiveBindings
}

$indexPath = Join-Path $OutputDir "vault-index.json"
$archivePath = Join-Path $OutputDir "vault-archive.json"

$vaultIndex | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $indexPath -Encoding UTF8
$vaultManifest | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $archivePath -Encoding UTF8

Write-Host "Generated: $indexPath"
Write-Host "Generated: $archivePath"
