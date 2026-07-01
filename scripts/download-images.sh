#!/usr/bin/env bash
# Download all flyed images from Unsplash CDN.
# Each line: target_path|photo_id
# Photo IDs are stable Unsplash CDN identifiers.
set -euo pipefail

BASE="https://images.unsplash.com/photo-"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/public/images"

dl() {
  local target="$1"
  local id="$2"
  mkdir -p "$(dirname "$target")"
  if [[ -s "$target" ]]; then
    echo "skip $target"
    return
  fi
  local url="${BASE}${id}?w=1600&q=80&fm=jpg&fit=crop"
  local code
  code=$(curl -sL -o "$target" -w "%{http_code}" "$url") || true
  if [[ "$code" != "200" ]] || [[ ! -s "$target" ]]; then
    echo "FAIL $target ($code) <- $id"
    rm -f "$target"
  else
    echo "ok   $target"
  fi
}

# ---- DESTINATIONS (12) ----
dl destinations/chiang-mai-hero.jpg       1598970434795-0c54fe7c0648
dl destinations/chiang-rai-hero.jpg        1528181309600-4eaea2c6dc33
dl destinations/bangkok-hero.jpg           1508009603885-50cf7c579365
dl destinations/ayutthaya-hero.jpg         1563492065599-3520f77509ed
dl destinations/sukhothai-hero.jpg         1573270689103-d7a4e42b609a
dl destinations/kanchanaburi-hero.jpg      1552465011-b4e21bf6e79a
dl destinations/pai-hero.jpg               1528181309600-4eaea2c6dc33
dl destinations/chiang-mai-hero2.jpg       1598970434795-0c54fe7c0648
dl destinations/phuket-hero.jpg            1589394815804-9645a307c50c
dl destinations/krabi-hero.jpg             1552465011-b4e21bf6e79a
dl destinations/khao-sok-hero.jpg          1518509562904-e7ef99cddc85
dl destinations/koh-tao-hero.jpg           1583416750470-965b2707b355
dl destinations/isan-hero.jpg              1552465011-b4e21bf6e79a

# ---- HERO BANNERS (13) ----
dl hero/home-hero.jpg              1528181309600-4eaea2c6dc33
dl hero/about-hero.jpg              1528181309600-4eaea2c6dc33
dl hero/blog-hero.jpg               1499750310107-5fef28a66643
dl hero/contact-hero.jpg            1583416750470-965b2707b355
dl hero/destinations-hero.jpg       1528181309600-4eaea2c6dc33
dl hero/educators-hero.jpg          1503676260728-1c00da094a0b
dl hero/enquire-hero.jpg            1521737852567-6949f3f9a2be
dl hero/how-it-works-hero.jpg       1521737852567-6949f3f9a2be
dl hero/itineraries-hero.jpg        1488646953014-85cb44e25828
dl hero/parents-hero.jpg            1503676260728-1c00da094a0b
dl hero/safety-hero.jpg             1581094794329-c8112a89af12
dl hero/schools-hero.jpg            1503676260728-1c00da094a0b
dl hero/trips-hero.jpg              1488646953014-85cb44e25828

# ---- BLOG HEROES (20) ----
dl blog/01-service-learning-hero.jpg           1488521787991-ed7bbaae773c
dl blog/02-chiang-mai-service-rebook-hero.jpg  1598970434795-0c54fe7c0648
dl blog/03-marine-biology-andaman-hero.jpg     1583212297254-5bdc8b7c75a5
dl blog/04-elephant-conservation-ethics-hero.jpg  1557050543-0d9d2db2db2d
dl blog/05-mekong-history-hero.jpg             1528127269322-539801943592
dl blog/06-kanchanaburi-4-days-hero.jpg        1557050543-0d9d2db2db2d
dl blog/07-ayutthaya-day-vs-immersion-hero.jpg 1563492065599-3520f77509ed
dl blog/08-thai-homestay-classroom-hero.jpg    1528181309600-4eaea2c6dc33
dl blog/09-isan-7-days-hero.jpg                1528127269322-539801943592
dl blog/10-bangkok-48-hours-hero.jpg           1508009603885-50cf7c579365

