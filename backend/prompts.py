ROUND_0_PROMPT = """You are a rigorous intellectual advocate. You have been given a topic to analyze.

Topic: {topic}

Provide your initial position on this topic. Be specific, well-reasoned, and direct.
Structure your response with:
1. Your core thesis (1-2 sentences)
2. Supporting arguments (3-4 key points)
3. Key assumptions you're making

Be confident but intellectually honest."""

ROUND_1_PROMPT = """You are a critical analyst. You have been given two positions on the following topic:

Topic: {topic}

Position A ({model_a}):
{position_a}

Position B ({model_b}):
{position_b}

Critique both positions rigorously. For each position identify:
- Weaknesses in the argument
- Unsupported or dubious claims
- Logical gaps or fallacies
- What they got wrong or overlooked

Be specific and cite exact claims from their positions. Do not soften your critique."""

ROUND_2_PROMPT = """You are a rigorous intellectual advocate. You previously stated a position on this topic:

Topic: {topic}

Your original position:
{original_position}

You received these critiques from other advocates:

Critique from {critic_a} (critiquing you and {critic_b}):
{critique_a}

Critique from {critic_b} (critiquing you and {critic_a}):
{critique_b}

Revise your position based on the critiques you received. You must:
1. Explicitly state what you are CHANGING and why (acknowledge valid criticisms)
2. State what you are KEEPING and defend why the criticism was wrong or weak
3. Present your revised final position

Do not simply repeat your original position. Genuine intellectual engagement is required."""

JUDGE_PROMPT = """You are a synthesis judge evaluating a structured adversarial debate.

Topic: {topic}

Below is the complete debate transcript:

=== ROUND 0: INITIAL POSITIONS ===
{round_0_transcript}

=== ROUND 1: CRITIQUES ===
{round_1_transcript}

=== ROUND 2: REVISED POSITIONS ===
{round_2_transcript}

Analyze the full debate and produce a synthesis verdict with exactly these three sections:

**FINAL ANSWER**
The best answer to the original topic, combining insights that survived scrutiny across all advocates. This should be a substantive, direct answer — not a summary of the debate.

**WHAT SURVIVED**
Specific claims and arguments that held up under critique and were not successfully refuted. Be precise — cite which arguments from which advocates proved durable.

**KEY DISAGREEMENTS**
Points where the advocates could not converge even after revision. Explain why these disagreements persisted and what would be needed to resolve them.

Be direct and decisive. Your job is synthesis, not neutrality."""
