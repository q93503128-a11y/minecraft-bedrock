$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$portraitPath = Join-Path $projectRoot 'assets\source\wayfinder-portrait.png'
$textureRoot = Join-Path $projectRoot 'RP\textures\ui\status-window'
$packIconPath = Join-Path $projectRoot 'RP\pack_icon.png'
New-Item -ItemType Directory -Path $textureRoot -Force | Out-Null

$script:ink = [System.Drawing.Color]::FromArgb(255, 12, 17, 27)
$script:panel = [System.Drawing.Color]::FromArgb(255, 21, 29, 42)
$script:gold = [System.Drawing.Color]::FromArgb(255, 208, 172, 99)
$script:paleGold = [System.Drawing.Color]::FromArgb(255, 241, 215, 159)
$script:teal = [System.Drawing.Color]::FromArgb(255, 79, 201, 211)
$script:muted = [System.Drawing.Color]::FromArgb(255, 143, 157, 174)

function New-Canvas([int]$Width, [int]$Height) {
    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return @($bitmap, $graphics)
}

function New-ChamferPath([int]$X, [int]$Y, [int]$Width, [int]$Height, [int]$Cut) {
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $points = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new($X + $Cut, $Y),
        [System.Drawing.Point]::new($X + $Width - $Cut, $Y),
        [System.Drawing.Point]::new($X + $Width, $Y + $Cut),
        [System.Drawing.Point]::new($X + $Width, $Y + $Height - $Cut),
        [System.Drawing.Point]::new($X + $Width - $Cut, $Y + $Height),
        [System.Drawing.Point]::new($X + $Cut, $Y + $Height),
        [System.Drawing.Point]::new($X, $Y + $Height - $Cut),
        [System.Drawing.Point]::new($X, $Y + $Cut)
    )
    $path.AddPolygon($points)
    return $path
}

function Draw-Diamond([System.Drawing.Graphics]$Graphics, [int]$CenterX, [int]$CenterY, [int]$Radius, [System.Drawing.Color]$Color) {
    $points = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new($CenterX, $CenterY - $Radius),
        [System.Drawing.Point]::new($CenterX + $Radius, $CenterY),
        [System.Drawing.Point]::new($CenterX, $CenterY + $Radius),
        [System.Drawing.Point]::new($CenterX - $Radius, $CenterY)
    )
    $brush = [System.Drawing.SolidBrush]::new($Color)
    $Graphics.FillPolygon($brush, $points)
    $brush.Dispose()
}

