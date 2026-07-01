#!/usr/bin/env bash
# V2: download with verified Unsplash photo IDs.
# All IDs are confirmed to return 200 from images.unsplash.com.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/public/images"

# Counters
ok_count=0
fail_count=0
skip_count=0

dl() {
  local target="$1"
  local id="$2"
  mkdir -p "$(dirname "$target")"
  if [[ -s "$target" ]] && [[ $(stat -c%s "$target" 2>/dev/null || stat -f%z "$target") -gt 1000 ]]; then
    skip_count=$((skip_count + 1))
    return
  fi
  local url="https://images.unsplash.com/photo-${id}?w=1600&q=80&fm=jpg&fit=crop&auto=format"
  local code
  code=$(curl -sL --max-time 20 -o "$target" -w "%{http_code}" "$url" 2>/dev/null) || code="000"
  if [[ "$code" != "200" ]] || [[ ! -s "$target" ]]; then
    fail_count=$((fail_count + 1))
    echo "FAIL $target <- $id ($code)"
    rm -f "$target"
  else
    ok_count=$((ok_count + 1))
  fi
}

# === DESTINATIONS (13 - includes chiang-mai-hero2 fallback) ===
dl destinations/chiang-mai-hero.jpg        1599576838688-8a6c11263108
dl destinations/chiang-rai-hero.jpg         1671188893377-ee825a53d27f
dl destinations/bangkok-hero.jpg            1508009603885-50cf7c579365
dl destinations/ayutthaya-hero.jpg          1563492065599-3520f775eeed
dl destinations/sukhothai-hero.jpg          1582279129055-ac447ed0bf5d
dl destinations/kanchanaburi-hero.jpg       1585806882217-265db0aeefd4
dl destinations/pai-hero.jpg                1528181304800-259b08848526
dl destinations/phuket-hero.jpg             1589394815804-9645a307c50c
dl destinations/krabi-hero.jpg              1552465011-b4e21bf6e79a
dl destinations/khao-sok-hero.jpg           1585970480901-90d6bb2a48b5
dl destinations/koh-tao-hero.jpg            1537956965359-7573183d1f57
dl destinations/isan-hero.jpg               1566708303363-9bdb726702f4
dl destinations/chiang-mai-hero2.jpg        1512553353614-82a7370096dc

# === HERO BANNERS (13) ===
dl hero/home-hero.jpg              1523731407965-2430cd12f5e4
dl hero/about-hero.jpg              1599576838688-8a6c11263108
dl hero/blog-hero.jpg               1499750310107-5fef28a66643
dl hero/contact-hero.jpg            1596524430615-b46475ddff6e
dl hero/destinations-hero.jpg       1523731407965-2430cd12f5e4
dl hero/educators-hero.jpg          1509062522246-3755977927d7
dl hero/enquire-hero.jpg            1521737852567-6949f3f9a2be
dl hero/how-it-works-hero.jpg       1521737852567-6949f3f9a2be
dl hero/itineraries-hero.jpg        1488646953014-85cb44e25828
dl hero/parents-hero.jpg            1517554558809-9b4971b38f39
dl hero/safety-hero.jpg             1581094794329-c8112a89af12
dl hero/schools-hero.jpg            1509062522246-3755977927d7
dl hero/trips-hero.jpg              1488646953014-85cb44e25828

# === BLOG HEROES (20) ===
dl blog/01-service-learning-hero.jpg            1488521787991-ed7bbaae773c
dl blog/02-chiang-mai-service-rebook-hero.jpg   1599576838688-8a6c11263108
dl blog/03-marine-biology-andaman-hero.jpg      1572713629470-3e9f5d4fdf4c
dl blog/04-elephant-conservation-ethics-hero.jpg 1548636200-691c76f69390
dl blog/05-mekong-history-hero.jpg              1543411789-1a67a2ac05c6
dl blog/06-kanchanaburi-4-days-hero.jpg         1585806882217-265db0aeefd4
dl blog/07-ayutthaya-day-vs-immersion-hero.jpg  1563492065599-3520f775eeed
dl blog/08-thai-homestay-classroom-hero.jpg     1663564000694-a440edf76cd9
dl blog/09-isan-7-days-hero.jpg                 1566708303363-9bdb726702f4
dl blog/10-bangkok-48-hours-hero.jpg            1508009603885-50cf7c579365
dl blog/11-thai-language-homestay-hero.jpg      1554629713-42a71f7ec2b3
dl blog/12-muay-thai-sports-tour-hero.jpg       1601588462060-470011bd9a18
dl blog/13-andaman-sailing-marine-sports-hero.jpg 1528154291023-a6525fabe5b4
dl blog/14-koh-tao-dive-certification-hero.jpg   1583364512105-951b6f7080ae
dl blog/15-plan-school-trip-abroad-hero.jpg     1571260899304-425eee4c7efc
dl blog/16-ib-myp-service-hours-thailand-hero.jpg 1488521787991-ed7bbaae773c
dl blog/17-risk-assessment-uk-us-schools-hero.jpg 1581094794329-c8112a89af12
dl blog/18-thailand-school-trip-packing-list-hero.jpg 1547038577-da80abbc4f19
dl blog/19-real-cost-thailand-school-trip-hero.jpg 1554224155-6726b3ff858f
dl blog/20-why-thailand-only-hero.jpg           1528181304800-259b08848526

