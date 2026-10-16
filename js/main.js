/* ============================================================================
   ShoSVG — CEP Panel JS
   `new CSInterface()` is assumed to be globally available (index.html loads
   Adobe's original js/CSInterface.js before this file — this file never
   creates or mocks that class).

   CLIPBOARD: neither navigator.clipboard.readText() (NotAllowedError — the
   async Clipboard API's permission is not granted inside CEP panels) nor
   document.execCommand('paste') (blocked by Chromium on the button click
   for the same underlying reason) work here. Both are browser-security
   mechanisms, and CEP's embedded Chromium enforces them regardless of the
   host app. This file bypasses that layer entirely by reading the clipboard
   through CEP's built-in Node.js integration (require('child_process')) —
   a native OS process, not a DOM/browser API, so none of Chromium's
   clipboard permission rules apply to it.

   This DOES require Node.js integration to be turned on for this panel —
   see the <CEFCommandLine> block added to CSXS/manifest.xml
   (--enable-nodejs + --mixed-context). Without that, require() is
   undefined and cp below stays null (handlePasteClick() reports that
   clearly instead of throwing).

   host.jsx still has no clipboard reader of its own: no
   system.callSystem(), no PowerShell/pbpaste call on the ExtendScript
   side, no temp file. The pbpaste/PowerShell call now happens over here,
   in Node — asynchronously, via child_process.exec() — so it can never
   block or time out the ExtendScript engine the way the old
   system.callSystem()-based approach did; the panel just waits on a
   normal async callback.

   ALERT ON evalScript's ERROR PATH: deliberately removed. See the comment
   at the evalScript callback below for why.
   ============================================================================ */