dl blog/11-thai-language-homestay-hero.jpg     1528181309600-4eaea2c6dc33
dl blog/12-muay-thai-sports-tour-hero.jpg      1517438476312-10d79c077509
dl blog/13-andaman-sailing-marine-sports-hero.jpg 1583416750470-965b2707b355
dl blog/14-koh-tao-dive-certification-hero.jpg 1583212297254-5bdc8b7c75a5
dl blog/15-plan-school-trip-abroad-hero.jpg    1503676260728-1c00da094a0b
dl blog/16-ib-myp-service-hours-thailand-hero.jpg 1488521787991-ed7bbaae773c
dl blog/17-risk-assessment-uk-us-schools-hero.jpg 1581094794329-c8112a89af12
dl blog/18-thailand-school-trip-packing-list-hero.jpg 1547038577-da80abbc4f19
dl blog/19-real-cost-thailand-school-trip-hero.jpg 1554224155-6726b3ff858f
dl blog/20-why-thailand-only-hero.jpg          1528181309600-4eaea2c6dc33

# ---- ITINERARY HEROES + GALLERIES (78) ----
# 10 itineraries x (1 hero + 6 gallery) = 70 slots

# Northern Thailand Service Week
dl itineraries/northern-thailand-service-week-hero.jpg  1598970434795-0c54fe7c0648
dl itineraries/ntsw-1.jpg  1557050543-0d9d2db2db2d
dl itineraries/ntsw-2.jpg  1528181309600-4eaea2c6dc33
dl itineraries/ntsw-3.jpg  1488521787991-ed7bbaae773c
dl itineraries/ntsw-4.jpg  1598970434795-0c54fe7c0648
dl itineraries/ntsw-5.jpg  1557050543-0d9d2db2db2d
dl itineraries/ntsw-6.jpg  1528181309600-4eaea2c6dc33

# Muay Thai & Service
dl itineraries/muay-thai-and-service-hero.jpg 1517438476312-10d79c077509
dl itineraries/muay-thai-and-service-1.jpg 1517438476312-10d79c077509
dl itineraries/muay-thai-and-service-2.jpg 1547038577-da80abbc4f19
dl itineraries/muay-thai-and-service-3.jpg 1542751371-adc35448e20a
dl itineraries/muay-thai-and-service-4.jpg 1517438476312-10d79c077509
dl itineraries/muay-thai-and-service-5.jpg 1547038577-da80abbc4f19
dl itineraries/muay-thai-and-service-6.jpg 1542751371-adc35448e20a

# Thai Language Homestay
dl itineraries/thai-language-homestay-fortnight-hero.jpg 1528181309600-4eaea2c6dc33
dl itineraries/thai-language-homestay-fortnight-1.jpg 1528181309600-4eaea2c6dc33
dl itineraries/thai-language-homestay-fortnight-2.jpg 1557050543-0d9d2db2db2d
dl itineraries/thai-language-homestay-fortnight-3.jpg 1488521787991-ed7bbaae773c
dl itineraries/thai-language-homestay-fortnight-4.jpg 1598970434795-0c54fe7c0648
dl itineraries/thai-language-homestay-fortnight-5.jpg 1528181309600-4eaea2c6dc33
dl itineraries/thai-language-homestay-fortnight-6.jpg 1557050543-0d9d2db2db2d

# Andaman Sailing
dl itineraries/andaman-sailing-week-hero.jpg 1583416750470-965b2707b355
dl itineraries/andaman-sailing-week-1.jpg 1583416750470-965b2707b355
dl itineraries/andaman-sailing-week-2.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/andaman-sailing-week-3.jpg 1589394815804-9645a307c50c
dl itineraries/andaman-sailing-week-4.jpg 1583416750470-965b2707b355
dl itineraries/andaman-sailing-week-5.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/andaman-sailing-week-6.jpg 1589394815804-9645a307c50c

# Koh Tao Dive
dl itineraries/koh-tao-dive-certification-hero.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/koh-tao-dive-certification-1.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/koh-tao-dive-certification-2.jpg 1589394815804-9645a307c50c
dl itineraries/koh-tao-dive-certification-3.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/koh-tao-dive-certification-4.jpg 1583416750470-965b2707b355
dl itineraries/koh-tao-dive-certification-5.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/koh-tao-dive-certification-6.jpg 1589394815804-9645a307c50c

