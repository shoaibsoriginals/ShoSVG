# ShoSVG

ShoSVG is a free CEP extension for Adobe After Effects. It reads SVG markup from the clipboard and converts it into editable After Effects shape layers.

## Download

Download and extract [ShoSVG-CEP-Release-EN.zip](release/ShoSVG-CEP-Release-EN.zip). The archive contains the installable `ShoSVG` extension folder.

## Install

1. Close After Effects.
2. Extract the ZIP file.
3. Copy the extracted `ShoSVG` folder into the CEP extensions directory:
   - **Windows:** `%APPDATA%\Adobe\CEP\extensions\`
   - **macOS:** `~/Library/Application Support/Adobe/CEP/extensions/`
4. Start After Effects and open **Window > Extensions > ShoSVG**.

ShoSVG is an unsigned CEP extension. If After Effects does not load it, enable `PlayerDebugMode` for the CSXS runtime version declared in `CSXS/manifest.xml` (currently CSXS 9.0), then restart After Effects:

- **Windows:** Set the string value `PlayerDebugMode` to `1` under `HKEY_CURRENT_USER\Software\Adobe\CSXS.9`.
- **macOS:** Run `defaults write com.adobe.CSXS.9 PlayerDebugMode 1` in Terminal.

## Use

Copy an SVG element or SVG markup in Figma or a browser, then click the ShoSVG panel button.

- **Normal click:** Create one merged shape layer.
- **Alt-click or Shift-click:** Create separate shape layers in SVG paint order.

On Windows, ShoSVG reads both plain text and the native HTML clipboard format used by browsers for copied SVG elements. A raster-only clipboard image cannot be converted into editable vector paths.

## SVG support

ShoSVG supports common paths and basic shapes, groups, transforms, colors, fills, strokes, `viewBox` sizing, and SVG document paint order. SVG is a broad format, so text, gradients, masks, clip paths, filters, embedded images, and other advanced features may be skipped or differ from browser rendering.

## Host source

The ExtendScript host engine is shipped as `jsx/host.jsxbin`; its plaintext source is not included. JSXBIN makes casual inspection harder, but it is not encryption and cannot guarantee protection from reverse engineering. The CEP panel file `js/main.js` remains readable JavaScript.

## License

ShoSVG is distributed under the MIT License. See [LICENSE](LICENSE).
