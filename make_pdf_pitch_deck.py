#!/usr/bin/env python3
"""
Python script to generate a presentation pitch deck PDF for Tiketa without third-party dependencies.
Outputs: pitch_deck.pdf (10 landscape slides, A4 842x595 pt)
"""

import sys

class PDFBuilder:
    def __init__(self, filename="pitch_deck.pdf"):
        self.filename = filename
        self.pages = []  # list of byte streams
        self.width = 842
        self.height = 595

    def escape_text(self, text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    def new_page(self):
        stream = []
        # Background fill
        stream.append(self._rect(0, 0, self.width, self.height, fill=(0.04, 0.06, 0.11)))
        # Subtle top accent line
        stream.append(self._rect(0, self.height - 4, self.width, 4, fill=(0.49, 0.23, 0.93)))
        return stream

    def _rect(self, x, y, w, h, fill=None, stroke=None, stroke_width=1):
        s = []
        s.append(f"{stroke_width} w")
        if fill:
            s.append(f"{fill[0]:.3f} {fill[1]:.3f} {fill[2]:.3f} rg")
        if stroke:
            s.append(f"{stroke[0]:.3f} {stroke[1]:.3f} {stroke[2]:.3f} RG")
        s.append(f"{x:.1f} {y:.1f} {w:.1f} {h:.1f} re")
        if fill and stroke:
            s.append("B")
        elif fill:
            s.append("f")
        elif stroke:
            s.append("s")
        return " ".join(s)

    def _text(self, text, x, y, font="/F1", size=12, color=(1, 1, 1)):
        esc = self.escape_text(text)
        return (
            f"BT {font} {size} Tf "
            f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg "
            f"{x:.1f} {y:.1f} Td ({esc}) Tj ET"
        )

    def draw_header(self, page, title, badge_text, badge_color=(0.49, 0.23, 0.93)):
        # Top banner area
        # Badge
        bw = len(badge_text) * 6.5 + 16
        page.append(self._rect(self.width - 45 - bw, self.height - 42, bw, 20, fill=badge_color))
        page.append(self._text(badge_text, self.width - 45 - bw + 8, self.height - 37, font="/F2", size=9, color=(1, 1, 1)))
        # Main Title
        page.append(self._text(title, 45, self.height - 40, font="/F2", size=20, color=(1, 1, 1)))
        # Divider line
        page.append(self._rect(45, self.height - 50, self.width - 90, 1.5, fill=(0.14, 0.19, 0.28)))

    def draw_footer(self, page, slide_num, total=10):
        y = 25
        page.append(self._rect(45, y + 14, self.width - 90, 1, fill=(0.14, 0.19, 0.28)))
        page.append(self._text("Tiketa Protocol  |  Botchain Testnet (Chain ID 968)  |  https://scan.bohr.life", 45, y, font="/F1", size=9, color=(0.45, 0.52, 0.62)))
        page.append(self._text(f"Slide {slide_num} / {total}", self.width - 95, y, font="/F2", size=9, color=(0.58, 0.64, 0.72)))

    def draw_card(self, page, x, y, w, h, title, items, fill=(0.08, 0.12, 0.20), stroke=(0.18, 0.25, 0.36), title_color=(1, 1, 1), accent_bar=None):
        page.append(self._rect(x, y, w, h, fill=fill, stroke=stroke))
        if accent_bar:
            page.append(self._rect(x, y, 4, h, fill=accent_bar))
        # Title
        page.append(self._text(title, x + 16, y + h - 22, font="/F2", size=13, color=title_color))
        # Divider
        page.append(self._rect(x + 16, y + h - 28, w - 32, 0.8, fill=(0.18, 0.25, 0.36)))
        # Items / Bullet lines
        cy = y + h - 45
        for item in items:
            if item.startswith("- ") or item.startswith("* "):
                page.append(self._text(item[2:], x + 24, cy, font="/F1", size=10, color=(0.78, 0.84, 0.90)))
                # bullet dot
                page.append(self._rect(x + 16, cy + 3, 3, 3, fill=(0.22, 0.74, 0.97)))
            else:
                page.append(self._text(item, x + 16, cy, font="/F1", size=10, color=(0.78, 0.84, 0.90)))
            cy -= 16

    def draw_stat(self, page, x, y, w, h, num, label, sub=""):
        page.append(self._rect(x, y, w, h, fill=(0.09, 0.14, 0.24), stroke=(0.22, 0.30, 0.44)))
        page.append(self._text(num, x + 16, y + h - 35, font="/F2", size=24, color=(0.22, 0.74, 0.97)))
        page.append(self._text(label, x + 16, y + h - 52, font="/F2", size=10, color=(1, 1, 1)))
        if sub:
            page.append(self._text(sub, x + 16, y + 12, font="/F1", size=8.5, color=(0.58, 0.64, 0.72)))

    def compile_pdf(self):
        objects = []
        def add_obj(content):
            objects.append(content)
            return len(objects)

        # 1: Catalog, 2: Pages, 3: Font F1, 4: Font F2
        catalog_id = 1
        pages_id = 2
        f1_id = 3
        f2_id = 4

        page_ids = []
        stream_ids = []

        cur_id = 5
        for p in self.pages:
            page_ids.append(cur_id)
            stream_ids.append(cur_id + 1)
            cur_id += 2

        # Build raw strings
        obj_strs = {}
        obj_strs[catalog_id] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>"
        kids_str = " ".join([f"{pid} 0 R" for pid in page_ids])
        obj_strs[pages_id] = f"<< /Type /Pages /Kids [{kids_str}] /Count {len(page_ids)} >>"
        obj_strs[f1_id] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        obj_strs[f2_id] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"

        for i, stream_cmds in enumerate(self.pages):
            pid = page_ids[i]
            sid = stream_ids[i]
            stream_body = "\n".join(stream_cmds)
            stream_bytes = stream_body.encode('latin1')
            obj_strs[pid] = (
                f"<< /Type /Page /Parent {pages_id} 0 R "
                f"/MediaBox [0 0 {self.width} {self.height}] "
                f"/Contents {sid} 0 R "
                f"/Resources << /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R >> >> >>"
            )
            obj_strs[sid] = f"<< /Length {len(stream_bytes)} >>\nstream\n{stream_body}\nendstream"

        # Write final PDF
        out = bytearray()
        out.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = {}

        all_ids = sorted(obj_strs.keys())
        for oid in all_ids:
            offsets[oid] = len(out)
            content = obj_strs[oid]
            out.extend(f"{oid} 0 obj\n{content}\nendobj\n".encode('latin1'))

        xref_pos = len(out)
        max_id = max(all_ids)
        out.extend(f"xref\n0 {max_id + 1}\n0000000000 65535 f \n".encode('latin1'))
        for oid in range(1, max_id + 1):
            if oid in offsets:
                out.extend(f"{offsets[oid]:010d} 00000 n \n".encode('latin1'))
            else:
                out.extend(b"0000000000 65535 f \n")

        out.extend(
            f"trailer << /Size {max_id + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF\n".encode('latin1')
        )

        with open(self.filename, 'wb') as f:
            f.write(out)
        print(f"Generated {self.filename} ({len(out)} bytes, {len(self.pages)} slides)")

def build_pitch_deck():
    b = PDFBuilder("pitch_deck.pdf")

    # ==========================================
    # SLIDE 1: COVER
    # ==========================================
    p1 = b.new_page()
    # Hero container box
    p1.append(b._rect(45, 60, b.width - 90, b.height - 110, fill=(0.06, 0.09, 0.16), stroke=(0.18, 0.25, 0.38)))
    # Accent pill
    p1.append(b._rect(75, b.height - 130, 200, 24, fill=(0.49, 0.23, 0.93)))
    p1.append(b._text("DECENTRALIZED EVENT PROTOCOL", 85, b.height - 114, font="/F2", size=10, color=(1, 1, 1)))

    p1.append(b._text("TIKETA PROTOCOL", 75, b.height - 185, font="/F2", size=38, color=(1, 1, 1)))
    p1.append(b._text("Next-Generation On-Chain Event Ticketing on Botchain", 75, b.height - 218, font="/F2", size=16, color=(0.65, 0.55, 0.98)))

    desc1 = "Tiketa is an autonomous Web3 event protocol replacing predatory ticketing monopolies"
    desc2 = "with immutable ERC-1155 smart contracts, capped supplies, and exact native BOT settlement."
    p1.append(b._text(desc1, 75, b.height - 260, font="/F1", size=13, color=(0.78, 0.84, 0.90)))
    p1.append(b._text(desc2, 75, b.height - 280, font="/F1", size=13, color=(0.78, 0.84, 0.90)))

    # 3 Stat Cards on Cover
    b.draw_stat(p1, 75, 95, 210, 85, "ERC-1155", "Multi-Tier Capped Tickets", "Bytecode supply enforcement")
    b.draw_stat(p1, 310, 95, 210, 85, "3s Finality", "Fast Botchain Settlement", "Sub-cent transaction fees")
    b.draw_stat(p1, 545, 95, 210, 85, "100% P2P", "True Self-Custodial Assets", "Secondary resale & transfers enabled")

    b.draw_footer(p1, 1)
    b.pages.append(p1)

    # ==========================================
    # SLIDE 2: THE PROBLEM
    # ==========================================
    p2 = b.new_page()
    b.draw_header(p2, "The Problem: Legacy Ticketing is Broken", "INDUSTRY CRISIS", badge_color=(0.75, 0.15, 0.15))
    p2.append(b._text("The $75B global live events ticketing market suffers from systemic monopoly abuses, fraud, and extractive gatekeepers.", 45, b.height - 75, font="/F1", size=12, color=(0.75, 0.82, 0.90)))

    b.draw_card(p2, 45, 280, 360, 180, "1. Rampant Fraud & Counterfeiting", [
        "- Over $15B lost annually to fake tickets and scams.",
        "- Duplicate screenshot barcodes scanned at venue gates.",
        "- Fans arrive at sold-out stadiums only to be turned away.",
        "- Zero cryptographic provenance on legacy paper or static apps."
    ], accent_bar=(0.94, 0.27, 0.27))

    b.draw_card(p2, 435, 280, 360, 180, "2. Extortionate Hidden Middleman Fees", [
        "- Gatekeepers (Ticketmaster, Eventbrite) charge 15% - 35%.",
        "- Hidden convenience, processing, and facility surcharges.",
        "- Siphons immense revenue away from artists and venues.",
        "- Zero transparency into actual organizer pricing."
    ], accent_bar=(0.98, 0.62, 0.15))

    b.draw_card(p2, 45, 75, 360, 180, "3. Predatory Bot Scalping", [
        "- Automated sniper bots scoop inventory within milliseconds.",
        "- Tickets flipped on secondary markets at 300% - 1,000% markups.",
        "- Creators and performers receive 0% of secondary profits.",
        "- True fans priced out of concerts, sports, and live shows."
    ], accent_bar=(0.65, 0.45, 0.95))

    b.draw_card(p2, 435, 75, 360, 180, "4. Zero True Ownership & Arbitrary Lock-In", [
        "- Users hold non-custodial entries in proprietary databases.",
        "- Platforms arbitrarily lock, revoke, or cancel transfers.",
        "- Complex walled gardens prevent peer-to-peer flexibility.",
        "- Fans cannot gift or trade tickets without platform consent."
    ], accent_bar=(0.22, 0.74, 0.97))

    b.draw_footer(p2, 2)
    b.pages.append(p2)

    # ==========================================
    # SLIDE 3: THE SOLUTION
    # ==========================================
    p3 = b.new_page()
    b.draw_header(p3, "The Solution: The Tiketa Protocol", "TRUSTLESS PRIMITIVES", badge_color=(0.10, 0.65, 0.40))
    p3.append(b._text("Tiketa replaces extractive middlemen with transparent, decentralized smart contracts deployed on Botchain.", 45, b.height - 75, font="/F1", size=12, color=(0.75, 0.82, 0.90)))

    b.draw_card(p3, 45, 280, 360, 180, "Cryptographic Verifiability (ERC-1155)", [
        "- Each ticket tier is an on-chain token ID with capped supply.",
        "- Hard cap enforced at bytecode level (totalSupply + amt <= max).",
        "- Counterfeiting and screenshot duplication are impossible.",
        "- Permanent on-chain event logs for every ticket mint & transfer."
    ], fill=(0.08, 0.11, 0.22), stroke=(0.40, 0.30, 0.85), title_color=(0.65, 0.55, 0.98))

    b.draw_card(p3, 435, 280, 360, 180, "Exact Native BOT Settlement", [
        "- Built-in exact payment validation: msg.value == price * amount.",
        "- Rejects underpayment and overpayment automatically.",
        "- Native BOT settlement on Botchain eliminates currency friction.",
        "- Protected against reentrancy attacks via ReentrancyGuard."
    ], fill=(0.08, 0.11, 0.22), stroke=(0.15, 0.65, 0.45), title_color=(0.20, 0.85, 0.55))

    b.draw_card(p3, 45, 75, 360, 180, "Liquid Peer-to-Peer Ownership", [
        "- Tickets stay standard ERC-1155 tokens in user self-custody.",
        "- Full support for safeTransferFrom and safeBatchTransferFrom.",
        "- Resale and gifting remain fully open without platform freeze.",
        "- Secondary market freedom without centralized account bans."
    ], fill=(0.08, 0.11, 0.22), stroke=(0.20, 0.55, 0.85), title_color=(0.22, 0.74, 0.97))

    b.draw_card(p3, 435, 75, 360, 180, "Direct Organizer Sovereignty", [
        "- Organizers create tiers, set prices, and pause/activate sales.",
        "- Dynamic on-chain price adjustments in real time.",
        "- Instant revenue withdrawal directly to organizer wallet.",
        "- Zero platform approval required to claim ticket sales."
    ], fill=(0.08, 0.11, 0.22), stroke=(0.75, 0.55, 0.15), title_color=(0.98, 0.75, 0.20))

    b.draw_footer(p3, 3)
    b.pages.append(p3)

    # ==========================================
    # SLIDE 4: ARCHITECTURE & TECHNICAL STACK
    # ==========================================
    p4 = b.new_page()
    b.draw_header(p4, "Technical Architecture & Monorepo Stack", "PRODUCTION GRADE")

    b.draw_card(p4, 45, 230, 235, 270, "Smart Contracts", [
        "- Solidity ^0.8.24",
        "- Foundry Framework (forge, cast)",
        "- OpenZeppelin Contracts v5",
        "- ERC1155Supply & Ownable",
        "- ReentrancyGuard Protection",
        "- CEI Security Pattern",
        "- Typed Custom Errors",
        "- 25 / 25 Passing Foundry Tests"
    ], accent_bar=(0.49, 0.23, 0.93))

    b.draw_card(p4, 303, 230, 235, 270, "Frontend Web dApp", [
        "- React 18 + TypeScript",
        "- Vite Next-Gen Bundler",
        "- Tailwind CSS Glassmorphism",
        "- Ethers.js v6 Web3 Library",
        "- Auto Network Add / Switch",
        "- Real-time Explorer Linking",
        "- Dynamic Contract Address Override",
        "- Zero Heavy Dependencies"
    ], accent_bar=(0.22, 0.74, 0.97))

    b.draw_card(p4, 562, 230, 235, 270, "Botchain Infrastructure", [
        "- EVM-Compatible L1 Testnet",
        "- Chain ID: 968 (Hex: 0x3c8)",
        "- Native Token: BOT (18 dec)",
        "- RPC: https://rpc.bohr.life",
        "- Explorer: scan.bohr.life",
        "- ~3-Second Confirmation",
        "- Sub-Cent Gas Execution",
        "- 100% On-Chain Settlement"
    ], accent_bar=(0.10, 0.65, 0.40))

    # Architecture banner box
    p4.append(b._rect(45, 75, b.width - 90, 135, fill=(0.06, 0.09, 0.16), stroke=(0.18, 0.25, 0.38)))
    p4.append(b._text("DEPLOYED PROTOCOL VERIFICATION & INVARIANTS", 65, 185, font="/F2", size=11, color=(0.65, 0.55, 0.98)))
    p4.append(b._text("Contract Address:  0x917524fccd12d61a36918506d5e80679699e534f (Botchain Chain 968)", 65, 160, font="/F2", size=10.5, color=(1, 1, 1)))
    p4.append(b._text("buy(id, amount): Checks totalSupply(id) + amount <= maxSupply & msg.value == price * amount", 65, 140, font="/F1", size=10, color=(0.78, 0.84, 0.90)))
    p4.append(b._text("withdraw(): Transfers address(this).balance to owner() using nonReentrant & Checks-Effects-Interactions", 65, 120, font="/F1", size=10, color=(0.78, 0.84, 0.90)))
    p4.append(b._text("safeTransferFrom(): Native ERC-1155 peer-to-peer transferability for ticket secondary resale", 65, 100, font="/F1", size=10, color=(0.78, 0.84, 0.90)))

    b.draw_footer(p4, 4)
    b.pages.append(p4)

    # ==========================================
    # SLIDE 5: USER EXPERIENCE & FEATURES
    # ==========================================
    p5 = b.new_page()
    b.draw_header(p5, "User Experience & Core dApp Features", "LIVE DAPP INTERFACE", badge_color=(0.10, 0.65, 0.40))

    b.draw_card(p5, 45, 80, 360, 415, "Attendee Experience", [
        "Interactive Ticket Marketplace:",
        "- Tier cards displaying tier ID, name, and live price in BOT.",
        "- Visual progress bars showing remaining vs. max supply.",
        "- Sold-out & sales paused badges updated live.",
        "",
        "Streamlined Minting Flow:",
        "- Quantity selectors with real-time total BOT calculation.",
        "- Auto-prompts wallet to add & switch to Botchain testnet.",
        "- Modal transaction alerts with direct links to Bohr explorer.",
        "",
        "My Tickets Portfolio:",
        "- Live query of all owned ERC-1155 token IDs and balances.",
        "- Peer-to-peer ticket transfer modal to send tickets to any wallet.",
        "- Resale-ready standard tokens in self-custody."
    ], accent_bar=(0.22, 0.74, 0.97))

    b.draw_card(p5, 435, 80, 360, 415, "Organizer Dashboard", [
        "Role-Guarded Administration:",
        "- Access restricted to contract owner (isOwner check).",
        "- Displays accumulated BOT proceeds held in the treasury.",
        "- Single-click revenue withdrawal directly to organizer wallet.",
        "",
        "Dynamic Tier Configuration:",
        "- Create new ticket tiers (ID, name, max supply, price in BOT).",
        "- Instant on-chain event emission (TierCreated).",
        "- No redeployment required to add tiers or events.",
        "",
        "Live Market Controls:",
        "- Inline price update form (setPrice) to adapt to market demand.",
        "- One-click sales toggle (setTierActive) to pause or resume sales.",
        "- Complete inventory management and supply visibility."
    ], accent_bar=(0.49, 0.23, 0.93))

    b.draw_footer(p5, 5)
    b.pages.append(p5)

    # ==========================================
    # SLIDE 6: TRACTION & ON-CHAIN VALIDATION
    # ==========================================
    p6 = b.new_page()
    b.draw_header(p6, "Live Traction & On-Chain Validation", "TESTNET DEPLOYED", badge_color=(0.10, 0.65, 0.40))

    b.draw_stat(p6, 45, 410, 175, 85, "25 / 25", "Foundry Tests Passed", "Unit & fuzz test suite")
    b.draw_stat(p6, 237, 410, 175, 85, "25", "Tickets Minted", "On-chain tier 1 mints")
    b.draw_stat(p6, 429, 410, 175, 85, "24", "Contract Buy Txs", "Direct contract purchases")
    b.draw_stat(p6, 621, 410, 175, 85, "100%", "Tx Success Rate", "All confirmed on Botchain")

    # Table of live status
    p6.append(b._rect(45, 90, b.width - 90, 300, fill=(0.06, 0.09, 0.16), stroke=(0.18, 0.25, 0.38)))
    p6.append(b._text("VERIFIED BOTCHAIN TESTNET METRICS", 65, 365, font="/F2", size=12, color=(0.65, 0.55, 0.98)))

    # Table rows
    table_data = [
        ("Smart Contract Address", "0x917524fccd12d61a36918506d5e80679699e534f", "Verified on Bohr Explorer"),
        ("Tier 1: General Admission", "Cap: 500  |  Minted: 25  |  Remaining: 475  |  Price: 0.01 BOT", "Active & Selling"),
        ("Tier 2: VIP Experience", "Cap: 50  |  Minted: 0  |  Remaining: 50  |  Price: 0.05 BOT", "Active & Selling"),
        ("Contract Treasury Balance", "0.25 BOT accumulated from on-chain ticket sales", "Ready for withdrawal"),
        ("Wallet 1 (0xf391...0801)", "8 Tier-1 tickets owned  |  Nonce: 16  |  Balance: 0.2075 BOT", "8 Buys Confirmed"),
        ("Wallet 2 (0x6D6b...5C96)", "8 Tier-1 tickets owned  |  Nonce: 16  |  Balance: 0.2075 BOT", "8 Buys Confirmed"),
        ("Wallet 3 (0xE13c...626C)", "8 Tier-1 tickets owned  |  Nonce: 16  |  Balance: 0.2075 BOT", "8 Buys Confirmed"),
    ]

    ty = 335
    for item, val, stat in table_data:
        p6.append(b._rect(65, ty - 6, b.width - 130, 26, fill=(0.08, 0.12, 0.20), stroke=(0.15, 0.20, 0.30)))
        p6.append(b._text(item, 75, ty, font="/F2", size=9.5, color=(1, 1, 1)))
        p6.append(b._text(val, 240, ty, font="/F1", size=9.5, color=(0.78, 0.84, 0.90)))
        p6.append(b._text(stat, 640, ty, font="/F2", size=9.5, color=(0.20, 0.85, 0.55)))
        ty -= 32

    b.draw_footer(p6, 6)
    b.pages.append(p6)

    # ==========================================
    # SLIDE 7: MARKET OPPORTUNITY & BUSINESS MODEL
    # ==========================================
    p7 = b.new_page()
    b.draw_header(p7, "Market Opportunity & Business Model", "SUSTAINABLE UNIT ECONOMICS")

    b.draw_stat(p7, 45, 385, 235, 105, "$85.3B", "Global Ticketing TAM by 2028", "Expanding at 6.5% annual CAGR")
    b.draw_stat(p7, 303, 385, 235, 105, "$12B+", "Web3 Ticketing Market by 2030", "Rapid migration to smart contract passes")
    b.draw_stat(p7, 562, 385, 235, 105, "90%+", "Fee Savings vs. Monopolies", "Lower fees for creators and fans")

    b.draw_card(p7, 45, 80, 752, 280, "Three Robust Revenue Streams", [
        "1. Primary Mint Protocol Fee (0.5% - 1.5%):",
        "- Micro-fee charged on primary ticket mints; provides massive cost savings over Ticketmaster's 20%+ cut.",
        "- Generates consistent protocol treasury inflow directly correlated with event volume.",
        "",
        "2. Secondary Resale Royalties (EIP-2981):",
        "- Configurable 2.5% to 5.0% royalty on secondary ticket resales split between protocol and creators.",
        "- Turns secondary market scalping into a perpetual funding stream for event organizers.",
        "",
        "3. Enterprise White-Label & Venue Solutions:",
        "- Dedicated white-label event portal deployments and custom smart contract factories.",
        "- Turnkey venue access control APIs, real-time demand analytics, and sponsor marketing portals."
    ], accent_bar=(0.22, 0.74, 0.97))

    b.draw_footer(p7, 7)
    b.pages.append(p7)

    # ==========================================
    # SLIDE 8: COMPETITIVE ADVANTAGE
    # ==========================================
    p8 = b.new_page()
    b.draw_header(p8, "Competitive Advantage & Differentiation", "UNRIVALED POSITIONING")

    # Full Matrix Table
    p8.append(b._rect(45, 100, b.width - 90, 395, fill=(0.06, 0.09, 0.16), stroke=(0.18, 0.25, 0.38)))

    # Header Row
    p8.append(b._rect(45, 455, b.width - 90, 40, fill=(0.09, 0.14, 0.24)))
    p8.append(b._text("Feature Dimension", 65, 470, font="/F2", size=11, color=(1, 1, 1)))
    p8.append(b._text("Ticketmaster / Eventbrite", 240, 470, font="/F2", size=11, color=(0.95, 0.45, 0.45)))
    p8.append(b._text("YellowHeart / SeatGeek", 450, 470, font="/F2", size=11, color=(0.95, 0.75, 0.35)))
    p8.append(b._text("TIKETA (BOTCHAIN)", 660, 470, font="/F2", size=11, color=(0.35, 0.85, 0.55)))

    matrix_rows = [
        ("Transaction Fee", "15% - 35% (Extortionate)", "5% - 10%", "< 1.5% (Disruptive)"),
        ("Settlement Speed", "Days to Weeks (Delayed)", "Minutes", "~3 Seconds (Instant)"),
        ("Asset Custody", "Centralized Database", "Semi-Custodial", "100% Self-Custodial (Web3)"),
        ("Supply Transparency", "Zero (Opaque Black Box)", "Partial", "100% Bytecode Enforced"),
        ("Gas Cost per Mint", "N/A (Hidden Platform Fees)", "High ($2 - $15 on ETH)", "Sub-Cent (< $0.001 on Botchain)"),
        ("Secondary Resale Rights", "Strictly Banned / Locked", "Proprietary App Only", "Open ERC-1155 Standard"),
        ("Organizer Royalties", "0% on Resales", "Limited", "Automated On-Chain Payouts"),
        ("Code Transparency", "Closed Source", "Proprietary", "100% Auditable Open Source"),
    ]

    my = 415
    for feat, tm, yh, tk in matrix_rows:
        p8.append(b._rect(45, my - 6, b.width - 90, 35, fill=(0.07, 0.10, 0.18) if (my//35)%2==0 else (0.05, 0.08, 0.14)))
        p8.append(b._text(feat, 65, my + 6, font="/F2", size=10, color=(1, 1, 1)))
        p8.append(b._text(tm, 240, my + 6, font="/F1", size=10, color=(0.85, 0.55, 0.55)))
        p8.append(b._text(yh, 450, my + 6, font="/F1", size=10, color=(0.85, 0.75, 0.55)))
        p8.append(b._text(tk, 660, my + 6, font="/F2", size=10, color=(0.20, 0.85, 0.55)))
        my -= 38

    b.draw_footer(p8, 8)
    b.pages.append(p8)

    # ==========================================
    # SLIDE 9: STRATEGIC ROADMAP
    # ==========================================
    p9 = b.new_page()
    b.draw_header(p9, "Strategic Roadmap & Milestone Execution", "EXECUTION PLAN")

    b.draw_card(p9, 45, 90, 235, 400, "Phase 1: Foundation", [
        "[COMPLETED - Q4 2026]",
        "",
        "- Core ERC-1155 smart contract.",
        "- Supply cap & exact payment rules.",
        "- OpenZeppelin v5 security modules.",
        "- Foundry test suite (25/25 passed).",
        "- Deploy script with cast keystore.",
        "- Botchain testnet deployment.",
        "- Full React 18 + Vite + Tailwind dApp.",
        "- 24 on-chain buy txs verified live."
    ], accent_bar=(0.10, 0.65, 0.40))

    b.draw_card(p9, 303, 90, 235, 400, "Phase 2: Scale", [
        "[IN PROGRESS - Q1 2027]",
        "",
        "- EIP-2981 secondary royalty payouts.",
        "- Decentralized metadata on IPFS.",
        "- Multi-event factory smart contract.",
        "- Venue entrance scanner web app.",
        "- Advanced organizer sales analytics.",
        "- Smart contract security audits.",
        "- Botchain Mainnet deployment.",
        "- First live conference pilot."
    ], accent_bar=(0.22, 0.74, 0.97))

    b.draw_card(p9, 562, 90, 235, 400, "Phase 3: Adoption", [
        "[PLANNED - Q2 2027]",
        "",
        "- Fiat credit card on-ramp to mints.",
        "- Progressive Web App (PWA) with alerts.",
        "- POAP soulbound attendance badges.",
        "- Ticket staking & loyalty perks.",
        "- Secondary marketplace liquidity pool.",
        "- Decentralized organizer DAO.",
        "- Global festival partnerships.",
        "- SDK for third-party venue apps."
    ], accent_bar=(0.49, 0.23, 0.93))

    b.draw_footer(p9, 9)
    b.pages.append(p9)

    # ==========================================
    # SLIDE 10: CONCLUSION & SUMMARY
    # ==========================================
    p10 = b.new_page()
    b.draw_header(p10, "Invest in the Future of Live Events", "GET IN TOUCH", badge_color=(0.10, 0.65, 0.40))

    p10.append(b._rect(45, 80, b.width - 90, 415, fill=(0.06, 0.09, 0.16), stroke=(0.18, 0.25, 0.38)))

    p10.append(b._text("Tiketa is Live, Tested, and Proven on Botchain.", 75, 450, font="/F2", size=24, color=(1, 1, 1)))

    concl_1 = "By replacing legacy ticketing gatekeepers with mathematical smart contract guarantees,"
    concl_2 = "Tiketa empowers event organizers and fans with unprecedented fairness, zero fraud,"
    concl_3 = "sub-cent transaction fees, and genuine digital asset ownership."
    p10.append(b._text(concl_1, 75, 415, font="/F1", size=13, color=(0.78, 0.84, 0.90)))
    p10.append(b._text(concl_2, 75, 395, font="/F1", size=13, color=(0.78, 0.84, 0.90)))
    p10.append(b._text(concl_3, 75, 375, font="/F1", size=13, color=(0.78, 0.84, 0.90)))

    # Key links card
    p10.append(b._rect(75, 120, b.width - 150, 220, fill=(0.08, 0.12, 0.22), stroke=(0.49, 0.23, 0.93)))
    p10.append(b._text("ON-CHAIN DETAILS & REPOSITORY LINKS", 95, 310, font="/F2", size=13, color=(0.65, 0.55, 0.98)))

    p10.append(b._text("Verified Smart Contract:", 95, 275, font="/F2", size=11, color=(1, 1, 1)))
    p10.append(b._text("0x917524fccd12d61a36918506d5e80679699e534f", 270, 275, font="/F1", size=11, color=(0.65, 0.55, 0.98)))

    p10.append(b._text("Network:", 95, 245, font="/F2", size=11, color=(1, 1, 1)))
    p10.append(b._text("Botchain Testnet (Chain ID: 968 | Native Token: BOT | RPC: https://rpc.bohr.life)", 270, 245, font="/F1", size=11, color=(0.78, 0.84, 0.90)))

    p10.append(b._text("Block Explorer:", 95, 215, font="/F2", size=11, color=(1, 1, 1)))
    p10.append(b._text("https://scan.bohr.life/address/0x917524fccd12d61a36918506d5e80679699e534f", 270, 215, font="/F1", size=11, color=(0.22, 0.74, 0.97)))

    p10.append(b._text("Code Architecture:", 95, 185, font="/F2", size=11, color=(1, 1, 1)))
    p10.append(b._text("Foundry Smart Contracts (Solidity 0.8.24) + React 18 / Vite / Tailwind Web App", 270, 185, font="/F1", size=11, color=(0.78, 0.84, 0.90)))

    p10.append(b._text("Test Verification:", 95, 155, font="/F2", size=11, color=(1, 1, 1)))
    p10.append(b._text("25 / 25 Passing Foundry Unit & Fuzz Tests  |  24 Live Contract Buys Confirmed", 270, 155, font="/F2", size=11, color=(0.20, 0.85, 0.55)))

    b.draw_footer(p10, 10)
    b.pages.append(p10)

    # Output PDF
    b.compile_pdf()

if __name__ == "__main__":
    build_pitch_deck()
