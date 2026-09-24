<?php

namespace App\Http\Resources;

use App\Models\Poll;
use Illuminate\Http\Resources\Json\JsonResource;

class PollResource extends JsonResource
{
    protected ?int $viewerId = null;

    public function withViewer(?int $id): self
    {
        $this->viewerId = $id;
        return $this;
    }

    public function toArray($request): array
    {
        /** @var Poll $poll */
        $poll = $this->resource;
        $options = array_values($poll->options ?? []);
        $votes = $this->relationLoaded('votes') ? $poll->getRelation('votes') : collect();
        $total = $votes->count();
        $counts = array_fill(0, count($options), 0);
        foreach ($votes as $vote) {
            $idx = (int) $vote->option_index;
            if (array_key_exists($idx, $counts)) {
                $counts[$idx]++;
            }
        }

        $mine = null;
        if ($this->viewerId) {
            $mineVote = $votes->firstWhere('user_id', $this->viewerId);
            $mine = $mineVote ? (int) $mineVote->option_index : null;
        }

        $closed = $poll->isClosed();
        $bars = [];
        foreach ($options as $i => $label) {
            $count = $counts[$i] ?? 0;
            $bars[] = [
                'index' => $i,
                'label' => $label,
                'count' => $count,
                'percent' => $total > 0 ? (int) round(($count / $total) * 100) : 0,
            ];
        }

        return [
            'id' => $poll->id,
            'conversationId' => $poll->conversation_id,
            'question' => $poll->question,
            'options' => $bars,
            'total' => $total,
            'closed' => $closed,
            'closesAt' => $poll->closes_at?->toIso8601String(),
            'myVote' => $mine,
            'isCreator' => $this->viewerId !== null && (int) $poll->user_id === (int) $this->viewerId,
        ];
    }
}
