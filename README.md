# ShoSVG

I built ShoSVG because bringing an SVG from Figma into After Effects should be quick and should not require paying for another tool.

Copy your artwork as SVG, open ShoSVG in After Effects, and click the button. Your artwork becomes editable shape layers, ready to animate. Use a normal click for one merged shape layer, or hold **Alt/Option** or **Shift** while clicking to create separate layers in SVG paint order.

Adobe already charges for the creative tools many of us rely on. I wanted to give the motion-design community a practical little tool without adding another paywall to this workflow. ShoSVG is free to use, with no subscription or license key. If it helps you, use it, share it, and pass it along.

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

On Windows, ShoSVG can also read SVG copied from a browser as an HTML element. Copying a screenshot or raster image will not create editable vector paths.

## License

ShoSVG is distributed under the MIT License. See [LICENSE](LICENSE).
