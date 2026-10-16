# ShoSVG

I made ShoSVG for one simple job: copy SVG artwork from Figma and bring it into After Effects as editable shape layers—without paying for a larger transfer plugin.

Overlord by Battle Axe is a paid tool with a broader Figma-to-After-Effects workflow. ShoSVG is my free, focused alternative for clipboard SVG: copy your artwork as SVG, click ShoSVG in After Effects, and keep working with vector shapes. It does not try to replace all of Overlord’s features.

[See Overlord’s official site](https://battleaxe.co/overlord)

## What ShoSVG does

- Import SVG markup copied from Figma or a web page.
- Create editable After Effects shape layers.
- Choose one merged layer, or hold **Alt/Option** or **Shift** while clicking to create separate layers in SVG paint order.
- Use ShoSVG for free under the MIT License—no subscription or license key.

On Windows, ShoSVG can also read SVG copied from a browser as an HTML element. Copying a screenshot or raster image will not create editable vector paths.

## Install

1. Close After Effects.
2. Download and extract [ShoSVG-CEP-Release-EN.zip](https://github.com/shoaibsoriginals/ShoSVG/raw/refs/heads/main/release/ShoSVG-CEP-Release-EN.zip).
3. Copy the extracted `ShoSVG` folder into the CEP extensions directory:
   - **Windows:** `%APPDATA%\Adobe\CEP\extensions\`
   - **macOS:** `~/Library/Application Support/Adobe/CEP/extensions/`
4. Start After Effects and open **Window > Extensions > ShoSVG**.

ShoSVG is an unsigned CEP extension. If After Effects does not load it, enable `PlayerDebugMode` for the CSXS runtime version in `CSXS/manifest.xml` (currently CSXS 9.0), then restart After Effects:

- **Windows:** Set the string value `PlayerDebugMode` to `1` under `HKEY_CURRENT_USER\Software\Adobe\CSXS.9`.
- **macOS:** Run `defaults write com.adobe.CSXS.9 PlayerDebugMode 1` in Terminal.

## SVG support

ShoSVG handles common paths and shapes, groups, transforms, fills, strokes, `viewBox` sizing, and SVG paint order. SVG features such as text, gradients, masks, clip paths, filters, and embedded images may be skipped or look different in After Effects.

ShoSVG is an independent project and is not affiliated with Battle Axe or Overlord.

## License

ShoSVG is distributed under the MIT License. See [LICENSE](LICENSE).
