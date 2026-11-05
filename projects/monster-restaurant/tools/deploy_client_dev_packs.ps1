param(
    [string]$ComMojangPath = (Join-Path $env:APPDATA 'Minecraft Bedrock\users\shared\games\com.mojang')
)

$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$destinations = @(
    @{ Source = Join-Path $projectPath 'BP'; Folder = 'development_behavior_packs\MonsterRestaurant_BP'; Uuid = '5c9831a9-a01f-4d62-94dc-4678bb512a38' },
    @{ Source = Join-Path $projectPath 'RP'; Folder = 'development_resource_packs\MonsterRestaurant_RP'; Uuid = 'a39f9b7e-b5d8-48bb-9567-7ac26de9bd8e' }
)

foreach ($entry in $destinations) {
    $target = Join-Path $ComMojangPath $entry.Folder
    $manifestPath = Join-Path $target 'manifest.json'
    if (Test-Path -LiteralPath $target) {
        if (-not (Test-Path -LiteralPath $manifestPath)) {
            throw "Refusing to replace a development pack without a manifest: $target"
        }
        $existingUuid = (Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json).header.uuid
        if ($existingUuid -ne $entry.Uuid) {
            throw "Refusing to overwrite a pack with a different UUID at $target"
        }
    }
}

foreach ($entry in $destinations) {
    $target = Join-Path $ComMojangPath $entry.Folder
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Get-ChildItem -LiteralPath $entry.Source -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force
    }
    Write-Output "DEPLOYED $($entry.Folder)"
}
