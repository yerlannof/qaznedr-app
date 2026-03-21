#!/bin/bash
# Notify search engines about sitemap updates
echo "Pinging search engines..."
curl -s "https://www.google.com/ping?sitemap=https://qaznedr.kz/sitemap.xml" > /dev/null
curl -s "https://webmaster.yandex.ru/ping?sitemap=https://qaznedr.kz/sitemap.xml" > /dev/null
echo "Done! Pinged Google and Yandex."
