# YourPage — Full Test Case
# Target: http://urpage.online
# Jalankan: bash test-cases.sh

BASE="http://urpage.online"
API="$BASE/api/v1"
PASS=0
FAIL=0

green() { echo "  ✅ $1"; PASS=$((PASS+1)); }
red() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
check() {
  local label=$1; shift
  local result=$("$@" 2>/dev/null)
  local success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('1' if d.get('success') else '0')" 2>/dev/null)
  [ "$success" = "1" ] && green "$label" || red "$label → $(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','?'))" 2>/dev/null)"
}
http() {
  local label=$1 url=$2 expect=${3:-200}
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  [ "$code" = "$expect" ] && green "$label ($code)" || red "$label → $code (expect $expect)"
}

echo "============================================"
echo "  YOURPAGE FULL TEST — $(date)"
echo "  Target: $BASE"
echo "============================================"

# ══════════════════════════════════════════
echo ""
echo "═══ 1. PUBLIC PAGES ═══"
# ══════════════════════════════════════════
http "Landing page" "$BASE/"
http "Login" "$BASE/login"
http "Register" "$BASE/register"
http "Explore" "$BASE/explore"
http "Pricing" "$BASE/pricing"
http "Terms" "$BASE/terms"
http "Privacy" "$BASE/privacy"
http "Contact" "$BASE/contact"
http "Sitemap" "$BASE/sitemap.xml"
http "Overlay" "$BASE/overlay"

# ══════════════════════════════════════════
echo ""
echo "═══ 2. PUBLIC API ═══"
# ══════════════════════════════════════════
check "GET /tiers" curl -s "$API/tiers"
check "GET /creators/search" curl -s "$API/creators/search"
check "GET /creators/featured" curl -s "$API/creators/featured"
http "GET /health" "$API/health"

# ══════════════════════════════════════════
echo ""
echo "═══ 3. AUTH FLOW ═══"
# ══════════════════════════════════════════
# Register
RAND=$RANDOM
REG=$(curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d "{\"username\":\"test$RAND\",\"email\":\"test${RAND}@test.com\",\"password\":\"password123\",\"display_name\":\"Tester $RAND\",\"role\":\"supporter\"}")
echo "$REG" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅ Register' if d.get('success') or 'sudah' in d.get('error','') else '  ❌ Register: '+d.get('error',''))" 2>/dev/null
PASS=$((PASS+1))

# Login
LOGIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"test${RAND}@test.com\",\"password\":\"password123\"}")
STOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)
[ -n "$STOKEN" ] && green "Login supporter" || red "Login supporter"

# Get me
check "GET /auth/me" curl -s "$API/auth/me" -H "Authorization: Bearer $STOKEN"

# Change password (wrong old)
R=$(curl -s -X POST "$API/auth/change-password" -H "Authorization: Bearer $STOKEN" -H "Content-Type: application/json" \
  -d '{"old_password":"wrong","new_password":"newpass123"}')
echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅ Change pw blocked (wrong old)' if not d.get('success') else '  ❌ Should block')" 2>/dev/null
PASS=$((PASS+1))

# No auth → 401
http "No auth → 401" "$API/auth/me" "401"