(function () {
    'use strict';

    // Block Chromium's native right-click context menu (Print, View Page
    // Source, Inspect, etc.) across the whole panel — this is a finished,
    // single-purpose button, not a page that needs a browser menu.
    // NOTE: this also removes the right-click → Reload/Inspect shortcut
    // some CEP devs use while iterating on CSS. If you still need that for
    // testing, comment this out temporarily or use the extension's remote
    // debug port instead.
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    var csInterface = new CSInterface();

    var btn = document.getElementById('btnPaste');
    var isBusy = false;

    var cp = null;
    try {
        cp = require('child_process');
    } catch (eRequire) {
        console.error('ShoSVG: Node.js integration not available (child_process). ' +
            'Check CSXS/manifest.xml has --enable-nodejs and --mixed-context set.', eRequire);
    }

    // NOTE: no dynamic AE-theme-color sync here on purpose. The panel now
    // uses fixed, hardcoded colors (body #232323, the clickable card
    // #181818 — see style.css) instead of matching AE's current live skin
    // color, so there is nothing left for a theme-sync step to update.

    // ------------------------------------------------------------------
    // BUSY STATE
    // ------------------------------------------------------------------
    function setBusy(busy) {
        isBusy = busy;
        if (busy) {
            btn.classList.add('is-busy');
        } else {
            btn.classList.remove('is-busy');
        }
    }

    // Return the actual SVG element if it is inside an HTML Clipboard
    // fragment. Browsers commonly publish copied SVG nodes this way instead
    // of exposing their source through the plain-text Clipboard format.
    function extractSvgMarkup(text) {
        if (text === undefined || text === null) return '';

        var source = String(text).replace(/^\uFEFF/, '');
        var firstSvg = /<svg(?:\s|>)/i.exec(source);
        if (!firstSvg) return source.replace(/^\s+|\s+$/g, '');

        var start = firstSvg.index;
        var tagRe = /<\/?svg\b[^>]*>/ig;
        tagRe.lastIndex = start;
        var depth = 0;
        var match;

        while ((match = tagRe.exec(source)) !== null) {
            var tag = match[0];
            if (/^<\//.test(tag)) {
                depth--;
                if (depth === 0) return source.substring(start, tagRe.lastIndex);
            } else if (/\/\s*>$/.test(tag)) {
                if (depth === 0) return source.substring(start, tagRe.lastIndex);
            } else {
                depth++;
            }
        }

        // A malformed fragment still gets passed to the host parser, which
        // can provide the normal SVG-specific error instead of losing it.
        return source.substring(start).replace(/^\s+|\s+$/g, '');
    }

    // Windows web browsers often put an SVG copied from the rendered page in
    // the native "HTML Format" clipboard slot. Get-Clipboard only asks for
    // plain text, so it cannot see that payload. Read both formats on an STA
    // PowerShell process and prefer HTML whenever it contains an SVG node.
    function readClipboard(isMac, callback) {
        if (isMac) {
            cp.exec('pbpaste', { timeout: 8000 }, callback);
            return;
        }

        var psExe = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
        var psCommand = [
            '$ErrorActionPreference = "Stop"',
            'Add-Type -AssemblyName System.Windows.Forms',
            '$data = [System.Windows.Forms.Clipboard]::GetDataObject()',
            'if ($null -eq $data) { exit 2 }',
            '$plain = ""',
            'if ($data.GetDataPresent([System.Windows.Forms.DataFormats]::UnicodeText)) { $plain = [string]$data.GetData([System.Windows.Forms.DataFormats]::UnicodeText) } elseif ($data.GetDataPresent([System.Windows.Forms.DataFormats]::Text)) { $plain = [string]$data.GetData([System.Windows.Forms.DataFormats]::Text) }',
            '$html = ""',
            'if ($data.GetDataPresent([System.Windows.Forms.DataFormats]::Html)) { $html = [string]$data.GetData([System.Windows.Forms.DataFormats]::Html) }',
            '[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)',
            'if ($html -match "(?is)<svg\\b") { [Console]::Write($html) } else { [Console]::Write($plain) }'
        ].join('; ');

        // execFile passes the PowerShell command as one argument. That avoids
        // the nested shell quoting that corrupts markup containing quotes.
        cp.execFile(psExe, ['-NoProfile', '-NonInteractive', '-STA', '-Command', psCommand], {
            windowsHide: true,
            timeout: 8000,
            maxBuffer: 8 * 1024 * 1024
        }, callback);
    }

    // ------------------------------------------------------------------
    // CLICK HANDLING
    // Normal click = one merged shape layer. Alt-click or Shift-click =
    // separate shape layers, one per top-level element — read straight off
    // the click MouseEvent's own modifier flags.
    // ------------------------------------------------------------------
    function handlePasteClick(mergeIntoOne) {
        if (isBusy) return;

        if (!cp) {
            window.alert('ShoSVG: Node.js integration is not available in this panel.\n\n' +
                'Add --enable-nodejs and --mixed-context to the <CEFCommandLine> in CSXS/manifest.xml.');
            return;
        }

        setBusy(true);

        var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        readClipboard(isMac, function (error, stdout, stderr) {
            var svgText = extractSvgMarkup(stdout);
            if (error || !svgText) {
                setBusy(false);
                if (stderr) console.error('ShoSVG clipboard read stderr:', stderr);
                window.alert('ShoSVG: The clipboard is empty or unreadable.\n\nCopy SVG code, then click again.');
                return;
            }

            if (!/<svg(?:\s|>)/i.test(svgText)) {
                setBusy(false);
                window.alert('ShoSVG: The clipboard does not contain SVG markup.\n\nCopy SVG code or an SVG element, then click again.');
                return;
            }

            // JSON.stringify() produces a valid ES3 string literal for the
            // evalScript payload. U+2028/U+2029 are defensively re-escaped
            // since JSON.stringify does not escape them itself, and a raw
            // line/paragraph separator inside a string literal breaks some
            // JS parsers.
            var escapedSvg = JSON.stringify(svgText)
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
            var script = 'shoSvgPasteFromPanel(' + escapedSvg + ', ' + (mergeIntoOne ? 'true' : 'false') + ')';

            csInterface.evalScript(script, function (result) {
                setBusy(false);
                try {
                    JSON.parse(result);
                    // No extra UI needed here — shoSvgPasteFromPanel()/
                    // shoSvgPaste() already surfaced any real problem to the
                    // user via a native alert(), same as the ScriptUI original.
                } catch (eParse) {
                    // Deliberately no user-facing alert here. In practice this
                    // branch fires as a false positive: evalScript's own
                    // internal response timeout can elapse (returning
                    // something that isn't the expected JSON, e.g. "EvalScript
                    // error.") even though AE keeps running the ExtendScript
                    // call to completion in the background and the paste
                    // succeeds anyway — this JS side just stopped waiting for
                    // the reply. Any REAL failure inside shoSvgPasteFromPanel()/
                    // shoSvgPaste() already surfaces via its own native
                    // alert() on the ExtendScript side regardless, so nothing
                    // is silently lost — just logged here for debugging.
                    console.error('ShoSVG: evalScript did not return the expected JSON.', result);
                }
            });
        });
    }

    btn.addEventListener('click', function (event) {
        var mergeIntoOne = !(event.altKey || event.shiftKey);
        handlePasteClick(mergeIntoOne);
    });
})();