# Andaman Marine Biology
dl itineraries/andaman-marine-biology-hero.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/andaman-marine-biology-1.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/andaman-marine-biology-2.jpg 1589394815804-9645a307c50c
dl itineraries/andaman-marine-biology-3.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/andaman-marine-biology-4.jpg 1583416750470-965b2707b355
dl itineraries/andaman-marine-biology-5.jpg 1583212297254-5bdc8b7c75a5
dl itineraries/andaman-marine-biology-6.jpg 1589394815804-9645a307c50c

# Ayutthaya-Kanchanaburi History
dl itineraries/ayutthaya-kanchanaburi-history-loop-hero.jpg 1563492065599-3520f77509ed
dl itineraries/ayutthaya-kanchanaburi-hero.jpg 1563492065599-3520f77509ed
dl itineraries/ayutthaya-kanchanaburi-history-loop-1.jpg 1563492065599-3520f77509ed
dl itineraries/ayutthaya-kanchanaburi-history-loop-2.jpg 1573270689103-d7a4e42b609a
dl itineraries/ayutthaya-kanchanaburi-history-loop-3.jpg 1563492065599-3520f77509ed
dl itineraries/ayutthaya-kanchanaburi-history-loop-4.jpg 1557050543-0d9d2db2db2d
dl itineraries/ayutthaya-kanchanaburi-history-loop-5.jpg 1573270689103-d7a4e42b609a
dl itineraries/ayutthaya-kanchanaburi-history-loop-6.jpg 1563492065599-3520f77509ed

# Khao Sok Jungle Ecology
dl itineraries/khao-sok-jungle-ecology-hero.jpg 1518509562904-e7ef99cddc85
dl itineraries/khao-sok-jungle-ecology-1.jpg 1518509562904-e7ef99cddc85
dl itineraries/khao-sok-jungle-ecology-2.jpg 1528127269322-539801943592
dl itineraries/khao-sok-jungle-ecology-3.jpg 1518509562904-e7ef99cddc85
dl itineraries/khao-sok-jungle-ecology-4.jpg 1518509562904-e7ef99cddc85
dl itineraries/khao-sok-jungle-ecology-5.jpg 1528127269322-539801943592
dl itineraries/khao-sok-jungle-ecology-6.jpg 1518509562904-e7ef99cddc85

# Bangkok-Isan Cultural
dl itineraries/bangkok-isan-cultural-immersion-hero.jpg 1528127269322-539801943592
dl itineraries/bangkok-isan-cultural-immersion-1.jpg 1528127269322-539801943592
dl itineraries/bangkok-isan-cultural-immersion-2.jpg 1508009603885-50cf7c579365
dl itineraries/bangkok-isan-cultural-immersion-3.jpg 1528127269322-539801943592
dl itineraries/bangkok-isan-cultural-immersion-4.jpg 1528127269322-539801943592
dl itineraries/bangkok-isan-cultural-immersion-5.jpg 1508009603885-50cf7c579365
dl itineraries/bangkok-isan-cultural-immersion-6.jpg 1528127269322-539801943592

# Pai Adventure
dl itineraries/pai-adventure-and-service-hero.jpg 1528181309600-4eaea2c6dc33
dl itineraries/pai-adventure-and-service-1.jpg 1528181309600-4eaea2c6dc33
dl itineraries/pai-adventure-and-service-2.jpg 1552465011-b4e21bf6e79a
dl itineraries/pai-adventure-and-service-3.jpg 1528181309600-4eaea2c6dc33
dl itineraries/pai-adventure-and-service-4.jpg 1552465011-b4e21bf6e79a
dl itineraries/pai-adventure-and-service-5.jpg 1528181309600-4eaea2c6dc33
dl itineraries/pai-adventure-and-service-6.jpg 1552465011-b4e21bf6e79a

# ---- TEAM (8) ----
dl team/kriengsak.jpg  1535713875002-d1d0cf377fde
dl team/sarah.jpg      1494790108377-be9c29b29330
dl team/james.jpg      1500648767791-00dcc994a43e
dl team/nittaya.jpg    1487412720507-e7ab37603c6f
dl team/marta.jpg      1438761681033-6461ffad8d80
dl team/piya.jpg       1502823403499-6ccfcf4fb453
dl team/somchai.jpg    1531427186611-ecfd6d936c4b
dl team/thanchanok.jpg 1517841905240-472988babdf9

# ---- BADGES (4) - inline SVG, no download needed ----

echo "--- summary ---"
echo "files: $(find . -type f -name '*.jpg' | wc -l)"
du -sh .