function Draw-Icon([System.Drawing.Graphics]$Graphics, [string]$Kind, [int]$X, [int]$Y, [int]$Size, [System.Drawing.Color]$Accent) {
    $pen = [System.Drawing.Pen]::new($Accent, [Math]::Max(3, [int]($Size / 25)))
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $fine = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(180, $Accent), [Math]::Max(1, [int]($Size / 42)))
    $cx = $X + [int]($Size / 2)
    $cy = $Y + [int]($Size / 2)
    $s = $Size

    switch ($Kind) {
        'sword' {
            $Graphics.DrawLine($pen, $X + 18, $Y + $s - 20, $X + $s - 17, $Y + 16)
            $Graphics.DrawLine($fine, $X + 18, $Y + $s - 20, $X + $s - 17, $Y + 16)
            $Graphics.DrawLine($pen, $X + 19, $Y + [int]($s * 0.55), $X + [int]($s * 0.57), $Y + [int]($s * 0.82))
            $Graphics.DrawLine($pen, $X + 17, $Y + $s - 18, $X + 9, $Y + $s - 9)
            Draw-Diamond $Graphics ($X + $s - 18) ($Y + 17) 8 $script:paleGold
        }
        'shield' {
            $points = [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($cx, $Y + 10),
                [System.Drawing.Point]::new($X + $s - 13, $Y + 22),
                [System.Drawing.Point]::new($X + $s - 19, $Y + [int]($s * 0.65)),
                [System.Drawing.Point]::new($cx, $Y + $s - 9),
                [System.Drawing.Point]::new($X + 19, $Y + [int]($s * 0.65)),
                [System.Drawing.Point]::new($X + 13, $Y + 22)
            )
            $Graphics.DrawPolygon($pen, $points)
            $Graphics.DrawLine($fine, $cx, $Y + 18, $cx, $Y + $s - 20)
            $Graphics.DrawLine($fine, $X + 22, $Y + 33, $X + $s - 22, $Y + 33)
        }
        'helm' {
            $Graphics.DrawArc($pen, $X + 14, $Y + 9, $s - 28, $s - 17, 187, 166)
            $Graphics.DrawLine($pen, $X + 17, $cy + 1, $X + $s - 17, $cy + 1)
            $Graphics.DrawLine($pen, $cx, $Y + 16, $cx, $cy + 5)
            $Graphics.DrawLine($fine, $X + 25, $cy + 14, $X + $s - 25, $cy + 14)
        }
        'armor' {
            $points = [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($X + 19, $Y + 19),
                [System.Drawing.Point]::new($X + 33, $Y + 11),
                [System.Drawing.Point]::new($cx, $Y + 22),
                [System.Drawing.Point]::new($X + $s - 33, $Y + 11),
                [System.Drawing.Point]::new($X + $s - 19, $Y + 19),
                [System.Drawing.Point]::new($X + $s - 25, $Y + $s - 14),
                [System.Drawing.Point]::new($X + 25, $Y + $s - 14)
            )
            $Graphics.DrawPolygon($pen, $points)
            $Graphics.DrawLine($fine, $cx, $Y + 22, $cx, $Y + $s - 17)
            $Graphics.DrawLine($fine, $X + 27, $Y + 42, $X + $s - 27, $Y + 42)
        }
        'gloves' {
            $Graphics.DrawArc($pen, $X + 24, $Y + 31, $s - 48, $s - 38, 190, 160)
            for ($finger = 0; $finger -lt 4; $finger++) {
                $fx = $X + 24 + $finger * [int](($s - 48) / 3)
                $Graphics.DrawLine($pen, $fx, $Y + 42, $fx, $Y + 15 + ($finger % 2) * 4)
            }
            $Graphics.DrawLine($fine, $X + 29, $cy + 7, $X + $s - 29, $cy + 7)
        }
        'boots' {
            $points = [System.Drawing.Point[]]@(
                [System.Drawing.Point]::new($X + 27, $Y + 11),
                [System.Drawing.Point]::new($X + [int]($s * 0.65), $Y + 11),
                [System.Drawing.Point]::new($X + [int]($s * 0.61), $Y + [int]($s * 0.58)),
                [System.Drawing.Point]::new($X + $s - 12, $Y + [int]($s * 0.72)),
                [System.Drawing.Point]::new($X + $s - 17, $Y + $s - 12),
                [System.Drawing.Point]::new($X + 16, $Y + $s - 12),
                [System.Drawing.Point]::new($X + 16, $Y + [int]($s * 0.75)),
                [System.Drawing.Point]::new($X + 28, $Y + [int]($s * 0.68))
            )
            $Graphics.DrawPolygon($pen, $points)
            $Graphics.DrawLine($fine, $X + 27, $Y + [int]($s * 0.53), $X + [int]($s * 0.62), $Y + [int]($s * 0.53))
        }
        'ring' {
            $Graphics.DrawEllipse($pen, $X + 16, $Y + 24, $s - 32, $s - 30)
            Draw-Diamond $Graphics $cx ($Y + 16) ([int]($s / 8)) $script:paleGold
            $Graphics.DrawLine($fine, $X + 23, $Y + [int]($s * 0.72), $X + $s - 23, $Y + [int]($s * 0.72))
        }
        'star' {
            $outer = [int]($s * 0.39)
            $inner = [int]($s * 0.15)
            $points = [System.Collections.Generic.List[System.Drawing.Point]]::new()
            for ($pointIndex = 0; $pointIndex -lt 10; $pointIndex++) {
                $angle = (-[Math]::PI / 2) + ($pointIndex * [Math]::PI / 5)
                $radius = if (($pointIndex % 2) -eq 0) { $outer } else { $inner }
                $points.Add([System.Drawing.Point]::new($cx + [int]([Math]::Cos($angle) * $radius), $cy + [int]([Math]::Sin($angle) * $radius)))
            }
            $Graphics.DrawPolygon($pen, $points.ToArray())
            $Graphics.DrawLine($fine, $cx, $Y + 6, $cx, $Y + $s - 6)
        }
        default {
            $Graphics.DrawEllipse($pen, $X + 14, $Y + 14, $s - 28, $s - 28)
            Draw-Diamond $Graphics $cx $cy ([int]($s / 4)) $Accent
        }
    }

    $pen.Dispose()
    $fine.Dispose()
}

function Save-Bitmap([System.Drawing.Bitmap]$Bitmap, [string]$Path) {
    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $Bitmap.Dispose()
}

