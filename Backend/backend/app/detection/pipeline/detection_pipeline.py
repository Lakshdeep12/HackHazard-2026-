from __future__ import annotations

import uuid

from app.detection.adversarial.mutation_engine import MutationEngine
from app.detection.classifiers.policy_violation import score_policy_violations
from app.detection.contextual.context_engine import score_contextual_risk
from app.detection.contextual.session_memory import SessionTurn, session_memory
from app.detection.pipeline.decision_engine import decide
from app.detection.pipeline.preprocessing import preprocess_prompt
from app.detection.scoring.risk_engine import RiskEngine, RiskInputs
from app.detection.semantic.semantic_matcher import SemanticMatcher
from app.schemas.request_schema import AnalyzeRequest
from app.schemas.response_schema import AnalyzeResponse, DetectionSignal


class DetectionPipeline:
    """Enterprise AI firewall pipeline composing semantic, regex, and context signals."""

    def __init__(
        self,
        semantic_matcher: SemanticMatcher | None = None,
        risk_engine: RiskEngine | None = None,
        mutation_engine: MutationEngine | None = None,
    ) -> None:
        self.semantic_matcher = semantic_matcher or SemanticMatcher()
        self.risk_engine = risk_engine or RiskEngine()
        self.mutation_engine = mutation_engine or MutationEngine()

    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        normalized = preprocess_prompt(request.prompt)
        history = await session_memory.get_history(request.session_id)

        semantic_score, semantic_category, matches = await self.semantic_matcher.match(normalized)
        policy_score, policy_reasons, policy_category = score_policy_violations(normalized)
        contextual_score, contextual_reasons = score_contextual_risk(normalized, history)
        mutation_probability = self._estimate_mutation_probability(normalized)
        session_history = min(1.0, sum(turn.risk_score for turn in history[-5:]) / 5) if history else 0.0

        weighted_risk = self.risk_engine.score(
            RiskInputs(
                semantic_similarity=semantic_score,
                contextual_risk=contextual_score,
                mutation_probability=mutation_probability,
                policy_score=policy_score,
                session_history=session_history,
            )
        )
        risk_floor = 0.0
        if semantic_score >= 0.78:
            risk_floor = max(risk_floor, semantic_score)
        if policy_score >= 0.7:
            risk_floor = max(risk_floor, 0.82)
        if contextual_score >= 0.6 and policy_score >= 0.35:
            risk_floor = max(risk_floor, 0.8)
        risk_score = max(weighted_risk, risk_floor)
        category = policy_category if policy_score >= semantic_score else semantic_category
        decision = decide(risk_score)

        reasons = sorted(
            set(
                policy_reasons
                + contextual_reasons
                + (["semantic match to known threat"] if semantic_score >= 0.45 else [])
                + (["adversarial mutation indicators"] if mutation_probability >= 0.4 else [])
            )
        )
        signals = [
            DetectionSignal(name="semantic_similarity", score=semantic_score, detail=str(matches[:3])),
            DetectionSignal(name="policy_regex", score=policy_score, detail=", ".join(policy_reasons)),
            DetectionSignal(name="contextual_risk", score=contextual_score, detail=", ".join(contextual_reasons)),
            DetectionSignal(name="mutation_probability", score=mutation_probability, detail="obfuscation heuristic"),
            DetectionSignal(name="session_history", score=session_history, detail=f"{len(history)} prior turns"),
        ]
        response = AnalyzeResponse(
            decision=decision,
            risk_score=risk_score,
            category=category,
            reasons=reasons,
            signals=signals,
            session_id=request.session_id,
            request_id=str(uuid.uuid4()),
        )
        await session_memory.add_turn(
            request.session_id,
            SessionTurn(
                prompt=normalized,
                risk_score=risk_score,
                decision=decision,
                category=category,
            ),
        )
        return response

    def _estimate_mutation_probability(self, text: str) -> float:
        suspicious = 0
        if any(char.isdigit() for char in text) and any(char.isalpha() for char in text):
            suspicious += 1
        if len(text) > 20 and text.count(" ") / max(len(text), 1) > 0.35:
            suspicious += 1
        if any(ord(char) > 127 for char in text):
            suspicious += 1
        variants = self.mutation_engine.generate(text)
        if variants:
            suspicious += 0.5
        return min(1.0, suspicious / 3)
