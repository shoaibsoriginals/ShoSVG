(function () {
    'use strict';

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

    function setBusy(busy) {
        isBusy = busy;
        if (busy) {
            btn.classList.add('is-busy');
        } else {
            btn.classList.remove('is-busy');
        }
    }

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

        return source.substring(start).replace(/^\s+|\s+$/g, '');
    }

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

        cp.execFile(psExe, ['-NoProfile', '-NonInteractive', '-STA', '-Command', psCommand], {
            windowsHide: true,
            timeout: 8000,
            maxBuffer: 8 * 1024 * 1024
        }, callback);
    }

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

            var escapedSvg = JSON.stringify(svgText)
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
            var script = 'shoSvgPasteFromPanel(' + escapedSvg + ', ' + (mergeIntoOne ? 'true' : 'false') + ')';

            csInterface.evalScript(script, function (result) {
                setBusy(false);
                try {
                    JSON.parse(result);
                } catch (eParse) {
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