# Wide dossier banner: brass frame, cool teal edge light, and the original portrait.
$parts = New-Canvas 960 300
$banner = $parts[0]
$g = $parts[1]
$background = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(0, 0, 960, 300),
    [System.Drawing.Color]::FromArgb(255, 10, 15, 24),
    [System.Drawing.Color]::FromArgb(255, 36, 51, 65),
    0.0
)
$g.FillRectangle($background, 0, 0, 960, 300)
$background.Dispose()

$random = [System.Random]::new(1611)
for ($i = 0; $i -lt 180; $i++) {
    $alpha = $random.Next(12, 39)
    $speck = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($alpha, 195, 211, 224))
    $g.FillEllipse($speck, $random.Next(18, 942), $random.Next(18, 282), $random.Next(1, 4), $random.Next(1, 4))
    $speck.Dispose()
}

$frame = New-ChamferPath 12 12 936 276 18
$frameFill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(24, 211, 176, 101))
$framePen = [System.Drawing.Pen]::new($script:gold, 2.0)
$g.FillPath($frameFill, $frame)
$g.DrawPath($framePen, $frame)
$frameFill.Dispose()
$framePen.Dispose()
$frame.Dispose()

$innerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(90, 231, 215, 176), 1.0)
$g.DrawLine($innerPen, 32, 31, 603, 31)
$g.DrawLine($innerPen, 32, 269, 603, 269)
$innerPen.Dispose()

$portrait = [System.Drawing.Bitmap]::FromFile($portraitPath)
$portraitWidth = 350
$portraitX = 583
$portraitY = -47
$portraitHeight = 350
$g.DrawImage($portrait, $portraitX, $portraitY, $portraitWidth, $portraitHeight)
$portrait.Dispose()

$shade = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(560, 0, 170, 300),
    [System.Drawing.Color]::FromArgb(250, 14, 19, 29),
    [System.Drawing.Color]::FromArgb(0, 14, 19, 29),
    0.0
)
$g.FillRectangle($shade, 560, 0, 170, 300)
$shade.Dispose()

$serif = [System.Drawing.Font]::new('Georgia', 35, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$sans = [System.Drawing.Font]::new('Segoe UI', 17, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$micro = [System.Drawing.Font]::new('Segoe UI', 13, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$goldBrush = [System.Drawing.SolidBrush]::new($script:paleGold)
$whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 228, 234, 239))
$mutedBrush = [System.Drawing.SolidBrush]::new($script:muted)
$tealBrush = [System.Drawing.SolidBrush]::new($script:teal)
$g.DrawString('DUSKVEIL', $serif, $goldBrush, 48, 62)
$g.DrawString('FIELD ARCHIVE   /   WAYFINDER', $micro, $tealBrush, 52, 116)
$g.DrawString('Beyond the last lantern, every path has a name.', $sans, $whiteBrush, 52, 162)
$g.DrawString('CHRONICLE  /  NO. 038', $micro, $mutedBrush, 52, 226)

$g.DrawLine([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(160, 208, 172, 99), 1.0), 52, 208, 430, 208)
Draw-Diamond $g 458 208 5 $script:gold
$g.DrawLine([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(150, 79, 201, 211), 1.0), 481, 208, 578, 208)
$g.Dispose()
Save-Bitmap $banner (Join-Path $textureRoot 'banner.png')
$serif.Dispose()
$sans.Dispose()
$micro.Dispose()
$goldBrush.Dispose()
$whiteBrush.Dispose()
$mutedBrush.Dispose()
$tealBrush.Dispose()

# The six gear slots echo a paper doll layout without copying a game's arrangement or icons.
$parts = New-Canvas 960 350
$grid = $parts[0]
$g = $parts[1]
$gridBackground = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(0, 0, 960, 350),
    [System.Drawing.Color]::FromArgb(255, 13, 18, 27),
    [System.Drawing.Color]::FromArgb(255, 26, 38, 50),
    90.0
)
$g.FillRectangle($gridBackground, 0, 0, 960, 350)
$gridBackground.Dispose()
$outer = New-ChamferPath 8 8 944 334 16
$outerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210, 208, 172, 99), 2.0)
$g.DrawPath($outerPen, $outer)
$outer.Dispose()
$outerPen.Dispose()

