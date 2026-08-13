"""
app/seed.py — Standalone script to populate demo data.

Run from the backend/ directory:
    python -m app.seed

Populates:
  - 4 participants (reused across meetings)
  - 4 meetings with realistic data
  - Full transcript segments per meeting
  - Summaries, key topics, action items
"""
from __future__ import annotations

import datetime
import sys

from app.database import Base, SessionLocal, engine
from app.models import (
    ActionItem,
    KeyTopic,
    Meeting,
    Participant,
    Summary,
    TranscriptSegment,
    meeting_participants,
)

# Sample royalty-free audio URL (BBC sound effects / archive.org)
SAMPLE_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
SAMPLE_AUDIO_URL_2 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
SAMPLE_AUDIO_URL_3 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
SAMPLE_AUDIO_URL_4 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"


def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Check if already seeded ───────────────────────────────────────────
        if db.query(Meeting).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # ── Participants ──────────────────────────────────────────────────────
        alice = Participant(name="Alice Chen", email="alice@acme.com")
        bob = Participant(name="Bob Martinez", email="bob@acme.com")
        carol = Participant(name="Carol Singh", email="carol@acme.com")
        david = Participant(name="David Kim", email="david@acme.com")

        for p in [alice, bob, carol, david]:
            db.add(p)
        db.flush()

        # ── Meeting 1: Q3 Product Roadmap Planning ────────────────────────────
        m1 = Meeting(
            title="Q3 Product Roadmap Planning",
            date=datetime.datetime(2024, 7, 15, 10, 0, 0),
            duration_seconds=3420,  # 57 minutes
            media_url=SAMPLE_AUDIO_URL,
        )
        m1.participants = [alice, bob, carol]
        db.add(m1)
        db.flush()

        m1_segments = [
            (alice, 0.0, 18.5, "Good morning everyone. Let's get started with the Q3 roadmap. I want to make sure we cover the new dashboard feature, the API improvements, and the mobile app updates."),
            (bob, 18.5, 42.0, "Thanks Alice. I've been reviewing the feedback from our top customers and dashboard performance is definitely the number one pain point. Users are reporting load times of up to 8 seconds on the analytics page."),
            (carol, 42.0, 67.0, "That tracks with what I'm seeing in the telemetry. The issue is we're making 12 separate API calls when the page loads. We should be batching those. I think we can get that down to 2-3 calls maximum."),
            (alice, 67.0, 95.0, "Great point Carol. Can you own the API batching initiative? I'm thinking we target a 70% reduction in load time by end of Q3. That would mean getting down to roughly 2 seconds."),
            (carol, 95.0, 120.0, "Yeah, I can take that on. I'll need help from the backend team though. Bob, can you loop in David and get him up to speed on the current architecture?"),
            (bob, 120.0, 148.0, "Absolutely. David and I have a sync scheduled for Thursday, I'll add the API batching discussion to the agenda. We should also talk about caching strategy — I think Redis could help here."),
            (alice, 148.0, 182.0, "Good. Now let's talk about the mobile app. We're behind on iOS and the App Store reviews have been rough lately. Three-star average is not where we want to be."),
            (bob, 182.0, 215.0, "The push notification bugs are the main culprit. We fixed the Android issues last sprint but iOS is still broken. The root cause is the notification payload format changed in iOS 17 and we haven't updated our SDK."),
            (carol, 215.0, 247.0, "I tested a fix yesterday actually. The issue is we're using the deprecated APNs token format. Switching to the new JWT-based authentication resolves it in my local testing. I can have a PR up by tomorrow."),
            (alice, 247.0, 278.0, "Carol, that's amazing. Let's prioritize that for this sprint — ship it by Friday. What about the onboarding flow? I heard from Sarah in Sales that new users are dropping off at step three."),
            (bob, 278.0, 310.0, "Yeah the step three dropout is real. The data shows a 43% abandonment rate at the 'Connect your calendar' step. I think users don't understand why we need calendar access. The copy is really confusing."),
            (carol, 310.0, 340.0, "We should A/B test a simplified version. Maybe make calendar connection optional at first and let them come back to it. Show the value of the feature before asking for permissions."),
            (alice, 340.0, 372.0, "I love that idea. Let's make calendar connection optional in the onboarding flow. Bob, can you work with the design team to mock up an alternative onboarding flow? I want to see options by next Wednesday."),
            (bob, 372.0, 400.0, "Will do. Should we also discuss the enterprise SSO feature? We've had three enterprise prospects ask about it in the last two weeks. It keeps coming up in sales calls."),
            (alice, 400.0, 435.0, "Yes, SSO is on the roadmap but for Q4. Let's not get distracted. Our Q3 focus is performance and mobile. Once we nail those, we'll be in a much better position to sell into enterprise accounts."),
            (carol, 435.0, 465.0, "Agreed. Let me also flag one more thing — our test coverage is at 45%. We really should get that up to at least 70% before we ship major features. I've been writing tests for the new API but it's slow going."),
            (bob, 465.0, 495.0, "I agree with Carol. Can we allocate 20% of sprint capacity to tech debt and testing? I know it's not glamorous but it'll save us from firefighting later."),
            (alice, 495.0, 530.0, "Deal. 20% tech debt allocation starting next sprint. Alright, let's wrap up. Action items: Carol owns API batching and the iOS push notification fix. Bob creates onboarding mock-ups and loops in David. I'll send a summary email to the whole team."),
            (bob, 530.0, 558.0, "Sounds good. One last thing — should we set up a mid-Q3 checkpoint? Maybe in six weeks to see how we're tracking against these goals?"),
            (alice, 558.0, 590.0, "Great idea. I'll schedule a mid-Q3 review for late August. Same group, one hour. I'll send a calendar invite this afternoon. Thanks everyone, really productive session today."),
        ]

        for i, (speaker, start, end, text) in enumerate(m1_segments):
            db.add(TranscriptSegment(
                meeting_id=m1.id,
                speaker_id=speaker.id,
                start_time_seconds=start,
                end_time_seconds=end,
                text=text,
                order_index=i,
            ))

        db.add(Summary(
            meeting_id=m1.id,
            overview_text=(
                "The Q3 product roadmap planning session focused on three key areas: dashboard performance, "
                "mobile app stability, and onboarding improvements. Carol will lead the API batching initiative "
                "to reduce page load times by 70% and will ship an iOS push notification fix by Friday. "
                "Bob will coordinate with David on backend architecture and create new onboarding mockups with "
                "an optional calendar connection flow. The team agreed to allocate 20% of sprint capacity to "
                "tech debt and testing, and scheduled a mid-Q3 checkpoint review for late August."
            ),
            generated_by="seeded",
        ))

        for i, topic in enumerate(["Dashboard Performance", "Mobile App (iOS)", "Onboarding Flow", "Tech Debt & Testing", "Q3 Goals"]):
            db.add(KeyTopic(meeting_id=m1.id, topic=topic, order_index=i))

        action_items_m1 = [
            (carol, "Lead API batching initiative — reduce load time by 70% by end of Q3", False),
            (carol, "Ship iOS push notification fix PR by Friday", False),
            (bob, "Create alternative onboarding mock-ups with optional calendar step by Wednesday", False),
            (bob, "Loop in David Kim on API batching and backend architecture — add to Thursday sync", True),
            (alice, "Send Q3 roadmap summary email to the whole team", True),
            (alice, "Schedule mid-Q3 checkpoint review for late August", False),
        ]

        for assignee, text, completed in action_items_m1:
            db.add(ActionItem(
                meeting_id=m1.id,
                assignee_id=assignee.id,
                text=text,
                is_completed=completed,
            ))

        # ── Meeting 2: Customer Onboarding Deep Dive ──────────────────────────
        m2 = Meeting(
            title="Customer Onboarding Deep Dive",
            date=datetime.datetime(2024, 7, 22, 14, 30, 0),
            duration_seconds=2700,  # 45 minutes
            media_url=SAMPLE_AUDIO_URL_2,
        )
        m2.participants = [bob, carol, david]
        db.add(m2)
        db.flush()

        m2_segments = [
            (bob, 0.0, 25.0, "Thanks for joining everyone. Today we're going deep on the onboarding dropout problem. As I mentioned in Slack, we're losing 43% of new users at the calendar connection step. Carol has some data to share first."),
            (carol, 25.0, 58.0, "Right. So I pulled the funnel data for the last 90 days. We have 12,400 new signups. Of those, 78% complete step one — entering their name and email. 71% complete step two — setting their password and profile photo. Then it drops sharply. Only 41% complete step three, which is the calendar connection."),
            (david, 58.0, 88.0, "That's a really sharp drop. Are we seeing any patterns in who drops off? Like, are enterprise users more likely to connect their calendar than individual users?"),
            (carol, 88.0, 120.0, "Great question David. Individual users drop off at 49%, enterprise users at only 22%. So enterprise users are more motivated, probably because their IT team has already briefed them. Individual users don't understand why we need calendar access."),
            (bob, 120.0, 155.0, "That confirms my hypothesis. The problem is consent and value proposition. We're asking for calendar permission before we've shown what calendar integration actually does for you. It's like asking someone to sign a lease before showing them the apartment."),
            (david, 155.0, 185.0, "So the fix is to demonstrate the value first. Could we show a preview of what their meeting list would look like with sample data, before asking for the real calendar connection?"),
            (carol, 185.0, 215.0, "Yes! I love that. We could use sample meetings — like what you see in our demo environment — to show the full product experience before they commit. Then offer calendar connection as the unlock to see their real data."),
            (bob, 215.0, 248.0, "That's essentially a demo-first onboarding. Let me sketch this out. New user signs up. Step one is still name and email. Step two is a product tour using sample data — our best-looking demo meetings. Step three becomes 'connect your calendar to see YOUR meetings'."),
            (david, 248.0, 278.0, "I can build the sample data injection on the backend. We could pre-populate their account with 3-4 demo meetings when they sign up, then replace them with real data when they connect their calendar."),
            (carol, 278.0, 308.0, "That's elegant. And we can track whether users who see the demo meetings are more likely to connect their calendar. It becomes an A/B test baseline versus the new flow."),
            (bob, 308.0, 340.0, "Exactly. I'll mock up both flows in Figma and we can get Alice's sign-off. David, can you estimate the backend work? I'm hoping this is a one-sprint project."),
            (david, 340.0, 370.0, "Backend work is probably 3-4 days. Creating the sample data templates, the seeding logic on signup, and the cleanup flow when they connect their real calendar. The tricky part is making sure the sample data doesn't linger."),
            (carol, 370.0, 398.0, "For cleanup we could tag sample meetings with a flag, then delete them when the first real calendar sync runs. Pretty clean."),
            (bob, 398.0, 425.0, "Great. Let's also make sure we add the ability to dismiss the onboarding steps — some users just want to get into the product and figure it out themselves. Forcing them through 5 steps is frustrating."),
            (david, 425.0, 455.0, "Agreed. A skip button on every step with a 'complete later' option in settings. That way we don't lose the users who prefer self-exploration."),
            (carol, 455.0, 485.0, "One more thing I want to flag — we should add micro-animations to the onboarding steps. Our current onboarding is very static. Little things like a confetti pop when they complete a step go a long way for engagement."),
            (bob, 485.0, 515.0, "100%. Delight matters in onboarding. Alright, let me summarize. David builds the sample data backend, I create the Figma mocks for both flows, Carol sets up the A/B test framework, and we reconvene in two weeks to review progress."),
        ]

        for i, (speaker, start, end, text) in enumerate(m2_segments):
            db.add(TranscriptSegment(
                meeting_id=m2.id,
                speaker_id=speaker.id,
                start_time_seconds=start,
                end_time_seconds=end,
                text=text,
                order_index=i,
            ))

        db.add(Summary(
            meeting_id=m2.id,
            overview_text=(
                "The team analyzed the 43% dropout rate at the calendar connection step in onboarding. "
                "Data shows individual users (49% dropout) are less motivated than enterprise users (22% dropout), "
                "primarily because the value of calendar integration isn't demonstrated upfront. "
                "The proposed solution is a demo-first onboarding flow: pre-populate new accounts with sample "
                "meetings to showcase the product, then offer calendar connection to replace demo data with real meetings. "
                "David will build the backend sample data injection, Bob will create Figma mockups for both flows, "
                "and Carol will set up the A/B testing framework."
            ),
            generated_by="seeded",
        ))

        for i, topic in enumerate(["Onboarding Funnel Analysis", "Demo-First Onboarding", "Sample Data Strategy", "A/B Testing", "UX Delight"]):
            db.add(KeyTopic(meeting_id=m2.id, topic=topic, order_index=i))

        action_items_m2 = [
            (david, "Build sample data injection backend for new user signups (3-4 days estimate)", False),
            (bob, "Create Figma mockups for both old and new onboarding flows for Alice's sign-off", False),
            (carol, "Set up A/B test framework to compare old vs new onboarding completion rates", False),
            (david, "Implement skip/dismiss button on all onboarding steps with 'complete later' in settings", False),
            (carol, "Add micro-animation (confetti) for step completion in onboarding", True),
        ]

        for assignee, text, completed in action_items_m2:
            db.add(ActionItem(
                meeting_id=m2.id,
                assignee_id=assignee.id,
                text=text,
                is_completed=completed,
            ))

        # ── Meeting 3: Engineering Retrospective Sprint 24 ────────────────────
        m3 = Meeting(
            title="Engineering Retrospective — Sprint 24",
            date=datetime.datetime(2024, 8, 5, 11, 0, 0),
            duration_seconds=2100,  # 35 minutes
            media_url=SAMPLE_AUDIO_URL_3,
        )
        m3.participants = [alice, bob, carol, david]
        db.add(m3)
        db.flush()

        m3_segments = [
            (alice, 0.0, 22.0, "Welcome to the Sprint 24 retro. We're doing this in the classic format: what went well, what didn't, and what we'll do differently. Carol, can you kick off with the positives?"),
            (carol, 22.0, 52.0, "Sure! Highlights from Sprint 24: we shipped the iOS push notification fix on time, test coverage went from 45% to 58%, and the API batching prototype reduced our test endpoint response time by 60%. Really solid sprint technically."),
            (david, 52.0, 80.0, "I want to add — the team communication this sprint was really good. We used the shared Slack channel to flag blockers early and I felt like we resolved issues faster than usual. The daily standups were shorter too, which I appreciated."),
            (bob, 80.0, 108.0, "Agreed on comms. I also want to call out Carol's PR turnaround time — she reviewed 14 pull requests this sprint and most got feedback within 4 hours. That's exceptional. It really kept the team unblocked."),
            (carol, 108.0, 130.0, "Thank you Bob, that means a lot. Okay what didn't go well. I'll start: we missed the deadline on the onboarding redesign. We said we'd have mocks to Alice by Wednesday but they went out Friday."),
            (bob, 130.0, 160.0, "That was partially my fault. I underestimated how long the Figma work would take. The new demo-first flow has a lot of states to design — empty states, loading states, error states. I should have broken it into two deliverables."),
            (david, 160.0, 190.0, "On the backend side, I hit a blocker with the sample data seeding. I was using transactions incorrectly and it was causing intermittent failures. Lost about two days debugging that."),
            (alice, 190.0, 220.0, "How did we not catch that in the daily standup David?"),
            (david, 220.0, 248.0, "Honestly I thought I was close to a fix each day, so I kept saying I'd have it resolved by end of day. Classic optimism bias. Next time I'll raise it as a blocker after 4 hours, not two days."),
            (carol, 248.0, 275.0, "That's a good rule — 4 hour blocker rule. If you've been stuck on something for 4 hours, you have to post in the blockers channel. Everyone agrees to respond within 2 hours."),
            (bob, 275.0, 300.0, "I love that. Let's make that an official team norm. The other thing I want to flag is the review queue got backed up mid-sprint. We had 8 PRs waiting for review on Wednesday and people were getting blocked."),
            (alice, 300.0, 330.0, "What's the root cause there? Is it a capacity issue or a process issue?"),
            (carol, 330.0, 358.0, "Bit of both. We need to designate a review rotation so it doesn't fall on the same people. And PRs over 400 lines should be split — large PRs get reviewed slower because they're mentally taxing."),
            (david, 358.0, 385.0, "I'll set up a PR review rotation in the team docs. We rotate the 'review duty' role weekly — that person prioritizes PR reviews over other work for that week."),
            (alice, 385.0, 415.0, "I like that. Alright, action items: David sets up the PR rotation doc, Carol documents the 4-hour blocker rule in team norms, Bob will break large design deliverables into smaller sub-tasks going forward. Any other items?"),
            (bob, 415.0, 440.0, "One more — can we start doing sprint demos? Like an internal 15-minute show-and-tell at the end of each sprint. It helps the whole team see what shipped and creates a sense of momentum."),
            (alice, 440.0, 468.0, "I love that idea. Let's do sprint demos every other Friday. 15 minutes, everyone shows what they built. I'll add it to the team calendar. Great retro everyone, I feel good about Sprint 25."),
        ]

        for i, (speaker, start, end, text) in enumerate(m3_segments):
            db.add(TranscriptSegment(
                meeting_id=m3.id,
                speaker_id=speaker.id,
                start_time_seconds=start,
                end_time_seconds=end,
                text=text,
                order_index=i,
            ))

        db.add(Summary(
            meeting_id=m3.id,
            overview_text=(
                "Sprint 24 retrospective covered key wins including the on-time iOS fix, improved test coverage "
                "(45% → 58%), and a 60% API response time improvement. The main challenges were a missed onboarding "
                "design deadline due to scope underestimation, and a 2-day debugging session on backend sample data "
                "seeding. The team adopted two new norms: a 4-hour blocker rule (post in blockers channel after "
                "4 hours stuck) and a weekly PR review rotation to prevent review bottlenecks. Sprint demos "
                "every other Friday were also added to the team calendar."
            ),
            generated_by="seeded",
        ))

        for i, topic in enumerate(["Sprint 24 Wins", "Blockers & Delays", "PR Review Process", "Team Norms", "Sprint Demos"]):
            db.add(KeyTopic(meeting_id=m3.id, topic=topic, order_index=i))

        action_items_m3 = [
            (david, "Create PR review rotation document and set up weekly rotation in team docs", False),
            (carol, "Document 4-hour blocker rule in team norms wiki", False),
            (bob, "Break future large design deliverables into sub-tasks before sprint starts", True),
            (alice, "Add biweekly sprint demo to team calendar (every other Friday, 15 min)", False),
        ]

        for assignee, text, completed in action_items_m3:
            db.add(ActionItem(
                meeting_id=m3.id,
                assignee_id=assignee.id,
                text=text,
                is_completed=completed,
            ))

        # ── Meeting 4: Pricing Strategy Review ───────────────────────────────
        m4 = Meeting(
            title="Pricing Strategy Review — 2024 H2",
            date=datetime.datetime(2024, 8, 12, 9, 0, 0),
            duration_seconds=4080,  # 68 minutes
            media_url=SAMPLE_AUDIO_URL_4,
        )
        m4.participants = [alice, david]
        db.add(m4)
        db.flush()

        m4_segments = [
            (alice, 0.0, 30.0, "Good morning David. Appreciate you joining this one — I wanted your technical perspective on how our pricing tiers map to actual infrastructure costs. Let's start with the current state."),
            (david, 30.0, 65.0, "Sure. So we have three tiers: Free at zero dollars, Starter at 29 per month, and Pro at 79 per month. The enterprise plan is custom. Looking at our infrastructure costs, the Free tier costs us about $4 per active user per month. Starter is $8, Pro is $14."),
            (alice, 65.0, 98.0, "So we're underwater on Free users. That's expected, it's a loss leader. But I'm worried about Starter — at 29 dollars with 8 in infrastructure costs, we have thin margins before we factor in support and overhead."),
            (david, 98.0, 130.0, "Agreed. The Pro tier is actually our healthiest margin — 79 dollars with 14 in infra costs gives us much more room. But only 23% of our paid users are on Pro. Most are on Starter."),
            (alice, 130.0, 162.0, "We need to either raise Starter pricing or add more value to Pro to push users up-tier. What features do Pro users use that Starter users don't have?"),
            (david, 162.0, 195.0, "Looking at the usage data: Pro users heavily use the integrations — Salesforce, HubSpot, Zapier. They also use the longer recording limits — Pro gets up to 4 hours, Starter gets 1 hour. And analytics is big — meeting analytics and team dashboards."),
            (alice, 195.0, 228.0, "Interesting. So recording limits and integrations are the Pro differentiators. What if we made a new mid-tier? Say 49 dollars with 2-hour recordings and basic integrations like Slack and Google Calendar only?"),
            (david, 228.0, 260.0, "Financially that would work. 49 minus approximately 10 in infrastructure costs is a healthy margin. And it could pull in Starter users who need a bit more but can't justify the jump to 79."),
            (alice, 260.0, 292.0, "I also want to revisit our Free tier limits. Right now Free users get 5 meetings per month with unlimited participants. Our churn analysis shows most Free users who don't convert within 90 days never do."),
            (david, 292.0, 325.0, "That tracks. The 90-day activation window is well documented in SaaS literature. Could we reduce the Free tier to 3 meetings per month and add a nudge at meeting 2 to upgrade?"),
            (alice, 325.0, 357.0, "Yes. And we should add a 14-day trial of Pro features for new signups. Currently they go straight to Free. A trial gives them a taste of what they're missing."),
            (david, 357.0, 390.0, "One concern with a 4-tier pricing page — it becomes cognitively overwhelming. Free, Starter, Growth, Pro. Could we reduce cognitive load by having 3 tiers but making the middle tier the obvious recommended choice?"),
            (alice, 390.0, 422.0, "Classic anchor pricing. Put the Pro tier first with 'Most Popular', make the middle tier the rational choice, and make Free look limited. I've seen this work really well in SaaS. Let's A/B test two pricing page designs."),
            (david, 422.0, 455.0, "Also worth noting — our annual plan discount is only 10%. Industry average is 20-25%. Users who pay annually have much lower churn. We could increase the annual discount to 20% and probably more than make it back in reduced churn."),
            (alice, 455.0, 488.0, "Good catch. Let's raise the annual discount to 20%. And let's also look at usage-based pricing for the enterprise tier — something like a base fee plus per-meeting fee over a threshold. That way enterprise accounts that grow just naturally pay more."),
            (david, 488.0, 520.0, "Usage-based enterprise makes a lot of sense. I can build the metering infrastructure to track meeting counts and minutes per account. We're already logging that data, just not surfacing it for billing."),
            (alice, 520.0, 555.0, "Perfect. Alright, let's summarize the decisions. We're introducing a Growth tier at $49. We're reducing Free to 3 meetings per month with a 14-day Pro trial on signup. We're raising the annual discount to 20%. And we're exploring usage-based enterprise pricing."),
            (david, 555.0, 585.0, "I'll put together a technical spec for the Growth tier and the usage metering. Should be ready by end of next week. Who else needs to be looped in? Finance? Sales?"),
            (alice, 585.0, 620.0, "Yes — I'll set up a review meeting with Finance and the Head of Sales. I want their input before we finalize anything. Let's target a launch of the new pricing by September 1st to capitalize on the back-to-school budget cycles."),
        ]

        for i, (speaker, start, end, text) in enumerate(m4_segments):
            db.add(TranscriptSegment(
                meeting_id=m4.id,
                speaker_id=speaker.id,
                start_time_seconds=start,
                end_time_seconds=end,
                text=text,
                order_index=i,
            ))

        db.add(Summary(
            meeting_id=m4.id,
            overview_text=(
                "Alice and David reviewed pricing strategy for H2 2024. Key findings: the Free tier costs ~$4/user/month "
                "in infrastructure, making it a loss leader, while the Starter tier has thin margins ($29 price, ~$8 infra cost). "
                "The team decided to introduce a new 'Growth' tier at $49/month with 2-hour recordings and basic integrations. "
                "Free tier limits will be reduced to 3 meetings/month with a 14-day Pro trial on signup. "
                "The annual discount increases from 10% to 20%, and usage-based enterprise pricing will be explored. "
                "Launch target is September 1st, pending Finance and Sales team review."
            ),
            generated_by="seeded",
        ))

        for i, topic in enumerate(["Tier Margin Analysis", "New Growth Tier ($49)", "Free Tier Limits", "Annual Discount Strategy", "Enterprise Usage-Based Pricing"]):
            db.add(KeyTopic(meeting_id=m4.id, topic=topic, order_index=i))

        action_items_m4 = [
            (david, "Build technical spec for new Growth tier and usage metering infrastructure by end of next week", False),
            (alice, "Schedule pricing review with Finance and Head of Sales before finalizing changes", False),
            (alice, "Prepare A/B test design for two pricing page layouts (anchor pricing experiment)", False),
            (david, "Implement 14-day Pro trial on new user signup (backend + billing changes)", False),
            (alice, "Increase annual plan discount from 10% to 20% in billing system", True),
        ]

        for assignee, text, completed in action_items_m4:
            db.add(ActionItem(
                meeting_id=m4.id,
                assignee_id=assignee.id,
                text=text,
                is_completed=completed,
            ))

        db.commit()
        print("✅ Database seeded successfully!")
        print(f"   • 4 participants created")
        print(f"   • 4 meetings created")
        print(f"   • {sum(len(s) for s in [m1_segments, m2_segments, m3_segments, m4_segments])} transcript segments")
        print(f"   • 4 summaries created")
        print(f"   • 20 key topics created")
        print(f"   • {sum(len(a) for a in [action_items_m1, action_items_m2, action_items_m3, action_items_m4])} action items created")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
