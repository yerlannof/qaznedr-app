# Noto Sans SC OG subset

Static weights 400 and 700 subsetted from Google Fonts Noto Sans SC.

Source: [google/fonts Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc) — variable font `NotoSansSC[wght].ttf`. The included `OFL-NotoSansSC.txt` contains the license.

To rebuild from the repository root, install fontTools in a temporary venv, download the upstream font outside the repository, and run the helper:

```sh
python3 -m venv /tmp/qaznedr-font-venv
/tmp/qaznedr-font-venv/bin/pip install fonttools brotli
curl -fL 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf' -o /tmp/NotoSansSC-VF.ttf
/tmp/qaznedr-font-venv/bin/python scripts/subset-og-fonts.py /tmp/NotoSansSC-VF.ttf
```

The helper pins `wght=400` and `700` and subsets ASCII plus characters present in the shared translations and Chinese guides at build time. This is a snapshot subset. Noto Sans SC lacks 15 code points in the shared translations (Kazakh-specific letters and ₸); it includes all Chinese guide characters. Check coverage when adding copy. The full upstream font stays outside the repository.