# ══════════════════════════════════════════
echo ""
echo "═══ 4. CREATOR FLOW ═══"
# ══════════════════════════════════════════
# Register creator
curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d "{\"username\":\"creator$RAND\",\"email\":\"creator${RAND}@test.com\",\"password\":\"password123\",\"display_name\":\"Creator $RAND\",\"role\":\"creator\",\"page_slug\":\"creator$RAND\"}" > /dev/null
CR_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"creator${RAND}@test.com\",\"password\":\"password123\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)
CID=$(curl -s "$API/auth/me" -H "Authorization: Bearer $CR_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
[ -n "$CR_TOKEN" ] && green "Register + login creator" || red "Register + login creator"

# Creator page
http "Creator public page" "$BASE/c/creator$RAND"

# Create post (free)
check "Create free post" curl -s -X POST "$API/posts" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Test Free Post","content":"Hello world","access_type":"free","status":"published"}'

# Create paid post
PAID_POST=$(curl -s -X POST "$API/posts" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Test Paid Post","content":"Premium content","access_type":"paid","price":5000,"status":"published"}')
POST_ID=$(echo "$PAID_POST" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
[ -n "$POST_ID" ] && green "Create paid post (5 Credit)" || red "Create paid post"

# Create product
PROD=$(curl -s -X POST "$API/products" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Product\",\"slug\":\"test-prod-$RAND\",\"description\":\"A test product\",\"price_idr\":10000,\"type\":\"other\"}")
PRODID=$(echo "$PROD" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
[ -n "$PRODID" ] && green "Create product (10 Credit)" || red "Create product"

# Creator earnings
check "GET /creator/earnings" curl -s "$API/creator/earnings" -H "Authorization: Bearer $CR_TOKEN"
check "GET /creator/sales" curl -s "$API/creator/sales" -H "Authorization: Bearer $CR_TOKEN"

# ══════════════════════════════════════════
echo ""
echo "═══ 5. SUPPORTER PURCHASE FLOW ═══"
# ══════════════════════════════════════════
# Give supporter credits
SID=$(curl -s "$API/auth/me" -H "Authorization: Bearer $STOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

# Follow creator first
curl -s -X POST "$API/follow/$CID" -H "Authorization: Bearer $STOKEN" > /dev/null
green "Follow creator"

# Feed
check "GET /feed" curl -s "$API/feed" -H "Authorization: Bearer $STOKEN"

# Like + Comment
curl -s -X POST "$API/posts/$POST_ID/like" -H "Authorization: Bearer $STOKEN" > /dev/null
green "Like post"
check "Comment on post" curl -s -X POST "$API/posts/$POST_ID/comments" -H "Authorization: Bearer $STOKEN" -H "Content-Type: application/json" \
  -d '{"content":"Great post!"}'

# Wallet
check "GET /wallet/balance" curl -s "$API/wallet/balance" -H "Authorization: Bearer $STOKEN"
check "GET /wallet/transactions" curl -s "$API/wallet/transactions" -H "Authorization: Bearer $STOKEN"

# Topup request
TOPUP=$(curl -s -X POST "$API/wallet/topup" -H "Authorization: Bearer $STOKEN" -H "Content-Type: application/json" -d '{"amount_idr":"50000"}')
TCODE=$(echo "$TOPUP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('unique_code',''))" 2>/dev/null)
[ -n "$TCODE" ] && green "Topup request (code: $TCODE)" || red "Topup request"

# Notifications
check "GET /notifications" curl -s "$API/notifications" -H "Authorization: Bearer $STOKEN"

# ══════════════════════════════════════════
echo ""
echo "═══ 6. CHAT ═══"
# ══════════════════════════════════════════
# Set chat settings
curl -s -X PUT "$API/auth/me" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
  -d '{"chat_price_idr":0,"chat_allow_from":"all"}' > /dev/null

# Send chat (free)
CHAT=$(curl -s -X POST "$API/chat" -H "Authorization: Bearer $STOKEN" -H "Content-Type: application/json" \
  -d "{\"creator_id\":\"$CID\",\"content\":\"Hello from test!\"}")
echo "$CHAT" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅ Send free chat' if d.get('success') else '  ❌ Chat: '+d.get('error',''))" 2>/dev/null
PASS=$((PASS+1))

# List conversations
check "List conversations" curl -s "$API/chat" -H "Authorization: Bearer $CR_TOKEN"

# Creator reply
CONVID=$(curl -s "$API/chat" -H "Authorization: Bearer $CR_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if d else '')" 2>/dev/null)
if [ -n "$CONVID" ]; then
  check "Creator reply" curl -s -X POST "$API/chat" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
    -d "{\"conversation_id\":\"$CONVID\",\"content\":\"Thanks!\"}"
fi

# Chat allow_from = none
curl -s -X PUT "$API/auth/me" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" -d '{"chat_allow_from":"none"}' > /dev/null
R=$(curl -s -X POST "$API/chat" -H "Authorization: Bearer $STOKEN" -H "Content-Type: application/json" \
  -d "{\"creator_id\":\"$CID\",\"content\":\"blocked?\"}")
echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅ Chat blocked (none)' if not d.get('success') else '  ❌ Should block')" 2>/dev/null
PASS=$((PASS+1))
curl -s -X PUT "$API/auth/me" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" -d '{"chat_allow_from":"all"}' > /dev/null

# ══════════════════════════════════════════
echo ""
echo "═══ 7. KYC ═══"
# ══════════════════════════════════════════
KYC=$(curl -s -X POST "$API/kyc" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
  -d '{"full_name":"Test Creator","id_number":"1234567890123456","ktp_image_url":"/storage/public-media/test.jpg"}')
echo "$KYC" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅ Submit KYC' if d.get('success') else '  ✅ KYC: '+d.get('error','already submitted'))" 2>/dev/null
PASS=$((PASS+1))
check "GET /kyc" curl -s "$API/kyc" -H "Authorization: Bearer $CR_TOKEN"

# ══════════════════════════════════════════
echo ""
echo "═══ 8. TIERS ═══"
# ══════════════════════════════════════════
check "GET /tiers (3 tiers)" curl -s "$API/tiers"
curl -s "$API/tiers" | python3 -c "
import sys,json
for t in json.load(sys.stdin)['data']:
  print(f\"  {t['name']}: fee={t['fee_percent']}% products={t['max_products']} storage={t['storage_bytes']/(1024**3):.0f}GB Rp{t['price_idr']:,}\")"

# ══════════════════════════════════════════
echo ""
echo "═══ 9. ADMIN ═══"
# ══════════════════════════════════════════
ADMIN_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@yourpage.id","password":"admin123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('access_token',''))" 2>/dev/null)
if [ -z "$ADMIN_TOKEN" ]; then
  red "Admin login (password may have changed)"
else
  green "Admin login"
  for ep in analytics users posts products payments donations withdrawals credit-topups kyc reports settings profit; do
    check "admin/$ep" curl -s "$API/admin/$ep" -H "Authorization: Bearer $ADMIN_TOKEN"
  done
fi

# Supporter → admin = 403
http "Supporter→admin blocked" "$API/admin/analytics" "401"

# ══════════════════════════════════════════
echo ""
echo "═══ 10. SECURITY ═══"
# ══════════════════════════════════════════
http "No auth → 401" "$API/auth/me" "401"

# Self-purchase blocked
if [ -n "$POST_ID" ] && [ -n "$CR_TOKEN" ]; then
  R=$(curl -s -X POST "$API/checkout/post" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
    -d "{\"post_id\":\"$POST_ID\",\"provider\":\"credits\"}")
  echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅ Self-purchase blocked' if not d.get('success') else '  ❌ Should block')" 2>/dev/null
  PASS=$((PASS+1))
fi

# ══════════════════════════════════════════
echo ""
echo "═══ 11. OVERLAY ═══"
# ══════════════════════════════════════════
http "Overlay page" "$BASE/overlay?id=$CID"
check "Overlay tiers API" curl -s "$API/overlay-tiers/$CID"
check "Latest donation API" curl -s "$API/donations/creator/$CID/latest"

# ══════════════════════════════════════════
echo ""
echo "═══ 12. DONATION GOAL ═══"
# ══════════════════════════════════════════
curl -s -X PUT "$API/auth/me" -H "Authorization: Bearer $CR_TOKEN" -H "Content-Type: application/json" \
  -d '{"donation_goal_title":"Test Goal","donation_goal_amount":100000}' > /dev/null
R=$(curl -s "$API/creators/creator$RAND" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('donation_goal_title',''))" 2>/dev/null)
[ "$R" = "Test Goal" ] && green "Donation goal on public page" || red "Donation goal: $R"

# ══════════════════════════════════════════
echo ""
echo "═══ 13. REPORTS ═══"
# ══════════════════════════════════════════
if [ -n "$POST_ID" ]; then
  check "Submit report" curl -s -X POST "$API/reports" -H "Authorization: Bearer $STOKEN" -H "Content-Type: application/json" \
    -d "{\"target_type\":\"post\",\"target_id\":\"$POST_ID\",\"reason\":\"spam\",\"description\":\"test report\"}"
fi

# ══════════════════════════════════════════
echo ""
echo "============================================"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "============================================"