# === ITINERARY HEROES + GALLERIES (70) ===
# Northern Thailand Service Week
dl itineraries/northern-thailand-service-week-hero.jpg 1599576838688-8a6c11263108
dl itineraries/ntsw-1.jpg  1548636200-691c76f69390
dl itineraries/ntsw-2.jpg  1528181304800-259b08848526
dl itineraries/ntsw-3.jpg  1488521787991-ed7bbaae773c
dl itineraries/ntsw-4.jpg  1599576838688-8a6c11263108
dl itineraries/ntsw-5.jpg  1548636200-691c76f69390
dl itineraries/ntsw-6.jpg  1528181304800-259b08848526

# Muay Thai & Service
dl itineraries/muay-thai-and-service-hero.jpg 1601588462060-470011bd9a18
dl itineraries/muay-thai-and-service-1.jpg 1601588462060-470011bd9a18
dl itineraries/muay-thai-and-service-2.jpg 1547038577-da80abbc4f19
dl itineraries/muay-thai-and-service-3.jpg 1542751371-adc35448e20a
dl itineraries/muay-thai-and-service-4.jpg 1601588462060-470011bd9a18
dl itineraries/muay-thai-and-service-5.jpg 1547038577-da80abbc4f19
dl itineraries/muay-thai-and-service-6.jpg 1542751371-adc35448e20a

# Thai Language Homestay
dl itineraries/thai-language-homestay-fortnight-hero.jpg 1554629713-42a71f7ec2b3
dl itineraries/thai-language-homestay-fortnight-1.jpg 1554629713-42a71f7ec2b3
dl itineraries/thai-language-homestay-fortnight-2.jpg 1548636200-691c76f69390
dl itineraries/thai-language-homestay-fortnight-3.jpg 1488521787991-ed7bbaae773c
dl itineraries/thai-language-homestay-fortnight-4.jpg 1599576838688-8a6c11263108
dl itineraries/thai-language-homestay-fortnight-5.jpg 1554629713-42a71f7ec2b3
dl itineraries/thai-language-homestay-fortnight-6.jpg 1548636200-691c76f69390

# Andaman Sailing
dl itineraries/andaman-sailing-week-hero.jpg 1528154291023-a6525fabe5b4
dl itineraries/andaman-sailing-week-1.jpg 1528154291023-a6525fabe5b4
dl itineraries/andaman-sailing-week-2.jpg 1583364512105-951b6f7080ae
dl itineraries/andaman-sailing-week-3.jpg 1589394815804-9645a307c50c
dl itineraries/andaman-sailing-week-4.jpg 1528154291023-a6525fabe5b4
dl itineraries/andaman-sailing-week-5.jpg 1583364512105-951b6f7080ae
dl itineraries/andaman-sailing-week-6.jpg 1589394815804-9645a307c50c

# Koh Tao Dive
dl itineraries/koh-tao-dive-certification-hero.jpg 1583364512105-951b6f7080ae
dl itineraries/koh-tao-dive-certification-1.jpg 1583364512105-951b6f7080ae
dl itineraries/koh-tao-dive-certification-2.jpg 1589394815804-9645a307c50c
dl itineraries/koh-tao-dive-certification-3.jpg 1583364512105-951b6f7080ae
dl itineraries/koh-tao-dive-certification-4.jpg 1528154291023-a6525fabe5b4
dl itineraries/koh-tao-dive-certification-5.jpg 1583364512105-951b6f7080ae
dl itineraries/koh-tao-dive-certification-6.jpg 1589394815804-9645a307c50c

