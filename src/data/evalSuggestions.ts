// Eval-handoff suggestion catalog.
//
// When the Eval (B1) prototype deep-links into Builder with
// `?from=eval&suggestion=<key>&cluster=<id>`, the Builder reads the
// suggestion key here and renders a callout banner above the canvas.
// Keys mirror the suggestion CTAs surfaced on B1's Project Home page.

export type EvalSuggestion = {
  key: string;
  clusterId: string;
  clusterTitle: string;
  callout: {
    headline: string; // bold leading sentence
    body: string; // 1-2 sentences explaining the suggested change
    hint: string; // node-level hint, e.g., "Try inserting a Classify node before the Subagents."
  };
};

export const evalSuggestions: Record<string, EvalSuggestion> = {
  clarification: {
    key: 'clarification',
    clusterId: 'cluster_tool_arg_mismatch',
    clusterTitle: 'Tool-arg mismatch on flight booking',
    callout: {
      headline: 'Eval flagged a tool-arg mismatch cluster.',
      body: 'In the last 14 days, 24 traces failed because the agent invoked flight/hotel tools with missing required args (e.g., destination=null).',
      hint: 'Try inserting a Classify or clarifying-question node before the Subagent fan-out so the lead asks the user for missing details first.',
    },
  },
  safety_prompt_update: {
    key: 'safety_prompt_update',
    clusterId: 'cluster_over_refusal',
    clusterTitle: 'Over-refusal on safe destination prompts',
    callout: {
      headline: 'Eval flagged an over-refusal cluster.',
      body: 'In the last 14 days, 8 traces refused informational travel queries about sanctioned regions (e.g., Cuba) when the use case was personal travel.',
      hint: 'Open the Guardrails node and refine the safety prompt to permit personal-use informational responses for sanctioned destinations.',
    },
  },
  memory_store: {
    key: 'memory_store',
    clusterId: 'cluster_context_drop',
    clusterTitle: 'Context drop on long itinerary sessions',
    callout: {
      headline: 'Eval flagged a context-drop cluster.',
      body: "In the last 14 days, 15 traces lost prior-turn context after turn 6+ — the agent rebuilt day-2 itineraries using day-1's hotel city.",
      hint: 'Try adding a Memory Store node to persist itinerary state across turns; the lead agent can read prior days from the store.',
    },
  },
};