$slots = @(
    @{ Kind = 'helm'; Label = 'HEAD'; X = 22; Y = 22; Accent = $script:gold },
    @{ Kind = 'armor'; Label = 'CHEST'; X = 336; Y = 22; Accent = $script:teal },
    @{ Kind = 'gloves'; Label = 'GLOVES'; X = 650; Y = 22; Accent = $script:gold },
    @{ Kind = 'boots'; Label = 'BOOTS'; X = 22; Y = 185; Accent = $script:teal },
    @{ Kind = 'sword'; Label = 'MAIN HAND'; X = 336; Y = 185; Accent = $script:paleGold },
    @{ Kind = 'ring'; Label = 'RELIC'; X = 650; Y = 185; Accent = $script:teal }
)
$slotFont = [System.Drawing.Font]::new('Segoe UI', 19, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$slotNoteFont = [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$slotText = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 221, 230, 237))
$slotNote = [System.Drawing.SolidBrush]::new($script:muted)
foreach ($slot in $slots) {
    $card = New-ChamferPath $slot.X $slot.Y 288 143 12
    $cardBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 17, 24, 35))
    $cardPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(175, $slot.Accent.R, $slot.Accent.G, $slot.Accent.B), 1.4)
    $g.FillPath($cardBrush, $card)
    $g.DrawPath($cardPen, $card)
    $cardBrush.Dispose()
    $cardPen.Dispose()
    $card.Dispose()
    Draw-Icon $g $slot.Kind ($slot.X + 20) ($slot.Y + 30) 80 $slot.Accent
    $g.DrawString($slot.Label, $slotFont, $slotText, $slot.X + 118, $slot.Y + 45)
    $g.DrawString('EQUIPPED  /  SAMPLE', $slotNoteFont, $slotNote, $slot.X + 119, $slot.Y + 77)
    Draw-Diamond $g ($slot.X + 264) ($slot.Y + 24) 5 $slot.Accent
}
$g.Dispose()
Save-Bitmap $grid (Join-Path $textureRoot 'equipment-grid.png')
$slotFont.Dispose()
$slotNoteFont.Dispose()
$slotText.Dispose()
$slotNote.Dispose()

# Small button emblems share the same metal-and-teal language.
$buttonIcons = @(
    @{ Name = 'icon-overview'; Kind = 'star'; Accent = $script:gold },
    @{ Name = 'icon-equipment'; Kind = 'shield'; Accent = $script:teal },
    @{ Name = 'icon-weapon'; Kind = 'sword'; Accent = $script:paleGold },
    @{ Name = 'icon-armor'; Kind = 'armor'; Accent = $script:gold },
    @{ Name = 'icon-relic'; Kind = 'ring'; Accent = $script:teal }
)
foreach ($entry in $buttonIcons) {
    $parts = New-Canvas 96 96
    $iconBitmap = $parts[0]
    $g = $parts[1]
    $disc = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(228, 17, 25, 36))
    $rim = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(200, $entry.Accent.R, $entry.Accent.G, $entry.Accent.B), 2.0)
    $g.FillEllipse($disc, 5, 5, 86, 86)
    $g.DrawEllipse($rim, 5, 5, 86, 86)
    $disc.Dispose()
    $rim.Dispose()
    Draw-Icon $g $entry.Kind 16 16 64 $entry.Accent
    $g.Dispose()
    Save-Bitmap $iconBitmap (Join-Path $textureRoot ($entry.Name + '.png'))
}

# A compact pack mark: a split star behind a teal wayfinder needle.
$parts = New-Canvas 256 256
$mark = $parts[0]
$g = $parts[1]
$discBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(12, 12, 232, 232),
    [System.Drawing.Color]::FromArgb(255, 12, 18, 29),
    [System.Drawing.Color]::FromArgb(255, 43, 56, 68),
    45.0
)
$g.FillEllipse($discBrush, 12, 12, 232, 232)
$discBrush.Dispose()
$discPen = [System.Drawing.Pen]::new($script:gold, 5.0)
$g.DrawEllipse($discPen, 16, 16, 224, 224)
$discPen.Dispose()
Draw-Icon $g 'star' 58 58 140 $script:gold
$needle = [System.Drawing.Pen]::new($script:teal, 7.0)
$g.DrawLine($needle, 128, 40, 128, 216)
$g.DrawLine($needle, 60, 128, 196, 128)
$needle.Dispose()
Draw-Diamond $g 128 128 18 $script:paleGold
$g.Dispose()
Save-Bitmap $mark $packIconPath

Write-Output "Generated original UI textures under $textureRoot"
Write-Output "Generated pack icon at $packIconPath"