# Andaman Marine Biology
dl itineraries/andaman-marine-biology-hero.jpg 1583364512105-951b6f7080ae
dl itineraries/andaman-marine-biology-1.jpg 1583364512105-951b6f7080ae
dl itineraries/andaman-marine-biology-2.jpg 1589394815804-9645a307c50c
dl itineraries/andaman-marine-biology-3.jpg 1583364512105-951b6f7080ae
dl itineraries/andaman-marine-biology-4.jpg 1528154291023-a6525fabe5b4
dl itineraries/andaman-marine-biology-5.jpg 1583364512105-951b6f7080ae
dl itineraries/andaman-marine-biology-6.jpg 1589394815804-9645a307c50c

# Ayutthaya-Kanchanaburi History
dl itineraries/ayutthaya-kanchanaburi-history-loop-hero.jpg 1563492065599-3520f775eeed
dl itineraries/ayutthaya-kanchanaburi-hero.jpg 1563492065599-3520f775eeed
dl itineraries/ayutthaya-kanchanaburi-history-loop-1.jpg 1563492065599-3520f775eeed
dl itineraries/ayutthaya-kanchanaburi-history-loop-2.jpg 1573270689103-d7a4e42b609a
dl itineraries/ayutthaya-kanchanaburi-history-loop-3.jpg 1563492065599-3520f775eeed
dl itineraries/ayutthaya-kanchanaburi-history-loop-4.jpg 1548636200-691c76f69390
dl itineraries/ayutthaya-kanchanaburi-history-loop-5.jpg 1573270689103-d7a4e42b609a
dl itineraries/ayutthaya-kanchanaburi-history-loop-6.jpg 1563492065599-3520f775eeed

# Khao Sok Jungle Ecology
dl itineraries/khao-sok-jungle-ecology-hero.jpg 1585970480901-90d6bb2a48b5
dl itineraries/khao-sok-jungle-ecology-1.jpg 1585970480901-90d6bb2a48b5
dl itineraries/khao-sok-jungle-ecology-2.jpg 1621849400072-f554417f7051
dl itineraries/khao-sok-jungle-ecology-3.jpg 1585970480901-90d6bb2a48b5
dl itineraries/khao-sok-jungle-ecology-4.jpg 1585970480901-90d6bb2a48b5
dl itineraries/khao-sok-jungle-ecology-5.jpg 1621849400072-f554417f7051
dl itineraries/khao-sok-jungle-ecology-6.jpg 1585970480901-90d6bb2a48b5

# Bangkok-Isan Cultural
dl itineraries/bangkok-isan-cultural-immersion-hero.jpg 1566708303363-9bdb726702f4
dl itineraries/bangkok-isan-cultural-immersion-1.jpg 1566708303363-9bdb726702f4
dl itineraries/bangkok-isan-cultural-immersion-2.jpg 1508009603885-50cf7c579365
dl itineraries/bangkok-isan-cultural-immersion-3.jpg 1566708303363-9bdb726702f4
dl itineraries/bangkok-isan-cultural-immersion-4.jpg 1566708303363-9bdb726702f4
dl itineraries/bangkok-isan-cultural-immersion-5.jpg 1508009603885-50cf7c579365
dl itineraries/bangkok-isan-cultural-immersion-6.jpg 1566708303363-9bdb726702f4

# Pai Adventure
dl itineraries/pai-adventure-and-service-hero.jpg 1528181304800-259b08848526
dl itineraries/pai-adventure-and-service-1.jpg 1528181304800-259b08848526
dl itineraries/pai-adventure-and-service-2.jpg 1552465011-b4e21bf6e79a
dl itineraries/pai-adventure-and-service-3.jpg 1528181304800-259b08848526
dl itineraries/pai-adventure-and-service-4.jpg 1552465011-b4e21bf6e79a
dl itineraries/pai-adventure-and-service-5.jpg 1528181304800-259b08848526
dl itineraries/pai-adventure-and-service-6.jpg 1552465011-b4e21bf6e79a

# === TEAM (8) ===
dl team/kriengsak.jpg  1507003211169-0a1dd7228f2d
dl team/sarah.jpg      1494790108377-be9c29b29330
dl team/james.jpg      1500648767791-00dcc994a43e
dl team/nittaya.jpg    1487412720507-e7ab37603c6f
dl team/marta.jpg      1438761681033-6461ffad8d80
dl team/piya.jpg       1502823403499-6ccfcf4fb453
dl team/somchai.jpg    1531427186611-ecfd6d936c4b
dl team/thanchanok.jpg 1517841905240-472988babdf9

echo "=== summary ==="
echo "downloaded: $ok_count"
echo "skipped (already exist): $skip_count"
echo "failed: $fail_count"
echo "total files: $(find . -type f -name '*.jpg' | wc -l)"
du -sh .